-- Admin Phase 1: Weekly Offers + Points integration. Lets the admin curate
-- up to 3 real approved offers into "this week's" slots, each with a real
-- points cost, and lets an offer exist with no linked partner at all (a
-- plain AKHOO-branded offer) - both currently impossible.
--
-- Deliberately NOT added:
--   - is_active / is_weekly_offer booleans: `weekly_slot is not null` already
--     means "is a weekly offer", and `status` (+ admin_offer_effective_status,
--     0015) already means "is it active/expired". A parallel boolean would be
--     a second source of truth that can silently drift from the first.
--   - redemption_count: nothing writes it yet (no redemption RPC exists this
--     round) - it would ship permanently zero. A future redemption round
--     should compute it live from offer_redemptions, never a counter to keep
--     in sync by hand.

-- ── 1. partner_offers: new nullable columns, zero impact on existing rows ─

alter table public.partner_offers
  add column if not exists points_required integer,
  add column if not exists weekly_slot smallint,
  add column if not exists redemption_limit integer;

alter table public.partner_offers drop constraint if exists partner_offers_points_required_check;
alter table public.partner_offers add constraint partner_offers_points_required_check
  check (points_required is null or points_required >= 0);

alter table public.partner_offers drop constraint if exists partner_offers_weekly_slot_check;
alter table public.partner_offers add constraint partner_offers_weekly_slot_check
  check (weekly_slot is null or weekly_slot in (1, 2, 3));

alter table public.partner_offers drop constraint if exists partner_offers_redemption_limit_check;
alter table public.partner_offers add constraint partner_offers_redemption_limit_check
  check (redemption_limit is null or redemption_limit > 0);

-- At most one offer per slot at a time - belt-and-suspenders on top of
-- admin_set_weekly_slot() below, which also clears whichever offer
-- previously held the slot being assigned.
create unique index if not exists partner_offers_weekly_slot_unique
  on public.partner_offers (weekly_slot) where weekly_slot is not null;

-- ── 2. partner_id becomes genuinely optional - a "no partner / general
--    AKHOO offer" is now a real, valid state, not just a UI nicety ────────

alter table public.partner_offers alter column partner_id drop not null;

-- ── 3. public_offers view: join -> left join, so a null partner_id offer
--    isn't silently dropped from the feed; the partner-verification check
--    only applies when a partner is actually linked ────────────────────────

create or replace view public.public_offers
with (security_invoker = true) as
select po.*
from public.partner_offers po
left join public.partners p on p.id = po.partner_id
where po.status = 'approved'
  and (po.valid_from is null or po.valid_from <= now())
  and (po.valid_until is null or po.valid_until >= now())
  and (p.id is null or (p.status = 'verified' and p.is_active));

-- ── 4. "partner offers read active" RLS: same predicate change, mirrored
--    for direct table reads (not just the view) ───────────────────────────

drop policy if exists "partner offers read active" on public.partner_offers;
create policy "partner offers read active" on public.partner_offers for select to authenticated using (
  status = 'approved'
  and (valid_from is null or valid_from <= now())
  and (valid_until is null or valid_until >= now())
  and (
    partner_id is null
    or exists (
      select 1 from public.partners p
      where p.id = partner_offers.partner_id and p.status = 'verified' and p.is_active
    )
  )
);
-- "partner offers read admin" (0008) is untouched.

-- ── 5. admin_audit_log: new action for the weekly-slot assignment ──────────

alter table public.admin_audit_log drop constraint if exists admin_audit_log_action_check;
alter table public.admin_audit_log add constraint admin_audit_log_action_check check (
  action in (
    'user_banned', 'user_unbanned',
    'volunteer_verified', 'volunteer_unverified',
    'request_cancelled',
    'business_created', 'business_edited', 'business_activated', 'business_hidden',
    'offer_created', 'offer_edited', 'offer_approved', 'offer_rejected', 'offer_paused',
    'offer_weekly_slot_set',
    'review_hidden', 'review_restored'
  )
);

-- ── 6. admin_upsert_offer: add points_required, relax the "must have a
--    business" validation now that partner_id is genuinely optional (same
--    shape/validation otherwise as 0016's version) ─────────────────────────

create or replace function public.admin_upsert_offer(p_id uuid, p_payload jsonb)
returns public.partner_offers
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.partner_offers;
  v_is_create boolean := p_id is null;
  v_business_id uuid := nullif(p_payload->>'business_id', '')::uuid;
  v_discount_type text := p_payload->>'discount_type';
  v_discount_value numeric := nullif(p_payload->>'discount_value', '')::numeric;
  v_original_price numeric := nullif(p_payload->>'original_price', '')::numeric;
  v_offer_price numeric := nullif(p_payload->>'offer_price', '')::numeric;
  v_valid_from timestamptz := nullif(p_payload->>'valid_from', '')::timestamptz;
  v_valid_until timestamptz := nullif(p_payload->>'valid_until', '')::timestamptz;
  v_member_only boolean := coalesce((p_payload->>'member_only')::boolean, false);
  v_points_required integer := nullif(p_payload->>'points_required', '')::integer;
  v_computed_pct numeric;
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  if coalesce(p_payload->>'title', '') = '' then
    raise exception 'Offer title is required';
  end if;

  -- partner_id is now optional (a general AKHOO offer has none) - but a
  -- *provided* id must still be real, same as every other FK in this
  -- project. The old blanket "must have a business" rule is gone.
  if v_business_id is not null and not exists (select 1 from public.partners where id = v_business_id) then
    raise exception 'Selected business does not exist';
  end if;

  if v_discount_type not in ('percentage', 'fixed', 'special_price', 'free_benefit') then
    raise exception 'Invalid offer type';
  end if;

  if v_original_price is not null and v_original_price < 0 then
    raise exception 'Original price cannot be negative';
  end if;
  if v_offer_price is not null and v_offer_price < 0 then
    raise exception 'Offer price cannot be negative';
  end if;
  if v_original_price is not null and v_offer_price is not null and v_offer_price > v_original_price then
    raise exception 'Offer price cannot exceed the original price';
  end if;

  if v_discount_type = 'percentage' then
    if v_discount_value is null or v_discount_value <= 0 or v_discount_value > 100 then
      raise exception 'Percentage discount must be greater than 0 and no more than 100';
    end if;
    if v_original_price is not null and v_offer_price is not null and v_original_price > 0 then
      v_computed_pct := round((v_original_price - v_offer_price) / v_original_price * 100, 1);
      if abs(v_computed_pct - v_discount_value) > 1.0 then
        raise exception 'Discount percentage % does not match the original/offer price entered (computes to %)', v_discount_value, v_computed_pct;
      end if;
    end if;
  end if;

  if v_discount_type = 'fixed' and (v_discount_value is null or v_discount_value <= 0) then
    raise exception 'Fixed discount amount must be greater than 0';
  end if;

  if v_valid_from is not null and v_valid_until is not null and v_valid_until < v_valid_from then
    raise exception 'Valid-until date cannot precede valid-from date';
  end if;

  if v_points_required is not null and v_points_required < 0 then
    raise exception 'Points required cannot be negative';
  end if;

  if v_is_create then
    insert into public.partner_offers (
      partner_id, title, description, terms, discount_type, discount_value,
      original_price, offer_price, image_url, valid_from, valid_until, status,
      member_only, points_required
    ) values (
      v_business_id, p_payload->>'title', p_payload->>'description', p_payload->>'terms',
      v_discount_type, v_discount_value, v_original_price, v_offer_price,
      p_payload->>'image_url', v_valid_from, v_valid_until, 'draft',
      v_member_only, v_points_required
    )
    returning * into v_row;

    insert into public.admin_audit_log (admin_id, action, target_type, target_id, target_label, metadata)
    values (auth.uid(), 'offer_created', 'offer', v_row.id, v_row.title,
      jsonb_build_object('member_only', v_row.member_only, 'points_required', v_row.points_required));
  else
    update public.partner_offers set
      partner_id = v_business_id,
      title = p_payload->>'title',
      description = p_payload->>'description',
      terms = p_payload->>'terms',
      discount_type = v_discount_type,
      discount_value = v_discount_value,
      original_price = v_original_price,
      offer_price = v_offer_price,
      image_url = p_payload->>'image_url',
      valid_from = v_valid_from,
      valid_until = v_valid_until,
      member_only = v_member_only,
      points_required = v_points_required
    where id = p_id
    returning * into v_row;

    if v_row.id is null then
      raise exception 'Offer not found';
    end if;

    insert into public.admin_audit_log (admin_id, action, target_type, target_id, target_label, metadata)
    values (auth.uid(), 'offer_edited', 'offer', v_row.id, v_row.title,
      jsonb_build_object('member_only', v_row.member_only, 'points_required', v_row.points_required));
  end if;

  return v_row;
end;
$$;

grant execute on function public.admin_upsert_offer(uuid, jsonb) to authenticated;

-- ── 7. admin_set_weekly_slot: dedicated RPC (same granularity as
--    admin_set_offer_status / admin_set_business_active), assigns/clears one
--    of the 3 weekly slots. Only an approved offer can occupy a slot; taking
--    a slot from whoever holds it is automatic, not a separate step. ───────

create or replace function public.admin_set_weekly_slot(p_id uuid, p_slot smallint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_title text;
  v_status text;
  v_rows integer;
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  if p_slot is not null and p_slot not in (1, 2, 3) then
    raise exception 'Weekly slot must be 1, 2, 3, or null';
  end if;

  select title, status into v_title, v_status from public.partner_offers where id = p_id;
  if v_title is null then
    raise exception 'Offer not found';
  end if;

  if p_slot is not null and v_status <> 'approved' then
    raise exception 'Only approved offers can occupy a weekly slot';
  end if;

  if p_slot is not null then
    update public.partner_offers set weekly_slot = null where weekly_slot = p_slot and id <> p_id;
  end if;

  update public.partner_offers set weekly_slot = p_slot where id = p_id;

  get diagnostics v_rows = row_count;
  if v_rows = 0 then
    raise exception 'Offer not found';
  end if;

  insert into public.admin_audit_log (admin_id, action, target_type, target_id, target_label, metadata)
  values (auth.uid(), 'offer_weekly_slot_set', 'offer', p_id, v_title, jsonb_build_object('slot', p_slot));
end;
$$;

grant execute on function public.admin_set_weekly_slot(uuid, smallint) to authenticated;
