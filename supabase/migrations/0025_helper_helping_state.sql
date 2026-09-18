-- Phase 2C: enforce the HELPING state server-side.
--
-- Until now "busy" only existed on the requester side (0020 flips
-- volunteer_profiles.is_available off while the user has an active request of
-- their own). A volunteer who had ACCEPTED a mission stayed is_available =
-- true, so they could:
--   - accept a second request (accept_help_request only checked
--     is_available),
--   - keep seeing open requests through "request read relevant",
--   - keep being paged by notify-new-request,
--   - and have the helper screen's auto-enable upsert re-assert
--     is_available = true at any time.
--
-- Additive only: 0001-0024 are NOT edited. Everything below is a new helper
-- function, a `create or replace` over an existing function, a drop/create of
-- one trigger and one policy, one new partial unique index, and a one-off
-- data backfill of is_available. No table shape changes, no secrets.
--
-- Contents:
--   1. Engagement helpers (who is HELPING / REQUESTING_HELP right now)
--   2. volunteer_profiles: is_available can never be true while engaged
--   3. help_requests trigger: HELPING on accept, AVAILABLE again on
--      complete / cancel / release (extends 0020, requester logic unchanged)
--   4. One active mission per volunteer (DB backstop)
--   5. accept_help_request: locking + "already helping" guard
--   6. "request read relevant": busy helpers don't see open requests
--   7. Backfill is_available for rows that are already engaged
--
-- Active HELPER statuses are exactly the ones between accept and the end of
-- the mission: accepted, on_the_way, arrived, awaiting_confirmation. 'open'
-- is not one (a released request is open again with volunteer_id = null) and
-- completed / cancelled are terminal.
--
-- search_path: new/replaced functions pin `set search_path = ''` (same
-- reasoning as 0024).

-- ── 1. Engagement helpers ────────────────────────────────────────────────

create or replace function public.volunteer_is_helping(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_user_id is not null and exists (
    select 1 from public.help_requests hr
    where hr.volunteer_id = p_user_id
      and hr.status in ('accepted', 'on_the_way', 'arrived', 'awaiting_confirmation')
  )
$$;

-- HELPING or REQUESTING_HELP. The requester half is the exact predicate 0020
-- (and help_requests_one_active_per_requester from 0011) already use.
create or replace function public.volunteer_is_engaged(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_user_id is not null and (
    public.volunteer_is_helping(p_user_id)
    or exists (
      select 1 from public.help_requests hr
      where hr.requester_id = p_user_id
        and hr.status not in ('completed', 'cancelled')
    )
  )
$$;

-- Internal: taking an arbitrary user id, these would let any caller probe
-- whether some other user is currently on a mission.
revoke all on function public.volunteer_is_helping(uuid) from public;

revoke all on function public.volunteer_is_helping(uuid) from anon, authenticated;

revoke all on function public.volunteer_is_engaged(uuid) from public;

revoke all on function public.volunteer_is_engaged(uuid) from anon, authenticated;

-- Caller-scoped wrapper for RLS. Policies run with the querying user's
-- privileges, so this one must stay executable by authenticated; it only ever
-- answers about auth.uid() itself. SECURITY DEFINER so its read of
-- help_requests does not re-enter help_requests' own RLS (the recursion
-- 0003 / 0024 fixed elsewhere).
create or replace function public.current_user_is_helping()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.volunteer_is_helping(auth.uid())
$$;

revoke all on function public.current_user_is_helping() from public;

revoke all on function public.current_user_is_helping() from anon;

grant execute on function public.current_user_is_helping() to authenticated;

-- ── 2. volunteer_profiles: is_available is derived, not client-owned ─────
--
-- The helper screen upserts is_available = true (buildAvailableUpsertPayload)
-- whenever it thinks nothing blocks the user, and "volunteer update self"
-- lets any client write the column directly. Neither may put an engaged user
-- back into the candidate pool. Clamp it in a BEFORE trigger: a write can
-- always turn availability OFF, but ON only sticks when the user is neither
-- helping nor requesting help.
--
-- Race note: for an UPDATE (including upsert's ON CONFLICT DO UPDATE) the
-- BEFORE ROW trigger runs after the row lock is taken, and this plpgsql
-- function is VOLATILE, so the engagement check takes a fresh snapshot. A
-- location ping that was blocked behind accept_help_request's lock on this
-- row therefore sees the committed accept and stays false.

create or replace function public.enforce_volunteer_availability()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.is_available and public.volunteer_is_engaged(new.user_id) then
    new.is_available := false;
  end if;
  return new;
end;
$$;

revoke all on function public.enforce_volunteer_availability() from public;

revoke all on function public.enforce_volunteer_availability() from anon, authenticated;

drop trigger if exists volunteer_profiles_enforce_availability on public.volunteer_profiles;

create trigger volunteer_profiles_enforce_availability
before insert or update on public.volunteer_profiles
for each row execute function public.enforce_volunteer_availability();

-- ── 3. help_requests lifecycle -> availability ──────────────────────────
--
-- Same function/trigger 0020 created, replaced in place so there is still
-- exactly one availability trigger on help_requests.
--
-- Requester half: unchanged behaviour from 0020 (off on insert, back on when
-- their request ends), except "back on" now also requires that they are not
-- currently helping someone else.
--
-- Helper half (new):
--   - becomes HELPING when a row enters an active helper status with them as
--     volunteer_id (accept_help_request)                 -> is_available off
--   - stops HELPING when that row leaves an active helper status or changes
--     volunteer: completed (confirm_help_request_completion), cancelled
--     (admin_cancel_help_request), open again (release_help_request), or the
--     row is deleted                                       -> is_available on,
--     unless still engaged some other way.
--   - on_the_way / arrived / awaiting_confirmation, and a rejected
--     confirmation (awaiting_confirmation -> arrived), are HELPING -> HELPING:
--     no write.
--
-- Restoring does not bump updated_at: the 20-minute presence bound (0007)
-- keeps meaning "the device actually checked in recently", so a helper whose
-- app is gone does not start being paged just because their requester
-- confirmed completion.

create or replace function public.sync_volunteer_availability_with_own_requests()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old_helper uuid;
  v_new_helper uuid;
begin
  -- Requester (0020).
  if TG_OP = 'INSERT' then
    update public.volunteer_profiles
    set is_available = false, updated_at = pg_catalog.now()
    where user_id = new.requester_id;
  elsif TG_OP = 'UPDATE' and new.status in ('completed', 'cancelled') and old.status not in ('completed', 'cancelled') then
    if not public.volunteer_is_engaged(new.requester_id) then
      update public.volunteer_profiles
      set is_available = true, updated_at = pg_catalog.now()
      where user_id = new.requester_id;
    end if;
  end if;

  -- Helper.
  if TG_OP in ('UPDATE', 'DELETE')
     and old.status in ('accepted', 'on_the_way', 'arrived', 'awaiting_confirmation') then
    v_old_helper := old.volunteer_id;
  end if;
  if TG_OP in ('INSERT', 'UPDATE')
     and new.status in ('accepted', 'on_the_way', 'arrived', 'awaiting_confirmation') then
    v_new_helper := new.volunteer_id;
  end if;

  if v_new_helper is not null and v_new_helper is distinct from v_old_helper then
    update public.volunteer_profiles
    set is_available = false
    where user_id = v_new_helper and is_available;
  end if;

  if v_old_helper is not null and v_old_helper is distinct from v_new_helper then
    -- AFTER trigger: this row's new state is already visible, so "engaged"
    -- only finds OTHER active rows.
    if not public.volunteer_is_engaged(v_old_helper) then
      update public.volunteer_profiles
      set is_available = true
      where user_id = v_old_helper and not is_available;
    end if;
  end if;

  if TG_OP = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

revoke all on function public.sync_volunteer_availability_with_own_requests() from public;

revoke all on function public.sync_volunteer_availability_with_own_requests() from anon, authenticated;

drop trigger if exists on_help_request_sync_availability on public.help_requests;

create trigger on_help_request_sync_availability
after insert or update or delete on public.help_requests
for each row execute function public.sync_volunteer_availability_with_own_requests();

-- ── 4. One active mission per volunteer ──────────────────────────────────
--
-- Mirrors help_requests_one_active_per_requester (0011). accept_help_request
-- below already serializes a helper's accepts, so this should never fire in
-- practice; it is the backstop against any other writer (future RPC, admin
-- SQL) producing a double-booked helper.
--
-- Fails loudly instead of half-applying if existing data already violates it.
-- Pre-flight check:
--   select volunteer_id, count(*) from public.help_requests
--   where volunteer_id is not null
--     and status in ('accepted','on_the_way','arrived','awaiting_confirmation')
--   group by 1 having count(*) > 1;

do $$
begin
  if exists (
    select 1 from public.help_requests
    where volunteer_id is not null
      and status in ('accepted', 'on_the_way', 'arrived', 'awaiting_confirmation')
    group by volunteer_id
    having count(*) > 1
  ) then
    raise exception '0025: some volunteer already has more than one active mission; resolve those rows before applying (see pre-flight query in this migration)';
  end if;
end;
$$;

create unique index if not exists help_requests_one_active_per_volunteer
on public.help_requests (volunteer_id)
where volunteer_id is not null
  and status in ('accepted', 'on_the_way', 'arrived', 'awaiting_confirmation');

-- ── 5. accept_help_request ───────────────────────────────────────────────
--
-- Same signature, same return shape and same existing error strings as 0013,
-- so the client (missionRepository.accept) is unaffected. Changes:
--
--  (a) LOCKING. Two concurrent accepts by the same helper for two different
--      requests both used to pass `is_available = true` and both win. Now
--      the request row, then the helper's volunteer_profiles row, are locked
--      FOR UPDATE before any check. That order (request -> profile) is the
--      same order every other writer uses (release / confirm / admin cancel
--      lock the request row, then the AFTER trigger above writes the
--      profile), so it cannot deadlock against them. The second accept
--      blocks on the profile row until the first commits, then re-reads it
--      and finds is_available = false (flipped by the trigger) -> rejected.
--  (b) Explicit "already helping" guard with its own message, independent of
--      is_available, plus translation of a unique_violation on the index in
--      section 4 into that same message.
--  (c) Unchanged: banned check, requester-can't-accept-own, released-by-me
--      check, and "empty result" when the request is no longer open.

create or replace function public.accept_help_request(p_request_id uuid)
returns setof public.help_requests
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_available boolean;
  v_constraint text;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if public.is_banned() then
    raise exception 'Account is banned';
  end if;

  -- (a) Lock order: request row, then helper profile row.
  perform 1 from public.help_requests hr where hr.id = p_request_id for update;

  select vp.is_available into v_available
  from public.volunteer_profiles vp
  where vp.user_id = v_user_id
  for update;

  -- (b) Checked before is_available so a busy helper gets the specific reason.
  if public.volunteer_is_helping(v_user_id) then
    raise exception 'Volunteer already has an active mission';
  end if;

  if v_available is distinct from true then
    raise exception 'Volunteer is not available';
  end if;

  if exists (
    select 1 from public.help_request_releases r
    where r.request_id = p_request_id and r.volunteer_id = v_user_id
  ) then
    raise exception 'You already released this mission';
  end if;

  begin
    return query
    update public.help_requests hr
    set volunteer_id = v_user_id, status = 'accepted', accepted_at = pg_catalog.now()
    where hr.id = p_request_id
      and hr.status = 'open'
      and hr.volunteer_id is null
      and hr.requester_id <> v_user_id
    returning hr.*;
  exception when unique_violation then
    get stacked diagnostics v_constraint = constraint_name;
    if v_constraint = 'help_requests_one_active_per_volunteer' then
      raise exception 'Volunteer already has an active mission';
    end if;
    raise;
  end;
end;
$$;

grant execute on function public.accept_help_request(uuid) to authenticated;

-- ── 6. "request read relevant" ───────────────────────────────────────────
--
-- Identical to 0007 except the open-request branch also requires that the
-- caller is not HELPING. is_available is already forced false for them by
-- sections 2/3; this keeps the read path correct on its own too (e.g. a
-- profile row written before this migration and not yet backfilled, or any
-- future writer that bypasses the trigger). Wrapped in a scalar subquery so
-- it is evaluated once per statement, not once per candidate row. The
-- requester/volunteer branches are untouched: a helper still sees their own
-- active mission.

drop policy if exists "request read relevant" on public.help_requests;

create policy "request read relevant" on public.help_requests for select to authenticated using (
  requester_id = auth.uid()
  or volunteer_id = auth.uid()
  or (
    status = 'open'
    and not (select public.current_user_is_helping())
    and exists (
      select 1 from public.volunteer_profiles vp
      where vp.user_id = auth.uid()
        and vp.is_available = true
        and vp.latitude is not null
        and vp.longitude is not null
        and vp.updated_at > now() - interval '20 minutes'
        and 2 * 6371 * asin(sqrt(
              sin(radians((help_requests.latitude - vp.latitude) / 2)) ^ 2
              + cos(radians(vp.latitude)) * cos(radians(help_requests.latitude))
                * sin(radians((help_requests.longitude - vp.longitude) / 2)) ^ 2
            )) <= 20
    )
  )
);

-- ── 7. Backfill ──────────────────────────────────────────────────────────
--
-- Anyone mid-mission (or mid-request) when this is applied. Setting a boolean
-- to false only; updated_at is left alone. The BEFORE trigger from section 2
-- would reach the same value anyway.

update public.volunteer_profiles vp
set is_available = false
where vp.is_available
  and public.volunteer_is_engaged(vp.user_id);
