-- Requester completion confirmation + volunteer points.
--
-- Today a volunteer can mark a mission "completed" unilaterally. This adds
-- an intermediate 'awaiting_confirmation' status: the volunteer marks
-- assistance finished, the requester confirms (-> completed, points
-- awarded) or rejects (-> back to 'arrived', no points, no dispute record
-- yet - just enough state to build proper dispute handling later).
--
-- Points are awarded ONLY inside confirm_help_request_completion, in the
-- same transaction as the completed status write, guarded by a unique
-- constraint - a request can never award points more than once no matter
-- how many times the RPC is called.

alter table public.help_requests drop constraint if exists help_requests_status_check;
alter table public.help_requests add constraint help_requests_status_check check (
  status in ('open','accepted','on_the_way','arrived','awaiting_confirmation','completed','cancelled')
);

alter table public.help_requests
  add column if not exists awaiting_confirmation_at timestamptz,
  add column if not exists confirmation_rejected_at timestamptz;

-- ── volunteer_point_transactions ────────────────────────────────────────

create table if not exists public.volunteer_point_transactions (
  id uuid primary key default gen_random_uuid(),
  volunteer_id uuid not null references auth.users(id) on delete cascade,
  request_id uuid not null references public.help_requests(id) on delete cascade,
  points integer not null,
  reason text not null default 'completed_verified_mission' check (reason in ('completed_verified_mission')),
  created_at timestamptz not null default now(),
  unique (request_id, reason)
);

create index if not exists volunteer_point_transactions_volunteer_idx on public.volunteer_point_transactions(volunteer_id);

alter table public.volunteer_point_transactions enable row level security;

-- No client INSERT/UPDATE policy at all - the only writer is
-- confirm_help_request_completion below, running as its SECURITY DEFINER
-- owner. A user can only ever read their own point history; admin reads all.
drop policy if exists "point transactions read self" on public.volunteer_point_transactions;
create policy "point transactions read self" on public.volunteer_point_transactions for select to authenticated using (
  volunteer_id = auth.uid()
);
drop policy if exists "point transactions read admin" on public.volunteer_point_transactions;
create policy "point transactions read admin" on public.volunteer_point_transactions for select to authenticated using (
  public.is_admin()
);

-- Configurable points-per-mission, reusing the existing private.app_settings
-- key/value table (already used for the notify-webhook secret) instead of a
-- new single-purpose config table.
insert into private.app_settings (key, value)
values ('points_per_mission', '10')
on conflict (key) do nothing;

-- ── update_help_request_status: volunteer transitions ───────────────────
-- 'completed' is no longer a value the volunteer can set directly; they
-- can only reach 'awaiting_confirmation'. Once there, this RPC also
-- refuses further transitions on that request (status not in (...)) since
-- that decision now belongs to confirm_help_request_completion.

create or replace function public.update_help_request_status(p_request_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_status not in ('on_the_way', 'arrived', 'awaiting_confirmation') then
    raise exception 'Invalid status';
  end if;

  update public.help_requests
  set status = p_status,
      awaiting_confirmation_at = case when p_status = 'awaiting_confirmation' then now() else awaiting_confirmation_at end
  where id = p_request_id
    and volunteer_id = auth.uid()
    and status not in ('completed', 'cancelled', 'awaiting_confirmation');
end;
$$;

-- ── confirm_help_request_completion: requester-only ─────────────────────

create or replace function public.confirm_help_request_completion(p_request_id uuid, p_confirmed boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_volunteer_id uuid;
  v_points integer;
begin
  if p_confirmed then
    update public.help_requests
    set status = 'completed', completed_at = now()
    where id = p_request_id
      and requester_id = auth.uid()
      and status = 'awaiting_confirmation'
    returning volunteer_id into v_volunteer_id;

    if v_volunteer_id is not null then
      select value::integer into v_points from private.app_settings where key = 'points_per_mission';
      v_points := coalesce(v_points, 10);

      insert into public.volunteer_point_transactions (volunteer_id, request_id, points, reason)
      values (v_volunteer_id, p_request_id, v_points, 'completed_verified_mission')
      on conflict (request_id, reason) do nothing;
    end if;
  else
    update public.help_requests
    set status = 'arrived', confirmation_rejected_at = now()
    where id = p_request_id
      and requester_id = auth.uid()
      and status = 'awaiting_confirmation';
  end if;
end;
$$;

grant execute on function public.confirm_help_request_completion(uuid, boolean) to authenticated;
