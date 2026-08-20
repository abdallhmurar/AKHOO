-- Stabilization round: close two real client-exploitable gaps found during
-- an RLS audit.
--
-- (1) "profiles update self" / "volunteer update self" only ever checked
--     auth.uid() = id/user_id - never which COLUMNS changed. Any logged-in
--     user could call `.from('profiles').update({ is_admin: true })` (or
--     is_banned, or volunteer_profiles.is_verified) directly via PostgREST
--     and self-grant admin / ban immunity / a fake verified badge, fully
--     bypassing the admin_* RPCs that were supposed to be the only path to
--     those flags. Triggers fire on every UPDATE regardless of RLS/role, so
--     they can enforce "these columns only change via an explicit
--     privileged-write opt-in", which only the admin RPCs (and the new
--     bootstrap RPC below) set.
--
-- (2) A banned user could still call accept_help_request /
--     update_help_request_status and operate as an active volunteer -
--     public.is_banned() existed and was already used to block banned
--     *requesters*, it just was never checked on the volunteer side.

create or replace function public.protect_profile_privileged_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if current_setting('sanad.privileged_write', true) is distinct from 'on' then
    new.is_admin := old.is_admin;
    new.is_banned := old.is_banned;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_privileged on public.profiles;
create trigger profiles_protect_privileged
before update on public.profiles
for each row execute function public.protect_profile_privileged_columns();

create or replace function public.protect_volunteer_verified_column()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if current_setting('sanad.privileged_write', true) is distinct from 'on' then
    new.is_verified := old.is_verified;
  end if;
  return new;
end;
$$;

drop trigger if exists volunteer_profiles_protect_verified on public.volunteer_profiles;
create trigger volunteer_profiles_protect_verified
before update on public.volunteer_profiles
for each row execute function public.protect_volunteer_verified_column();

-- Existing admin RPCs now have to explicitly opt in to writing the
-- protected columns (set_config's third arg `true` = transaction-local,
-- resets itself - no cleanup needed).

create or replace function public.admin_set_user_banned(p_user_id uuid, p_banned boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  perform set_config('sanad.privileged_write', 'on', true);
  update public.profiles set is_banned = p_banned where id = p_user_id;
end;
$$;

create or replace function public.admin_set_volunteer_verified(p_user_id uuid, p_verified boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  perform set_config('sanad.privileged_write', 'on', true);
  update public.volunteer_profiles set is_verified = p_verified where user_id = p_user_id;
end;
$$;

-- Bootstrapping the very first admin used to require a manual raw UPDATE
-- from the SQL editor - which the new trigger above would now silently no-op
-- (the trigger fires for every role, editor included). Replace it with an
-- RPC that only ever works while zero admins exist yet, so it can never be
-- used to escalate on a system that already has a real admin.
create or replace function public.admin_bootstrap_first_admin()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if exists (select 1 from public.profiles where is_admin = true) then
    raise exception 'An admin already exists - ask an existing admin to promote you instead.';
  end if;

  perform set_config('sanad.privileged_write', 'on', true);
  update public.profiles set is_admin = true where id = auth.uid();
end;
$$;

grant execute on function public.admin_bootstrap_first_admin() to authenticated;

-- ── Banned volunteers can no longer act on requests ─────────────────────
-- ── + server-side step ordering (previously only enforced client-side by
--    disabling buttons - accepted -> arrived, skipping on_the_way, or
--    arrived -> on_the_way regressions, were both silently accepted) ─────

create or replace function public.accept_help_request(p_request_id uuid)
returns setof public.help_requests
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if public.is_banned() then
    raise exception 'Account is banned';
  end if;

  if not exists (
    select 1 from public.volunteer_profiles
    where user_id = auth.uid() and is_available = true
  ) then
    raise exception 'Volunteer is not available';
  end if;

  return query
  update public.help_requests
  set volunteer_id = auth.uid(), status = 'accepted', accepted_at = now()
  where id = p_request_id
    and status = 'open'
    and volunteer_id is null
    and requester_id <> auth.uid()
  returning *;
end;
$$;

create or replace function public.update_help_request_status(p_request_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current text;
begin
  if p_status not in ('on_the_way', 'arrived', 'awaiting_confirmation') then
    raise exception 'Invalid status';
  end if;

  if public.is_banned() then
    raise exception 'Account is banned';
  end if;

  select status into v_current
  from public.help_requests
  where id = p_request_id and volunteer_id = auth.uid()
  for update;

  if v_current is null then
    raise exception 'Request not found';
  end if;

  if (p_status = 'on_the_way' and v_current <> 'accepted')
     or (p_status = 'arrived' and v_current <> 'on_the_way')
     or (p_status = 'awaiting_confirmation' and v_current <> 'arrived') then
    raise exception 'Invalid status transition';
  end if;

  update public.help_requests
  set status = p_status,
      awaiting_confirmation_at = case when p_status = 'awaiting_confirmation' then now() else awaiting_confirmation_at end
  where id = p_request_id;
end;
$$;

-- ── Defense-in-depth: a requester can no longer open a second active
--    request while one is already in flight. The UI already tries to steer
--    them to the resume banner (RoleScreen.tsx) - this is the server-side
--    backstop for that rule.

create unique index if not exists help_requests_one_active_per_requester
on public.help_requests (requester_id)
where status not in ('completed', 'cancelled');
