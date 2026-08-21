-- Round 1 of the web admin dashboard (separate /admin project): an
-- append-only audit trail for every admin mutation, plus three small
-- read-side RPCs the dashboard needs to stay efficient (one aggregate call
-- instead of ~10 round trips for stat cards, one bulk call instead of
-- one-per-row for a paginated volunteers table, one trend-series call for
-- the completions chart).
--
-- No existing RPC signature changes - the mobile app's AdminScreen.tsx
-- keeps calling admin_cancel_help_request / admin_set_user_banned /
-- admin_set_volunteer_verified exactly as before; only their bodies gain
-- an audit insert (guarded by GET DIAGNOSTICS row_count, so a no-op call
-- against an already-terminal/-banned/-verified row doesn't log a fake
-- event).

create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references auth.users(id) on delete set null,
  action text not null check (action in (
    'user_banned', 'user_unbanned',
    'volunteer_verified', 'volunteer_unverified',
    'request_cancelled'
  )),
  target_type text not null check (target_type in ('user', 'volunteer', 'request')),
  target_id uuid not null,
  -- Denormalized display snapshot captured at write time (e.g. the user's
  -- full_name, or the request's first 8 chars) - audit history must stay
  -- readable even if the target row is later changed/deleted, so it never
  -- depends on a join back to a mutable table.
  target_label text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_log_created_idx on public.admin_audit_log (created_at desc);
create index if not exists admin_audit_log_target_idx on public.admin_audit_log (target_type, target_id);
create index if not exists admin_audit_log_admin_idx on public.admin_audit_log (admin_id);

alter table public.admin_audit_log enable row level security;

-- No client INSERT policy at all - same pattern as volunteer_point_transactions
-- and help_request_releases: the only writers are the SECURITY DEFINER RPCs
-- below, running as their owner.
drop policy if exists "audit log read admin" on public.admin_audit_log;
create policy "audit log read admin" on public.admin_audit_log for select to authenticated using (
  public.is_admin()
);

-- ── Extend existing admin RPCs to also write an audit row ───────────────

create or replace function public.admin_cancel_help_request(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows integer;
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  update public.help_requests
  set status = 'cancelled'
  where id = p_request_id
    and status not in ('completed', 'cancelled');

  get diagnostics v_rows = row_count;

  if v_rows > 0 then
    insert into public.admin_audit_log (admin_id, action, target_type, target_id, target_label)
    values (auth.uid(), 'request_cancelled', 'request', p_request_id, left(p_request_id::text, 8));
  end if;
end;
$$;

create or replace function public.admin_set_user_banned(p_user_id uuid, p_banned boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows integer;
  v_name text;
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  select full_name into v_name from public.profiles where id = p_user_id;

  perform set_config('sanad.privileged_write', 'on', true);
  update public.profiles set is_banned = p_banned where id = p_user_id;

  get diagnostics v_rows = row_count;

  if v_rows > 0 then
    insert into public.admin_audit_log (admin_id, action, target_type, target_id, target_label)
    values (auth.uid(), case when p_banned then 'user_banned' else 'user_unbanned' end, 'user', p_user_id, coalesce(v_name, left(p_user_id::text, 8)));
  end if;
end;
$$;

create or replace function public.admin_set_volunteer_verified(p_user_id uuid, p_verified boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows integer;
  v_name text;
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  select full_name into v_name from public.profiles where id = p_user_id;

  perform set_config('sanad.privileged_write', 'on', true);
  update public.volunteer_profiles set is_verified = p_verified where user_id = p_user_id;

  get diagnostics v_rows = row_count;

  if v_rows > 0 then
    insert into public.admin_audit_log (admin_id, action, target_type, target_id, target_label)
    values (auth.uid(), case when p_verified then 'volunteer_verified' else 'volunteer_unverified' end, 'volunteer', p_user_id, coalesce(v_name, left(p_user_id::text, 8)));
  end if;
end;
$$;

-- ── New read RPCs the admin dashboard needs (no existing equivalent) ────

-- One round trip for every Dashboard stat card, instead of ~10 separate
-- count(*) queries. day/week boundaries use Asia/Jerusalem (the pilot's
-- real market per 0009_jerusalem_pilot.sql) rather than the DB session's
-- default UTC, so "completed today" matches what an admin actually means
-- by "today" in the pilot city.
create or replace function public.admin_dashboard_metrics()
returns table (
  total_users integer,
  banned_users integer,
  open_requests integer,
  active_requests integer,
  awaiting_confirmation_requests integer,
  completed_today integer,
  completed_this_week integer,
  cancelled_total integer,
  active_volunteers integer,
  total_volunteers integer,
  verified_volunteers integer,
  total_confirmed_assists integer,
  total_points_awarded bigint
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  return query
  select
    (select count(*) from public.profiles)::integer,
    (select count(*) from public.profiles where is_banned)::integer,
    (select count(*) from public.help_requests where status = 'open')::integer,
    (select count(*) from public.help_requests where status in ('accepted','on_the_way','arrived'))::integer,
    (select count(*) from public.help_requests where status = 'awaiting_confirmation')::integer,
    (select count(*) from public.help_requests where status = 'completed' and completed_at >= date_trunc('day', now() at time zone 'Asia/Jerusalem') at time zone 'Asia/Jerusalem')::integer,
    (select count(*) from public.help_requests where status = 'completed' and completed_at >= date_trunc('week', now() at time zone 'Asia/Jerusalem') at time zone 'Asia/Jerusalem')::integer,
    (select count(*) from public.help_requests where status = 'cancelled')::integer,
    (select count(*) from public.volunteer_profiles where is_available and updated_at > now() - interval '20 minutes')::integer,
    (select count(*) from public.volunteer_profiles)::integer,
    (select count(*) from public.volunteer_profiles where is_verified)::integer,
    (select count(*) from public.help_requests where status = 'completed')::integer,
    (select coalesce(sum(points), 0) from public.volunteer_point_transactions)::bigint;
end;
$$;

grant execute on function public.admin_dashboard_metrics() to authenticated;

-- Bulk version of get_volunteer_completed_count (0013) for a paginated
-- volunteers table - one query instead of one-per-row. Admin-gated (unlike
-- the single-id version, which is intentionally open to any authenticated
-- user for the requester's pre-accept star badge) to avoid turning this
-- into a way to bulk-enumerate volunteer activity data. Volunteers with
-- zero completions are simply absent from the result - callers must
-- default missing ids to 0.
create or replace function public.admin_volunteer_completed_counts(p_volunteer_ids uuid[])
returns table (volunteer_id uuid, completed_count integer)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  return query
  select hr.volunteer_id, count(*)::integer
  from public.help_requests hr
  where hr.volunteer_id = any(p_volunteer_ids)
    and hr.status = 'completed'
  group by hr.volunteer_id;
end;
$$;

grant execute on function public.admin_volunteer_completed_counts(uuid[]) to authenticated;

-- Small trend series for the Dashboard's "completed per day" chart, with no
-- gap days (generate_series left-joined so a zero-completion day still
-- plots at 0 instead of vanishing from the x-axis).
create or replace function public.admin_requests_completed_daily(p_days integer default 14)
returns table (day date, completed_count integer)
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_today_jerusalem date;
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  v_today_jerusalem := (now() at time zone 'Asia/Jerusalem')::date;

  return query
  select d::date, coalesce(count(hr.id), 0)::integer
  from generate_series(
    v_today_jerusalem - (p_days - 1),
    v_today_jerusalem,
    interval '1 day'
  ) d
  left join public.help_requests hr
    on hr.status = 'completed'
    and (hr.completed_at at time zone 'Asia/Jerusalem')::date = d::date
  group by d
  order by d;
end;
$$;

grant execute on function public.admin_requests_completed_daily(integer) to authenticated;
