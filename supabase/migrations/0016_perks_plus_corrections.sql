-- SANAD Perks/PLUS correction round: fixes two real gaps surfaced by the
-- mobile Perks rebuild's own final report.
--
-- Market correction note: partners.market and memberships.market (plus
-- currency) CHECK constraints already allow ('JO','IL') / ('JOD','ILS') -
-- see 0009_jerusalem_pilot.sql. An earlier report in this project claimed
-- memberships.market "only allows JO" - that claim was wrong (0009 was
-- missed at the time); this migration does not touch those CHECK
-- constraints again since they're already correct. What was actually still
-- broken: partners.market's DEFAULT stayed 'JO' from 0008, and
-- admin_upsert_business never wrote a market value at all - so every
-- business created through the real, deployed admin silently landed as
-- 'JO' regardless of where it actually operates (the pilot has only ever
-- been Jerusalem/IL). This migration fixes the default, fixes the RPC to
-- write an explicit (overridable, so a future multi-market admin UI needs
-- no further RPC change) market value, and backfills the one real business
-- this bug has already produced in production.

-- ── 1. partners.market: fix default + backfill the one bug-produced row ─

alter table public.partners alter column market set default 'IL';

-- One-time correction, not a standing behavior: every partners row ever
-- created went through the old 'JO' default regardless of where the
-- business actually operates. admin_upsert_business is fixed below to
-- write market explicitly, so this can't recur - safe to backfill every
-- existing 'JO' row to the only market this project has ever really served.
update public.partners set market = 'IL' where market = 'JO';

-- ── 2. admin_upsert_business: write market explicitly (same validation/
--    shape as 0015's version, market column added to both the insert list
--    and its value list only) ───────────────────────────────────────────

create or replace function public.admin_upsert_business(p_id uuid, p_payload jsonb)
returns public.partners
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.partners;
  v_is_create boolean := p_id is null;
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  if coalesce(p_payload->>'name', '') = '' then
    raise exception 'Business name is required';
  end if;

  if v_is_create then
    insert into public.partners (
      name, category, description, phone, whatsapp, address, latitude, longitude,
      service_area, opening_hours, website_url, social_url, logo_url, slug, status, market
    ) values (
      p_payload->>'name',
      p_payload->>'category',
      p_payload->>'description',
      p_payload->>'phone',
      p_payload->>'whatsapp',
      p_payload->>'address',
      nullif(p_payload->>'latitude', '')::double precision,
      nullif(p_payload->>'longitude', '')::double precision,
      p_payload->>'service_area',
      p_payload->'opening_hours',
      p_payload->>'website_url',
      p_payload->>'social_url',
      p_payload->>'logo_url',
      coalesce(nullif(p_payload->>'slug', ''), lower(regexp_replace(p_payload->>'name', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(gen_random_uuid()::text, 1, 8)),
      'verified',
      coalesce(nullif(p_payload->>'market', ''), 'IL')
    )
    returning * into v_row;

    insert into public.admin_audit_log (admin_id, action, target_type, target_id, target_label)
    values (auth.uid(), 'business_created', 'business', v_row.id, v_row.name);
  else
    update public.partners set
      name = p_payload->>'name',
      category = p_payload->>'category',
      description = p_payload->>'description',
      phone = p_payload->>'phone',
      whatsapp = p_payload->>'whatsapp',
      address = p_payload->>'address',
      latitude = nullif(p_payload->>'latitude', '')::double precision,
      longitude = nullif(p_payload->>'longitude', '')::double precision,
      service_area = p_payload->>'service_area',
      opening_hours = p_payload->'opening_hours',
      website_url = p_payload->>'website_url',
      social_url = p_payload->>'social_url',
      logo_url = p_payload->>'logo_url'
    where id = p_id
    returning * into v_row;

    if v_row.id is null then
      raise exception 'Business not found';
    end if;

    insert into public.admin_audit_log (admin_id, action, target_type, target_id, target_label)
    values (auth.uid(), 'business_edited', 'business', v_row.id, v_row.name);
  end if;

  return v_row;
end;
$$;

grant execute on function public.admin_upsert_business(uuid, jsonb) to authenticated;

-- ── 3. admin_upsert_offer: add member_only (same validation as 0015's
--    version, member_only threaded through both branches + into the audit
--    metadata so its value at each create/edit is visible in history) ───

create or replace function public.admin_upsert_offer(p_id uuid, p_payload jsonb)
returns public.partner_offers
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.partner_offers;
  v_is_create boolean := p_id is null;
  v_business_id uuid := (p_payload->>'business_id')::uuid;
  v_discount_type text := p_payload->>'discount_type';
  v_discount_value numeric := nullif(p_payload->>'discount_value', '')::numeric;
  v_original_price numeric := nullif(p_payload->>'original_price', '')::numeric;
  v_offer_price numeric := nullif(p_payload->>'offer_price', '')::numeric;
  v_valid_from timestamptz := nullif(p_payload->>'valid_from', '')::timestamptz;
  v_valid_until timestamptz := nullif(p_payload->>'valid_until', '')::timestamptz;
  v_member_only boolean := coalesce((p_payload->>'member_only')::boolean, false);
  v_computed_pct numeric;
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  if coalesce(p_payload->>'title', '') = '' then
    raise exception 'Offer title is required';
  end if;

  if v_business_id is null or not exists (select 1 from public.partners where id = v_business_id) then
    raise exception 'A valid business must be selected';
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

  if v_is_create then
    insert into public.partner_offers (
      partner_id, title, description, terms, discount_type, discount_value,
      original_price, offer_price, image_url, valid_from, valid_until, status, member_only
    ) values (
      v_business_id, p_payload->>'title', p_payload->>'description', p_payload->>'terms',
      v_discount_type, v_discount_value, v_original_price, v_offer_price,
      p_payload->>'image_url', v_valid_from, v_valid_until, 'draft', v_member_only
    )
    returning * into v_row;

    insert into public.admin_audit_log (admin_id, action, target_type, target_id, target_label, metadata)
    values (auth.uid(), 'offer_created', 'offer', v_row.id, v_row.title, jsonb_build_object('member_only', v_row.member_only));
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
      member_only = v_member_only
    where id = p_id
    returning * into v_row;

    if v_row.id is null then
      raise exception 'Offer not found';
    end if;

    insert into public.admin_audit_log (admin_id, action, target_type, target_id, target_label, metadata)
    values (auth.uid(), 'offer_edited', 'offer', v_row.id, v_row.title, jsonb_build_object('member_only', v_row.member_only));
  end if;

  return v_row;
end;
$$;

grant execute on function public.admin_upsert_offer(uuid, jsonb) to authenticated;
