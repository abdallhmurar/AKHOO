-- Phase 2: real QR redemption + points spending, built on the dormant
-- offer_redemptions table from 0008_commercial_foundation.sql (never used by
-- any RPC or client code until now - table shape only changes below, no data
-- migration risk since it has always been empty).
--
-- Design: points are deducted the moment a redemption is CREATED (status
-- 'pending'), not at final scan - matches "خصم النقاط عند استخدام العرض".
-- The spendable balance is always computed live (earned minus spent), never
-- stored, same "compute don't cache" posture as admin_offer_effective_status
-- (0015). Because of that, "refunding" an expired/cancelled pending
-- redemption needs no separate ledger write at all - the moment its status
-- leaves ('pending','redeemed'), get_points_balance() stops counting its
-- points_spent, which *is* the refund. 'refunded' is kept as its own status
-- (distinct from 'expired'/'cancelled') for the one case that only an admin
-- action can produce: reversing an already-redeemed code after the fact
-- (a partner dispute), as opposed to a still-pending code lapsing on its own.
--
-- volunteer_point_transactions is deliberately NOT touched or reused here:
-- its request_id is not-null and semantically "one row per completed
-- mission" (see 0010), so bending it to also carry offer-redemption debits
-- would mean loosening that constraint for a concept it was never shaped
-- for. Keeping redemption spend inside offer_redemptions.points_spent is the
-- smaller, cleaner change.

alter table public.offer_redemptions
  alter column partner_id drop not null,
  add column if not exists points_spent integer not null default 0,
  add column if not exists updated_at timestamptz not null default now();

alter table public.offer_redemptions add constraint offer_redemptions_points_spent_check
  check (points_spent >= 0);

update public.offer_redemptions set status = 'pending' where status = 'active';

alter table public.offer_redemptions drop constraint if exists offer_redemptions_status_check;
alter table public.offer_redemptions add constraint offer_redemptions_status_check check (
  status in ('pending', 'redeemed', 'expired', 'cancelled', 'refunded')
);
alter table public.offer_redemptions alter column status set default 'pending';

drop trigger if exists offer_redemptions_set_updated_at on public.offer_redemptions;
create trigger offer_redemptions_set_updated_at before update on public.offer_redemptions
for each row execute procedure public.set_updated_at();

-- Configurable redemption window, same private.app_settings key/value table
-- 0010 already uses for points_per_mission - no new settings table needed.
insert into private.app_settings (key, value)
values ('redemption_expiry_minutes', '30')
on conflict (key) do nothing;

-- admin_audit_log: new target_type + actions for admin-side redemption
-- actions. Creating a redemption is a user (not admin) action and isn't
-- logged here, same reasoning 0014/0015 never logged ordinary user writes -
-- the row itself (status/created_at) is already its own record.
alter table public.admin_audit_log drop constraint if exists admin_audit_log_target_type_check;
alter table public.admin_audit_log add constraint admin_audit_log_target_type_check check (
  target_type in ('user', 'volunteer', 'request', 'business', 'offer', 'review', 'redemption')
);

alter table public.admin_audit_log drop constraint if exists admin_audit_log_action_check;
alter table public.admin_audit_log add constraint admin_audit_log_action_check check (
  action in (
    'user_banned', 'user_unbanned',
    'volunteer_verified', 'volunteer_unverified',
    'request_cancelled',
    'business_created', 'business_edited', 'business_activated', 'business_hidden',
    'offer_created', 'offer_edited', 'offer_approved', 'offer_rejected', 'offer_paused',
    'offer_weekly_slot_set',
    'review_hidden', 'review_restored',
    'redemption_redeemed', 'redemption_cancelled', 'redemption_refunded'
  )
);

-- Real spendable balance - earned (volunteer_point_transactions) minus spent
-- (offer_redemptions currently 'pending' or 'redeemed' - see header comment
-- for why 'expired'/'cancelled'/'refunded' are excluded, not refunded via a
-- second write). No security definer: RLS on both source tables already
-- scopes a caller to their own rows (or, for an admin caller, to everyone's -
-- exactly the two audiences that ever need this), so a plain invoker-rights
-- function is both simpler and can't be used to peek at someone else's real
-- balance.
create or replace function public.get_points_balance(p_user_id uuid)
returns integer
language sql
stable
set search_path = public
as $$
  select
    coalesce((select sum(points) from public.volunteer_point_transactions where volunteer_id = p_user_id), 0)
    - coalesce((select sum(points_spent) from public.offer_redemptions where user_id = p_user_id and status in ('pending', 'redeemed')), 0)
$$;

grant execute on function public.get_points_balance(uuid) to authenticated;

-- Sweeps lapsed holds back into the spendable balance (see header comment -
-- this IS the refund, no ledger row needed). Callable by any authenticated
-- user (it only ever moves an objectively-passed-its-expiry pending row to
-- 'expired', never anything a caller could abuse), so both the app (before
-- computing a fresh balance) and the admin redemption RPC below can call it
-- opportunistically instead of relying on a scheduled job - same "compute at
-- read time" posture used throughout this project instead of cron.
create or replace function public.expire_stale_offer_redemptions()
returns void
language sql
security definer
set search_path = public
as $$
  update public.offer_redemptions set status = 'expired' where status = 'pending' and expires_at < now();
$$;

grant execute on function public.expire_stale_offer_redemptions() to authenticated;

-- User-facing: "use offer" - deducts points immediately and issues a
-- short-lived, unguessable code (40 hex chars from 20 random bytes) to
-- render as a QR. Re-validates everything server-side that the client
-- already filtered for (approved + currently valid + real partner
-- verification when one is linked - same predicate as public_offers/0021),
-- same defense-in-depth posture as admin_upsert_offer's own validation.
create or replace function public.create_offer_redemption(p_offer_id uuid)
returns public.offer_redemptions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_offer public.partner_offers;
  v_partner_ok boolean;
  v_balance integer;
  v_minutes integer;
  v_code text;
  v_row public.offer_redemptions;
begin
  if public.is_banned() then
    raise exception 'Account is restricted';
  end if;

  perform public.expire_stale_offer_redemptions();

  select * into v_offer from public.partner_offers where id = p_offer_id;
  if v_offer.id is null then
    raise exception 'Offer not found';
  end if;
  if v_offer.status <> 'approved' then
    raise exception 'Offer is not currently available';
  end if;
  if v_offer.valid_from is not null and v_offer.valid_from > now() then
    raise exception 'Offer is not active yet';
  end if;
  if v_offer.valid_until is not null and v_offer.valid_until < now() then
    raise exception 'Offer has expired';
  end if;

  if v_offer.partner_id is not null then
    select exists(
      select 1 from public.partners p where p.id = v_offer.partner_id and p.status = 'verified' and p.is_active
    ) into v_partner_ok;
    if not v_partner_ok then
      raise exception 'Offer is not currently available';
    end if;
  end if;

  if v_offer.points_required is not null and v_offer.points_required > 0 then
    v_balance := public.get_points_balance(auth.uid());
    if v_balance < v_offer.points_required then
      raise exception 'Not enough points for this offer';
    end if;
  end if;

  select coalesce(value::integer, 30) into v_minutes from private.app_settings where key = 'redemption_expiry_minutes';
  v_minutes := coalesce(v_minutes, 30);

  v_code := encode(gen_random_bytes(20), 'hex');

  insert into public.offer_redemptions (offer_id, partner_id, user_id, code, status, expires_at, points_spent)
  values (p_offer_id, v_offer.partner_id, auth.uid(), v_code, 'pending', now() + (v_minutes || ' minutes')::interval, coalesce(v_offer.points_required, 0))
  returning * into v_row;

  return v_row;
end;
$$;

grant execute on function public.create_offer_redemption(uuid) to authenticated;

-- User (or admin) cancels a still-pending redemption before it's used -
-- e.g. changed their mind, or ended up not going to the partner. Points are
-- implicitly returned the same way expiry returns them (see header).
create or replace function public.cancel_offer_redemption(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows integer;
  v_is_admin boolean := public.is_admin();
begin
  update public.offer_redemptions
  set status = 'cancelled'
  where id = p_id and status = 'pending' and (user_id = auth.uid() or v_is_admin);

  get diagnostics v_rows = row_count;
  if v_rows = 0 then
    raise exception 'Redemption not found or cannot be cancelled';
  end if;

  if v_is_admin then
    insert into public.admin_audit_log (admin_id, action, target_type, target_id)
    values (auth.uid(), 'redemption_cancelled', 'redemption', p_id);
  end if;
end;
$$;

grant execute on function public.cancel_offer_redemption(uuid) to authenticated;

-- Admin/staff-assisted redemption: there is no partner login portal yet (see
-- ADMIN_PANEL_AUDIT.md), so a partner shows their code and admin staff key it
-- into the admin Redemptions page, which calls this. Re-sweeps expiry first
-- so a code that lapsed a second ago can't be redeemed. Matching only
-- status='pending' rows is what makes "same QR twice" impossible - the
-- second attempt simply finds no pending row with that code.
create or replace function public.admin_redeem_offer_code(p_code text)
returns public.offer_redemptions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.offer_redemptions;
  v_title text;
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  perform public.expire_stale_offer_redemptions();

  select * into v_row from public.offer_redemptions where code = p_code and status = 'pending';
  if v_row.id is null then
    raise exception 'Invalid, expired, or already-used code';
  end if;

  update public.offer_redemptions set status = 'redeemed', redeemed_at = now() where id = v_row.id
  returning * into v_row;

  select title into v_title from public.partner_offers where id = v_row.offer_id;

  insert into public.admin_audit_log (admin_id, action, target_type, target_id, target_label, metadata)
  values (auth.uid(), 'redemption_redeemed', 'redemption', v_row.id, v_title, jsonb_build_object('offer_id', v_row.offer_id, 'user_id', v_row.user_id, 'points_spent', v_row.points_spent));

  return v_row;
end;
$$;

grant execute on function public.admin_redeem_offer_code(text) to authenticated;

-- Admin-only reversal of an already-redeemed code (partner dispute, wrong
-- scan, goodwill refund after the fact) - the one transition a still-pending
-- lapse can't produce on its own, which is why it needs its own status.
create or replace function public.admin_refund_redemption(p_id uuid)
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

  update public.offer_redemptions set status = 'refunded' where id = p_id and status = 'redeemed';

  get diagnostics v_rows = row_count;
  if v_rows = 0 then
    raise exception 'Redemption not found or not in a refundable state';
  end if;

  insert into public.admin_audit_log (admin_id, action, target_type, target_id)
  values (auth.uid(), 'redemption_refunded', 'redemption', p_id);
end;
$$;

grant execute on function public.admin_refund_redemption(uuid) to authenticated;
