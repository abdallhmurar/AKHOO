-- SANAD commercial foundation (phase 1 of the business-model expansion):
-- SANAD+ memberships, the partner-business network, partner offers, offer
-- redemptions, partner transactions (commission audit), and professional
-- (paid) service requests.
--
-- This phase is DB-only foundation: no client write path is opened for
-- anything security/audit-sensitive yet (memberships, partner_transactions)
-- or for anything whose write semantics depend on business logic that
-- doesn't exist yet (offer_redemptions' code generation). Those follow the
-- same "no direct client mutation, SECURITY DEFINER RPC only" idiom already
-- established for help_requests (see supabase/schema.sql) once their
-- respective UI phases land.
--
-- RLS recursion note (see 0002_v0_2_features.sql / 0003_fix_help_requests_
-- recursion.sql for the two production incidents this avoids): none of the
-- policies below run a raw cross-table subquery back into public.profiles
-- or public.help_requests, so neither prior recursion bug can recur here.
-- The one cross-table check added below - partner_offers' read policy
-- confirming its parent partner is still 'verified' - is a ONE-DIRECTIONAL
-- reference (partner_offers -> partners); partners' own policies never
-- query partner_offers back, so there is no cycle for Postgres to reject.
-- All admin checks reuse the existing public.is_admin() SECURITY DEFINER
-- helper; no new helper functions are required for these six tables.

-- ── memberships (SANAD+) ────────────────────────────────────────────────

create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan text not null default 'sanad_plus' check (plan in ('sanad_plus')),
  market text not null check (market in ('JO')),
  currency text not null check (currency in ('JOD')),
  amount numeric(10,3) not null,
  status text not null default 'pending' check (status in ('pending','active','expired','cancelled','failed')),
  starts_at timestamptz,
  expires_at timestamptz,
  auto_renew boolean not null default false,
  payment_provider text,
  provider_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists memberships_user_status_idx on public.memberships(user_id, status);

-- ── partners ─────────────────────────────────────────────────────────────

create table if not exists public.partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  category text not null check (category in ('battery','tire','maintenance','towing','locksmith','mobile_mechanic','car_wash','inspection','other')),
  description text,
  logo_url text,
  phone text,
  latitude double precision,
  longitude double precision,
  address text,
  market text not null default 'JO' check (market in ('JO')),
  status text not null default 'pending' check (status in ('pending','verified','suspended','rejected')),
  commission_type text not null default 'none' check (commission_type in ('none','fixed','percentage')),
  commission_value numeric(10,3) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists partners_market_status_idx on public.partners(market, status);

-- ── partner_offers ───────────────────────────────────────────────────────

create table if not exists public.partner_offers (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete cascade,
  title text not null,
  description text,
  discount_type text not null check (discount_type in ('percentage','fixed','special_price','free_benefit')),
  discount_value numeric(10,3),
  member_only boolean not null default false,
  starts_at timestamptz,
  ends_at timestamptz,
  terms text,
  status text not null default 'draft' check (status in ('draft','submitted','approved','active','paused','expired','rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists partner_offers_partner_status_idx on public.partner_offers(partner_id, status);
create index if not exists partner_offers_status_ends_idx on public.partner_offers(status, ends_at);

-- ── offer_redemptions ────────────────────────────────────────────────────
-- Table shape only this phase. The actual "generate a short-lived
-- redemption code" flow is business logic (uniqueness/unpredictability,
-- membership and offer-validity checks) that belongs in a future SECURITY
-- DEFINER RPC, not a raw client INSERT - same "no direct write for anything
-- security/audit-sensitive" posture already established for help_requests'
-- state transitions. No client INSERT policy is granted yet.

create table if not exists public.offer_redemptions (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.partner_offers(id) on delete cascade,
  partner_id uuid not null references public.partners(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  code text not null unique,
  status text not null default 'active' check (status in ('active','redeemed','expired','cancelled')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  redeemed_at timestamptz
);

create index if not exists offer_redemptions_user_idx on public.offer_redemptions(user_id);
create index if not exists offer_redemptions_offer_idx on public.offer_redemptions(offer_id);
create index if not exists offer_redemptions_partner_idx on public.offer_redemptions(partner_id);

-- ── partner_transactions (commission audit) ─────────────────────────────
-- Backend/RPC-populated only, admin-read-only from the client. Commission
-- terms are snapshotted per row (not just looked up from partners) so a
-- later change to a partner's commission_type/commission_value doesn't
-- rewrite the historical record of what applied at transaction time.

create table if not exists public.partner_transactions (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  offer_id uuid references public.partner_offers(id) on delete set null,
  redemption_id uuid references public.offer_redemptions(id) on delete set null,
  gross_amount numeric(10,3),
  commission_type text not null default 'none' check (commission_type in ('none','fixed','percentage')),
  commission_value numeric(10,3) not null default 0,
  commission_amount numeric(10,3),
  currency text not null default 'JOD' check (currency in ('JOD')),
  status text not null default 'pending' check (status in ('pending','confirmed','void')),
  created_at timestamptz not null default now()
);

create index if not exists partner_transactions_partner_idx on public.partner_transactions(partner_id);
create index if not exists partner_transactions_user_idx on public.partner_transactions(user_id);

-- ── professional_requests ────────────────────────────────────────────────

create table if not exists public.professional_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  partner_id uuid references public.partners(id) on delete set null,
  service_type text not null check (service_type in ('towing','battery','tire','locksmith','mobile_mechanic')),
  requester_lat double precision not null,
  requester_lng double precision not null,
  quoted_price numeric(10,3),
  currency text not null default 'JOD' check (currency in ('JOD')),
  payment_mode text not null default 'direct_to_partner' check (payment_mode in ('direct_to_partner','in_app_payment')),
  status text not null default 'requested' check (status in ('requested','accepted','en_route','arrived','completed','cancelled','rejected')),
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz
);

create index if not exists professional_requests_user_idx on public.professional_requests(user_id);
create index if not exists professional_requests_partner_idx on public.professional_requests(partner_id);
create index if not exists professional_requests_status_created_idx on public.professional_requests(status, created_at desc);

-- ── updated_at maintenance ───────────────────────────────────────────────
-- Doesn't need SECURITY DEFINER: it only mutates the row already being
-- written by the (already-authorized) statement it's attached to, and
-- touches no other table. No grant execute needed either, same as
-- handle_new_user() in schema.sql - trigger invocation doesn't go through a
-- client's direct EXECUTE grant.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists memberships_set_updated_at on public.memberships;
create trigger memberships_set_updated_at before update on public.memberships
for each row execute procedure public.set_updated_at();

drop trigger if exists partners_set_updated_at on public.partners;
create trigger partners_set_updated_at before update on public.partners
for each row execute procedure public.set_updated_at();

drop trigger if exists partner_offers_set_updated_at on public.partner_offers;
create trigger partner_offers_set_updated_at before update on public.partner_offers
for each row execute procedure public.set_updated_at();

-- ── RLS ──────────────────────────────────────────────────────────────────

alter table public.memberships enable row level security;
alter table public.partners enable row level security;
alter table public.partner_offers enable row level security;
alter table public.offer_redemptions enable row level security;
alter table public.partner_transactions enable row level security;
alter table public.professional_requests enable row level security;

-- memberships: a user sees only their own membership row(s). No client
-- insert/update - memberships are created/updated by a payment
-- webhook/RPC in a later phase.
drop policy if exists "memberships read self" on public.memberships;
create policy "memberships read self" on public.memberships for select to authenticated using (
  user_id = auth.uid()
);
drop policy if exists "memberships read admin" on public.memberships;
create policy "memberships read admin" on public.memberships for select to authenticated using (
  public.is_admin()
);

-- partners: any authenticated user can browse verified partners (this is
-- public marketing content, not sensitive data - visible even to
-- non-members so a member_only offer's existence can motivate upgrading).
-- Admin sees every status for moderation. No client insert/update - no
-- partner self-service onboarding this phase.
drop policy if exists "partners read verified" on public.partners;
create policy "partners read verified" on public.partners for select to authenticated using (
  status = 'verified'
);
drop policy if exists "partners read admin" on public.partners;
create policy "partners read admin" on public.partners for select to authenticated using (
  public.is_admin()
);

-- partner_offers: any authenticated user can read live offers. The exists()
-- also requires the parent partner to still be 'verified' - a
-- one-directional reference into partners (partners' own policies never
-- query partner_offers back), so this cannot recreate the profiles/
-- help_requests mutual-recursion bug; it just keeps an offer from a
-- since-suspended partner from rendering. Admin sees every status. No
-- client insert/update this phase.
drop policy if exists "partner offers read active" on public.partner_offers;
create policy "partner offers read active" on public.partner_offers for select to authenticated using (
  status = 'active'
  and (ends_at is null or ends_at > now())
  and exists (
    select 1 from public.partners p
    where p.id = partner_offers.partner_id and p.status = 'verified'
  )
);
drop policy if exists "partner offers read admin" on public.partner_offers;
create policy "partner offers read admin" on public.partner_offers for select to authenticated using (
  public.is_admin()
);

-- offer_redemptions: a user can read only their own redemption history.
-- No client insert/update this phase - see table comment above.
drop policy if exists "offer redemptions read self" on public.offer_redemptions;
create policy "offer redemptions read self" on public.offer_redemptions for select to authenticated using (
  user_id = auth.uid()
);
drop policy if exists "offer redemptions read admin" on public.offer_redemptions;
create policy "offer redemptions read admin" on public.offer_redemptions for select to authenticated using (
  public.is_admin()
);

-- partner_transactions: admin-only, always. Purely a backend/RPC-populated
-- commission audit trail - no client insert/update/select of others' rows.
drop policy if exists "partner transactions read admin" on public.partner_transactions;
create policy "partner transactions read admin" on public.partner_transactions for select to authenticated using (
  public.is_admin()
);

-- professional_requests: mirrors help_requests - a user can create and read
-- their own requests (blocked if banned, same public.is_banned() helper
-- used for help_requests), admin reads all for support/moderation. No
-- client update policy - status transitions are RPC-only once that phase
-- designs the accept/complete flow, same as help_requests.
drop policy if exists "professional requests insert self" on public.professional_requests;
create policy "professional requests insert self" on public.professional_requests for insert to authenticated with check (
  auth.uid() = user_id and not public.is_banned()
);
drop policy if exists "professional requests read self" on public.professional_requests;
create policy "professional requests read self" on public.professional_requests for select to authenticated using (
  user_id = auth.uid()
);
drop policy if exists "professional requests read admin" on public.professional_requests;
create policy "professional requests read admin" on public.professional_requests for select to authenticated using (
  public.is_admin()
);
