-- Admin point adjustments: add or remove points on a user's balance, with a
-- required reason and an audit trail.
--
-- volunteer_point_transactions can't carry these: its request_id is NOT NULL
-- and (request_id, reason) is unique, i.e. it is "one row per completed
-- mission" by construction (0010). Adjustments get their own ledger and are
-- folded into get_points_balance, the single definition of a user's balance
-- used by the app, by redemptions (create_offer_redemption calls it) and by
-- the admin panel - so an adjustment is immediately reflected everywhere,
-- including the mobile app, with no other change.

create table if not exists public.point_adjustments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  points integer not null check (points <> 0),
  reason text not null check (char_length(btrim(reason)) between 1 and 200),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists point_adjustments_user_idx on public.point_adjustments (user_id, created_at desc);

alter table public.point_adjustments enable row level security;

-- A user must be able to read their own rows: get_points_balance is
-- invoker-rights (0024), so the balance the mobile app computes for its own
-- user only includes adjustments that user can see. There is no insert/
-- update/delete policy at all - admin_adjust_points below is the only writer.
drop policy if exists "point adjustments read self" on public.point_adjustments;
create policy "point adjustments read self" on public.point_adjustments for select to authenticated using (
  user_id = (select auth.uid())
);
drop policy if exists "point adjustments read admin" on public.point_adjustments;
create policy "point adjustments read admin" on public.point_adjustments for select to authenticated using (
  public.is_admin()
);

-- Same as 0024's definition plus the adjustments term.
create or replace function public.get_points_balance(p_user_id uuid)
returns integer
language sql
stable
set search_path = ''
as $$
  select (
    coalesce((
      select sum(t.points)
      from public.volunteer_point_transactions t
      where t.volunteer_id = p_user_id
    ), 0)
    + coalesce((
      select sum(a.points)
      from public.point_adjustments a
      where a.user_id = p_user_id
    ), 0)
    - coalesce((
      select sum(r.points_spent)
      from public.offer_redemptions r
      where r.user_id = p_user_id
        and (r.status = 'redeemed' or (r.status = 'pending' and r.expires_at > pg_catalog.now()))
    ), 0)
  )::integer
$$;

-- Balances for a page of users in one round trip (admin users list). Still
-- invoker-rights like get_points_balance, so a non-admin caller only ever
-- gets numbers computed from rows they can already read. Capped so it can't
-- be used to fan out an unbounded number of sub-queries.
create or replace function public.get_points_balances(p_user_ids uuid[])
returns table (user_id uuid, balance integer)
language sql
stable
set search_path = ''
as $$
  select u.id, public.get_points_balance(u.id)
  from pg_catalog.unnest(p_user_ids[1:200]) as u(id)
$$;

revoke all on function public.get_points_balances(uuid[]) from public, anon;
grant execute on function public.get_points_balances(uuid[]) to authenticated;

-- admin_audit_log: allow the new action, extending whatever the live
-- constraint currently is (same approach as 0029) rather than restating a
-- list that later migrations have since grown.
do $$
declare
  v_check text;
begin
  select pg_get_expr(conbin, conrelid) into v_check from pg_constraint
  where conrelid = 'public.admin_audit_log'::regclass and conname = 'admin_audit_log_action_check';
  if v_check like '%points_adjusted%' then
    return;
  end if;
  alter table public.admin_audit_log drop constraint admin_audit_log_action_check;
  execute format('alter table public.admin_audit_log add constraint admin_audit_log_action_check check ((%s) or action = %L)', v_check, 'points_adjusted');
end;
$$;

-- p_points > 0 adds, < 0 removes. Returns the new balance.
create or replace function public.admin_adjust_points(p_user_id uuid, p_points integer, p_reason text)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_reason text := pg_catalog.btrim(coalesce(p_reason, ''));
  v_name text;
  v_balance integer;
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  if p_points is null or p_points = 0 or p_points not between -100000 and 100000 then
    raise exception 'Points must be a non-zero whole number between -100000 and 100000';
  end if;

  if pg_catalog.char_length(v_reason) not between 1 and 200 then
    raise exception 'A reason of up to 200 characters is required';
  end if;

  select full_name into v_name from public.profiles where id = p_user_id;
  if not found then
    raise exception 'User not found';
  end if;

  -- The same per-user lock create_offer_redemption takes (0024), so a
  -- removal and a concurrent redemption can't both pass their balance check
  -- against the same starting balance.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('akhoo.offer_redemption.user:' || p_user_id::text, 0));

  v_balance := public.get_points_balance(p_user_id);
  if p_points < 0 and v_balance + p_points < 0 then
    raise exception 'Cannot remove % points: the user only has % available', -p_points, v_balance;
  end if;

  insert into public.point_adjustments (user_id, points, reason, created_by)
  values (p_user_id, p_points, v_reason, auth.uid());

  insert into public.admin_audit_log (admin_id, action, target_type, target_id, target_label, metadata)
  values (auth.uid(), 'points_adjusted', 'user', p_user_id, v_name, pg_catalog.jsonb_build_object('points', p_points, 'reason', v_reason));

  return v_balance + p_points;
end;
$$;

revoke all on function public.admin_adjust_points(uuid, integer, text) from public, anon;
grant execute on function public.admin_adjust_points(uuid, integer, text) to authenticated;
