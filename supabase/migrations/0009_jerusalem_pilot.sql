-- Jerusalem pilot (Phase 2): the real pilot market is Israel/Jerusalem, not
-- the Jordan example used to illustrate the market-config pattern in
-- 0008_commercial_foundation.sql. Extends (does not replace) that
-- migration's market/currency CHECK constraints so both markets remain
-- valid, adds partner city/localized-name columns, and introduces a simple
-- pilot service-area table.

alter table public.memberships drop constraint if exists memberships_market_check;
alter table public.memberships add constraint memberships_market_check check (market in ('JO', 'IL'));
alter table public.memberships drop constraint if exists memberships_currency_check;
alter table public.memberships add constraint memberships_currency_check check (currency in ('JOD', 'ILS'));

alter table public.partners drop constraint if exists partners_market_check;
alter table public.partners add constraint partners_market_check check (market in ('JO', 'IL'));

alter table public.partner_transactions drop constraint if exists partner_transactions_currency_check;
alter table public.partner_transactions add constraint partner_transactions_currency_check check (currency in ('JOD', 'ILS'));

alter table public.professional_requests drop constraint if exists professional_requests_currency_check;
alter table public.professional_requests add constraint professional_requests_currency_check check (currency in ('JOD', 'ILS'));

-- ── partners: city + localized names (brief §18) ────────────────────────

alter table public.partners
  add column if not exists city text,
  add column if not exists name_ar text,
  add column if not exists name_he text,
  add column if not exists name_en text;

-- ── pilot_zones ──────────────────────────────────────────────────────────
-- Deliberately a simple circle (center + radius), not a polygon - real
-- point-in-polygon geometry needs PostGIS and is overkill for a
-- single-city pilot. This is a business-logic gate the client checks
-- before enabling request submission (see RequestHelpScreen.tsx), not a
-- security boundary - so a simple radius check is enough for the pilot.

create table if not exists public.pilot_zones (
  id uuid primary key default gen_random_uuid(),
  market text not null check (market in ('JO', 'IL')),
  city text not null,
  center_lat double precision not null,
  center_lng double precision not null,
  radius_km numeric not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists pilot_zones_market_active_idx on public.pilot_zones(market, active);

alter table public.pilot_zones enable row level security;

drop policy if exists "pilot zones read active" on public.pilot_zones;
create policy "pilot zones read active" on public.pilot_zones for select to authenticated using (
  active = true
);
drop policy if exists "pilot zones read admin" on public.pilot_zones;
create policy "pilot zones read admin" on public.pilot_zones for select to authenticated using (
  public.is_admin()
);

-- Pilot seed data - Jerusalem, ~12km radius covering the metro area. Safe
-- to adjust/remove once a real service-area decision is made; re-running
-- this migration won't duplicate it (guarded on market+city).
insert into public.pilot_zones (market, city, center_lat, center_lng, radius_km, active)
select 'IL', 'Jerusalem', 31.7683, 35.2137, 12, true
where not exists (
  select 1 from public.pilot_zones where market = 'IL' and city = 'Jerusalem'
);
