-- Phase 3: simple volunteer experience + real activity levels.
--
-- Two new pieces of server logic, both additive (no destructive schema
-- changes, no touching prior migrations):
--
-- 1. get_volunteer_completed_count(): a requester needs to see how many
--    missions a volunteer has *ever* completed (the Activity Star's source
--    of truth), not just missions between the two of them - the existing
--    "request read relevant" RLS policy only exposes help_requests rows the
--    current user is a party to, which is correct and should stay that way.
--    A narrow SECURITY DEFINER function returns just the count (no request
--    details, no other user's data) for any volunteer id.
--
-- 2. release_help_request(): a volunteer who accepted a request but can no
--    longer complete it needs a safe way out. This resets the request back
--    to 'open' (no new status value added - avoids touching the existing
--    status CHECK constraint) and records the release in a small history
--    table, so it never silently disappears from anyone's history and so a
--    volunteer can't immediately re-accept the exact same request they just
--    walked away from.

create or replace function public.get_volunteer_completed_count(p_volunteer_id uuid)
returns integer
language sql
security definer
set search_path = public
stable
as $$
  select count(*)::integer
  from public.help_requests
  where volunteer_id = p_volunteer_id
    and status = 'completed'
$$;

grant execute on function public.get_volunteer_completed_count(uuid) to authenticated;

-- ── Release history ──────────────────────────────────────────────────────

create table if not exists public.help_request_releases (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.help_requests(id) on delete cascade,
  volunteer_id uuid not null references auth.users(id) on delete cascade,
  reason text check (reason in ('cannot_reach', 'emergency', 'accepted_by_mistake', 'other')),
  released_at timestamptz not null default now()
);

create index if not exists help_request_releases_volunteer_idx on public.help_request_releases(volunteer_id);
create index if not exists help_request_releases_request_idx on public.help_request_releases(request_id);

alter table public.help_request_releases enable row level security;

-- No client INSERT policy - the only writer is release_help_request below.
-- A volunteer can see their own release history (History screen); admin
-- sees all. Not exposed to the requester - "a previous volunteer released
-- this" is conveyed via the request's own status, not by naming who left.
drop policy if exists "release history read self" on public.help_request_releases;
create policy "release history read self" on public.help_request_releases for select to authenticated using (
  volunteer_id = auth.uid()
);
drop policy if exists "release history read admin" on public.help_request_releases;
create policy "release history read admin" on public.help_request_releases for select to authenticated using (
  public.is_admin()
);

create or replace function public.release_help_request(p_request_id uuid, p_reason text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
  v_volunteer_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if p_reason is not null and p_reason not in ('cannot_reach', 'emergency', 'accepted_by_mistake', 'other') then
    raise exception 'Invalid reason';
  end if;

  select status, volunteer_id into v_status, v_volunteer_id
  from public.help_requests
  where id = p_request_id
  for update;

  if v_volunteer_id is null or v_volunteer_id <> auth.uid() then
    raise exception 'Not your mission';
  end if;

  if v_status not in ('accepted', 'on_the_way', 'arrived') then
    raise exception 'Mission cannot be released from its current state';
  end if;

  update public.help_requests
  set volunteer_id = null, status = 'open', accepted_at = null
  where id = p_request_id;

  insert into public.help_request_releases (request_id, volunteer_id, reason)
  values (p_request_id, auth.uid(), p_reason);
end;
$$;

grant execute on function public.release_help_request(uuid, text) to authenticated;

-- A volunteer who released a request can't immediately re-claim the exact
-- same one - keeps release from being used to "hold" a request while
-- deciding, and keeps the signal meaningful (released means released).
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

  if exists (
    select 1 from public.help_request_releases
    where request_id = p_request_id and volunteer_id = auth.uid()
  ) then
    raise exception 'You already released this mission';
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
