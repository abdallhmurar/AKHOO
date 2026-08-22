-- Admin Round 2: real Businesses + Offers + Reviews, on top of the dormant
-- commercial foundation from 0008_commercial_foundation.sql. That migration
-- shipped `partners`/`partner_offers` with zero client-facing UI ever built
-- against them (verified: both tables are still empty in production), so
-- every change below is a free, zero-risk extension/rename of an unused
-- foundation - not a data migration.
--
-- Deliberately NOT renamed: the `partners`/`partner_offers` table names and
-- `partner_id` FK columns stay as-is. Renaming them to "businesses" would
-- touch RLS policies, indexes, and three other dormant tables' FKs
-- (offer_redemptions, partner_transactions, professional_requests) for a
-- purely cosmetic win - the admin UI's own TypeScript/React layer is where
-- "Business"/"Offer" terminology actually matters to anyone, and that's
-- fully controlled separately. `starts_at`/`ends_at` ARE renamed to
-- `valid_from`/`valid_until` below - unlike the table/FK names, this pair
-- is central to the date-gating logic threaded through the public view,
-- the admin validation RPC, and the admin UI, so the clarity is worth the
-- (still free, still zero-risk) rename.
--
-- Untouched, still fully dormant, out of scope this round: memberships,
-- offer_redemptions, partner_transactions, professional_requests (the
-- commission/dispatch model this round explicitly does not build).

-- ── partners: extend with the fields this round's brief asks for ───────

alter table public.partners
  add column if not exists whatsapp text,
  add column if not exists opening_hours jsonb,
  add column if not exists website_url text,
  add column if not exists social_url text,
  add column if not exists service_area text,
  add column if not exists is_active boolean not null default true;

comment on column public.partners.opening_hours is
  'Freeform {"sun":"9:00-18:00",...} map - no fixed schema, keeps this from becoming seven near-identical columns for something no UI has needed to query structurally yet.';

-- This round's brief explicitly lists "garages/workshops" and "auto
-- electricians" as categories, neither of which existed in 0008's original
-- set - added here, nothing removed (0008's category list is illustrative
-- ("such as"), not a hard replacement, so locksmith/mobile_mechanic stay).
alter table public.partners drop constraint if exists partners_category_check;
alter table public.partners add constraint partners_category_check check (
  category in ('battery', 'tire', 'maintenance', 'towing', 'locksmith', 'mobile_mechanic', 'workshop', 'auto_electrician', 'car_wash', 'inspection', 'other')
);

-- ── business_photos: a gallery, separate from the single `logo_url` ────
-- already on partners - lets admin add/remove/reorder without touching the
-- business row itself.

create table if not exists public.business_photos (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.partners(id) on delete cascade,
  url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists business_photos_business_idx on public.business_photos (business_id, sort_order);

alter table public.business_photos enable row level security;

-- One-directional reference into partners only (mirrors partner_offers'
-- existing read-active policy) - partners' own policies never query
-- business_photos back, so this can't recreate the profiles/help_requests
-- mutual-recursion bug documented in 0002/0003.
drop policy if exists "business photos read public" on public.business_photos;
create policy "business photos read public" on public.business_photos for select to authenticated using (
  exists (select 1 from public.partners p where p.id = business_photos.business_id and p.status = 'verified' and p.is_active)
);
drop policy if exists "business photos read admin" on public.business_photos;
create policy "business photos read admin" on public.business_photos for select to authenticated using (
  public.is_admin()
);
-- No client insert/update/delete policy - admin manages photos through the
-- admin app using the authenticated admin's own session, gated the same
-- way every other admin-only write in this project is: a WITH CHECK/USING
-- clause requiring is_admin(), not a SECURITY DEFINER RPC, since a photo
-- row has no audit-log requirement of its own (only the parent business's
-- edit event is logged - see admin_audit_log below).
drop policy if exists "business photos admin write" on public.business_photos;
create policy "business photos admin write" on public.business_photos for all to authenticated using (
  public.is_admin()
) with check (
  public.is_admin()
);

-- ── partner_offers: rename the validity-window columns, add price fields,
--    replace the status lifecycle with the one this round's brief spec's
--    exactly (draft -> pending_review -> approved -> rejected/paused;
--    "expired" is never a stored transition, only ever a computed date
--    comparison - see admin_offer_effective_status() below) ────────────

alter table public.partner_offers rename column starts_at to valid_from;
alter table public.partner_offers rename column ends_at to valid_until;

alter table public.partner_offers
  add column if not exists original_price numeric(10,3),
  add column if not exists offer_price numeric(10,3),
  add column if not exists image_url text;

alter table public.partner_offers drop constraint if exists partner_offers_status_check;
alter table public.partner_offers add constraint partner_offers_status_check check (
  status in ('draft', 'pending_review', 'approved', 'rejected', 'paused', 'expired')
);
alter table public.partner_offers alter column status set default 'draft';

-- A stored 'expired' value is still allowed (a paused/rejected offer whose
-- window has long passed can be left however an admin last set it), but
-- nothing in this migration ever writes it automatically - public
-- visibility and the admin "expired" filter both compute it live from
-- valid_until, per the brief's explicit "don't require a scheduled job".
create or replace function public.admin_offer_effective_status(p_status text, p_valid_until timestamptz)
returns text
language sql
immutable
as $$
  select case
    when p_status = 'approved' and p_valid_until is not null and p_valid_until < now() then 'expired'
    else p_status
  end
$$;

-- ── partners RLS: fold the new is_active flag into the existing
--    "read verified" policy (unchanged shape/name otherwise) ───────────

drop policy if exists "partners read verified" on public.partners;
create policy "partners read verified" on public.partners for select to authenticated using (
  status = 'verified' and is_active
);
-- "partners read admin" (0008) is untouched - admin still sees every row
-- regardless of status/is_active.

-- ── partner_offers RLS: status='approved' (was 'active') + renamed
--    valid_from/valid_until + the parent partner's is_active ───────────

drop policy if exists "partner offers read active" on public.partner_offers;
create policy "partner offers read active" on public.partner_offers for select to authenticated using (
  status = 'approved'
  and (valid_from is null or valid_from <= now())
  and (valid_until is null or valid_until >= now())
  and exists (
    select 1 from public.partners p
    where p.id = partner_offers.partner_id and p.status = 'verified' and p.is_active
  )
);
-- "partner offers read admin" (0008) is untouched.

-- ── reviews (businesses only, not volunteers - see AdminScreen.tsx /
--    volunteer_point_transactions for the separate volunteer system) ───

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.partners(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  is_hidden boolean not null default false,
  created_at timestamptz not null default now(),
  -- One review per user per business - the sensible, minimal anti-spam
  -- rule (matches this project's established restraint: e.g. completion-
  -- confirmation's dispute handling was deliberately left minimal rather
  -- than inventing a novel policy). No edit path is exposed to the client
  -- either (no UPDATE policy below) - resubmission isn't possible, so
  -- there's nothing to spam beyond this.
  unique (business_id, user_id)
);

create index if not exists reviews_business_idx on public.reviews (business_id);
create index if not exists reviews_user_idx on public.reviews (user_id);

alter table public.reviews enable row level security;

-- Insert: a real user-facing write path, even though no mobile screen
-- calls it yet this round (the brief's "backend/API contract must be
-- ready" - see admin/e2e or a future mobile round for the actual
-- submission UI). Blocked for banned users, same public.is_banned() used
-- everywhere else a client write needs that check.
drop policy if exists "reviews insert self" on public.reviews;
create policy "reviews insert self" on public.reviews for insert to authenticated with check (
  auth.uid() = user_id and not public.is_banned()
);

drop policy if exists "reviews read visible" on public.reviews;
create policy "reviews read visible" on public.reviews for select to authenticated using (
  (not is_hidden and exists (select 1 from public.partners p where p.id = reviews.business_id and p.status = 'verified' and p.is_active))
  or user_id = auth.uid()
  or public.is_admin()
);
-- No client update/delete policy - moderation (is_hidden) is admin-RPC-only
-- (admin_set_review_hidden below), so admin can never silently rewrite a
-- user's rating/comment text to flatter a business, only hide/restore it.

-- Real average rating + review count, computed from currently-visible
-- reviews only - security_invoker so it evaluates RLS as the querying
-- user (PostgREST role), not as whatever role ran this migration; without
-- it a view can silently bypass the reviews RLS above entirely.
create or replace view public.business_ratings
with (security_invoker = true) as
select business_id, round(avg(rating)::numeric, 2) as average_rating, count(*) as review_count
from public.reviews
where not is_hidden
group by business_id;

grant select on public.business_ratings to authenticated;

-- Mirrors public_offers below - date/status filtering encapsulated once
-- instead of duplicated in every future mobile query. security_invoker so
-- it's still fully gated by the partners/partner_offers RLS above, not a
-- bypass of it.
create or replace view public.public_offers
with (security_invoker = true) as
select po.*
from public.partner_offers po
join public.partners p on p.id = po.partner_id
where po.status = 'approved'
  and (po.valid_from is null or po.valid_from <= now())
  and (po.valid_until is null or po.valid_until >= now())
  and p.status = 'verified'
  and p.is_active;

grant select on public.public_offers to authenticated;

-- ── admin_audit_log: extend action/target_type for the new event types ─

alter table public.admin_audit_log drop constraint if exists admin_audit_log_action_check;
alter table public.admin_audit_log add constraint admin_audit_log_action_check check (
  action in (
    'user_banned', 'user_unbanned',
    'volunteer_verified', 'volunteer_unverified',
    'request_cancelled',
    'business_created', 'business_edited', 'business_activated', 'business_hidden',
    'offer_created', 'offer_edited', 'offer_approved', 'offer_rejected', 'offer_paused',
    'review_hidden', 'review_restored'
  )
);

alter table public.admin_audit_log drop constraint if exists admin_audit_log_target_type_check;
alter table public.admin_audit_log add constraint admin_audit_log_target_type_check check (
  target_type in ('user', 'volunteer', 'request', 'business', 'offer', 'review')
);

-- ── Admin write RPCs - every business/offer/review mutation goes through
--    one of these rather than a raw RLS-gated client write, so the audit
--    row is always atomic with the mutation (same posture as 0014's
--    admin_set_user_banned etc). Business/offer writes take a single jsonb
--    payload rather than a 12-parameter signature - simpler to extend, and
--    lets this function whitelist/validate fields in one place. ─────────

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
      service_area, opening_hours, website_url, social_url, logo_url, slug, status
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
      'verified'
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

create or replace function public.admin_set_business_active(p_id uuid, p_active boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
  v_rows integer;
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  update public.partners set is_active = p_active where id = p_id
  returning name into v_name;

  get diagnostics v_rows = row_count;
  if v_rows = 0 then
    raise exception 'Business not found';
  end if;

  insert into public.admin_audit_log (admin_id, action, target_type, target_id, target_label)
  values (auth.uid(), case when p_active then 'business_activated' else 'business_hidden' end, 'business', p_id, v_name);
end;
$$;

grant execute on function public.admin_set_business_active(uuid, boolean) to authenticated;

-- Real, server-side validation - defense in depth beyond the admin UI's
-- own form validation. Every rule below matches the brief's section 8
-- exactly: no negative prices, offer price can't exceed original price,
-- valid_until can't precede valid_from, percentage must be mathematically
-- consistent with original/offer price when both are given, no >100%
-- discount. Nothing here invents a market-price claim - it only checks
-- internal consistency of what the admin actually entered.
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
      original_price, offer_price, image_url, valid_from, valid_until, status
    ) values (
      v_business_id, p_payload->>'title', p_payload->>'description', p_payload->>'terms',
      v_discount_type, v_discount_value, v_original_price, v_offer_price,
      p_payload->>'image_url', v_valid_from, v_valid_until, 'draft'
    )
    returning * into v_row;

    insert into public.admin_audit_log (admin_id, action, target_type, target_id, target_label)
    values (auth.uid(), 'offer_created', 'offer', v_row.id, v_row.title);
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
      valid_until = v_valid_until
    where id = p_id
    returning * into v_row;

    if v_row.id is null then
      raise exception 'Offer not found';
    end if;

    insert into public.admin_audit_log (admin_id, action, target_type, target_id, target_label)
    values (auth.uid(), 'offer_edited', 'offer', v_row.id, v_row.title);
  end if;

  return v_row;
end;
$$;

grant execute on function public.admin_upsert_offer(uuid, jsonb) to authenticated;

create or replace function public.admin_set_offer_status(p_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_title text;
  v_rows integer;
  v_action text;
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  -- 'expired' is never set through this path - it's a computed read-time
  -- state (admin_offer_effective_status), not a real transition an admin
  -- performs.
  if p_status not in ('approved', 'rejected', 'paused', 'draft') then
    raise exception 'Invalid status transition';
  end if;

  update public.partner_offers set status = p_status where id = p_id
  returning title into v_title;

  get diagnostics v_rows = row_count;
  if v_rows = 0 then
    raise exception 'Offer not found';
  end if;

  v_action := case p_status
    when 'approved' then 'offer_approved'
    when 'rejected' then 'offer_rejected'
    when 'paused' then 'offer_paused'
    else null
  end;

  if v_action is not null then
    insert into public.admin_audit_log (admin_id, action, target_type, target_id, target_label)
    values (auth.uid(), v_action, 'offer', p_id, v_title);
  end if;
end;
$$;

grant execute on function public.admin_set_offer_status(uuid, text) to authenticated;

create or replace function public.admin_set_review_hidden(p_id uuid, p_hidden boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows integer;
  v_label text;
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  update public.reviews set is_hidden = p_hidden where id = p_id
  returning left(coalesce(comment, ''), 40) into v_label;

  get diagnostics v_rows = row_count;
  if v_rows = 0 then
    raise exception 'Review not found';
  end if;

  insert into public.admin_audit_log (admin_id, action, target_type, target_id, target_label)
  values (auth.uid(), case when p_hidden then 'review_hidden' else 'review_restored' end, 'review', p_id, v_label);
end;
$$;

grant execute on function public.admin_set_review_hidden(uuid, boolean) to authenticated;

-- ── Storage: business photo/logo uploads ────────────────────────────────

insert into storage.buckets (id, name, public)
values ('business-photos', 'business-photos', true)
on conflict (id) do nothing;

drop policy if exists "business photos storage public read" on storage.objects;
create policy "business photos storage public read" on storage.objects for select to public using (
  bucket_id = 'business-photos'
);

drop policy if exists "business photos storage admin insert" on storage.objects;
create policy "business photos storage admin insert" on storage.objects for insert to authenticated with check (
  bucket_id = 'business-photos' and public.is_admin()
);

drop policy if exists "business photos storage admin update" on storage.objects;
create policy "business photos storage admin update" on storage.objects for update to authenticated using (
  bucket_id = 'business-photos' and public.is_admin()
);

drop policy if exists "business photos storage admin delete" on storage.objects;
create policy "business photos storage admin delete" on storage.objects for delete to authenticated using (
  bucket_id = 'business-photos' and public.is_admin()
);
