-- Stabilization round: a few small missing indexes found during a schema
-- audit. Low-traffic tables at current pilot scale, but cheap to add now
-- before it matters.

create index if not exists partner_transactions_offer_idx on public.partner_transactions(offer_id);
create index if not exists partner_transactions_redemption_idx on public.partner_transactions(redemption_id);

-- Supports the notify-new-request edge function's volunteer_profiles scan
-- (is_available + push_token not null + a staleness bound), which previously
-- had no index at all backing it.
create index if not exists volunteer_profiles_notifiable_idx
on public.volunteer_profiles (updated_at)
where is_available = true and push_token is not null;
