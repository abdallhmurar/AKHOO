# AKHOO Admin Panel — Full Audit

**Scope:** Read-only investigation of `admin/` (a separate Vite + React + TypeScript app, package name `sanad-admin`). No files were changed to produce this report. Cross-referenced against the main app's Supabase schema (`supabase/migrations/*.sql`) and the mobile app's own feature set.

**Bottom line up front:** this admin panel is small in surface area but **genuinely real** — every page in it is wired to live Supabase tables/RPCs, gated by a real server-side admin check, with no mock data and no dead UI found anywhere. The gaps are entirely about **missing pages/features** for things the mobile app has grown since this admin panel was built (weekly-offer points pricing, AKHOO Pro Max, chat, mission ratings), not about existing pages being broken.

---

## 1. Structure

```
admin/                          sanad-admin (Vite + React 19 + TS, Tailwind + shadcn/radix)
├── src/App.tsx                 All routes (react-router-dom)
├── src/auth/                   Supabase-auth login + admin gate
├── src/shell/                  Sidebar / Topbar / AdminShell layout
├── src/pages/
│   ├── dashboard/               "/"
│   ├── requests/                "/requests", "/requests/:id"
│   ├── users/                   "/users", "/users/:id"
│   ├── points/                  "/points"
│   ├── businesses/              "/businesses", "/businesses/new", "/businesses/:id", "/businesses/:id/edit"
│   ├── offers/                  "/offers", "/offers/new", "/offers/:id", "/offers/:id/edit"
│   ├── reviews/                 "/reviews"
│   └── map/                     "/map"
├── src/components/               Shared presentational components (StatCard, DataTable, StatusBadge, StarRating, ConfirmDialog…)
├── src/components/ui/            shadcn primitives (button, dialog, table, tabs, select…)
├── src/lib/                      supabase client, pagination helper, activityLevel mirror, categories, i18n, storage upload, map style
└── src/locales/ar.json, en.json, he.json   Full trilingual UI (mirrors the mobile app's 3 languages)
```

- **Not deployed anywhere.** No `vercel.json`, no `.vercel/`, no CI deploy step for `admin/`. It only runs via `npm run dev` / `npm run build` locally. (Confirmed earlier this session: the Vercel account behind `akhoo.vercel.app` has no second project for it.)
- **Own Supabase client**, same project (`zmpwdufahjmlxfwzafvr`), same `profiles`/`help_requests`/etc. tables as the mobile app — this is one shared backend, two frontends.
- Has its own **Playwright e2e suite** (`admin/e2e/`) and **unit tests** for `activityLevel`, `categories`, `direction`, `offerStatus`, `pagination`, `locales` (parity check that ar/en/he have matching keys).

## 2. Auth & permissions (real, server-enforced)

- Login: plain Supabase Auth email/password (`LoginPage.tsx`), no separate admin-only auth system.
- Gate: `RequireAdmin.tsx` renders one of 5 states (`loading` / `logged_out` / `checking_admin` / `non_admin` / `network_error` / `admin`) driven by `useIsAdminQuery`, which calls `public.is_admin()` — a `SECURITY DEFINER` RPC reading `profiles.is_admin` server-side.
- **Defense in depth, verified in the migrations, not just trusted from a comment:** every admin mutation RPC (`admin_upsert_business`, `admin_set_business_active`, `admin_upsert_offer`, `admin_set_offer_status`, `admin_cancel_help_request`, `admin_set_user_banned`, `admin_set_volunteer_verified`, `admin_set_review_hidden`) independently re-checks `if not public.is_admin() then raise exception` inside the function body. A client-side bypass of the UI gate still can't call these as a non-admin — this isn't just a hidden route, it's actually locked server-side.
- No separate admin **roles** (super-admin vs support, etc.) — `is_admin` is a single boolean on `profiles`. Any admin can do anything any other admin can.
- Every mutation writes to `admin_audit_log` (action, target_type, target_id, target_label, metadata, admin_id) — real accountability trail, visible both on the Dashboard's recent-activity feed and on each User/Business detail page's History tab.

## 3. Page-by-page map: Page → Components → Data → API → Tables → Status

| Page | Route | Key components | Data hooks | Reads (tables/RPCs) | Writes (RPCs) | Status |
|---|---|---|---|---|---|---|
| Dashboard | `/` | `StatsRow`, `RequestsByStatusChart`, `RequestsTrendChart`, `RecentActivityFeed` | `useDashboardMetrics`, `useCompletionTrend`, `useRecentAuditLog` | `admin_dashboard_metrics()`, `admin_requests_completed_daily()`, `admin_audit_log` + `profiles` | — | **Working** |
| Requests list | `/requests` | `RequestsFilters`, `RequestsTable` | `useRequests` | `help_requests` (+ `profiles` name join, search) | — | **Working** |
| Request detail | `/requests/:id` | `RequestMap`, `RequestTimeline` | `useRequestDetail`, `useCancelRequest` | `help_requests`, `profiles`, `help_request_releases`, `volunteer_point_transactions` | `admin_cancel_help_request` | **Working** — but see §5, no rating/chat visibility |
| Users list | `/users` | `UsersTable` | `useUsers` | `profiles` (search by name/phone) | — | **Working** |
| User detail | `/users/:id` | tabs: requests / assists / points / history | `useUserDetail`, `useSetUserBanned`, `useSetVolunteerVerified` | `profiles`, `help_requests` ×2, `volunteer_profiles`, `volunteer_point_transactions`, `admin_audit_log` | `admin_set_user_banned`, `admin_set_volunteer_verified` | **Working** |
| Points | `/points` | `PointsTable` (search only) | `usePointTransactions` | `volunteer_point_transactions` + `profiles`/`help_requests` join | — | **Working, read-only** (see §4 — no manual award/adjust) |
| Businesses list | `/businesses` | `BusinessesFilters`, `BusinessesTable` | `useBusinesses` | `partners` | — | **Working** |
| Business new/edit | `/businesses/new`, `/businesses/:id/edit` | `BusinessForm`, `BusinessLocationMap` (click-to-place pin) | `useUpsertBusiness`, image upload via `lib/storage.ts` | `partners` | `admin_upsert_business`, Storage bucket `business-photos/logo/*` | **Working** |
| Business detail | `/businesses/:id` | tabs: overview / photos / offers / reviews / history | `useBusinessDetail`, `useSetBusinessActive`, `BusinessPhotosManager` | `partners`, `business_photos`, `public_offers`, `reviews`, `business_ratings`, `admin_audit_log` | `admin_set_business_active`, Storage `business-photos/photos/*` | **Working**, but see §5 — `status` (pending/verified/suspended/rejected) has no UI control |
| Offers list | `/offers` | `OffersFilters`, `OffersTable` | `useOffers` | `partner_offers` (+business name) | — | **Working** |
| Offer new/edit | `/offers/new`, `/offers/:id/edit` | `OfferForm`, `OfferPreviewCard`, business picker | `useUpsertOffer`, `useBusinessOptions`, image upload | `partner_offers`, `partners` | `admin_upsert_offer`, Storage `business-photos/offers/*` | **Working** — real price/discount type, `image_url`, `valid_from/until`, `member_only` |
| Offer detail | `/offers/:id` | status actions | `useOfferDetail`, `useSetOfferStatus` | `partner_offers`, `partners`, `admin_audit_log` | `admin_set_offer_status` (approved/rejected/paused/draft) | **Working** |
| Reviews | `/reviews` | `ReviewsTable` (visibility filter + search) | `useReviews`, `useSetReviewHidden` | `reviews` + `partners`/`profiles` join | `admin_set_review_hidden` | **Working** — this is *business* reviews only, not mission ratings (see §4) |
| Operations map | `/map` | MapLibre GL, 2 toggleable layers | `useMapRequests`, `useMapBusinesses` | `help_requests` (non-terminal statuses), `partners` (with coords) | — | **Working**, deliberately scoped — no volunteer/helper position layer (privacy note in the code itself) |

## 4. Missing connections (features the mobile app has that the admin has no page for at all)

- **Weekly-offers points pricing.** The mobile Perks screen (as of the latest redesign) reads real `public_offers` rows for price/discount/expiry, but there is **no `points_cost` column anywhere in the schema**, and this admin's `OfferForm`/`useUpsertOffer` payload has no such field either. There is nothing to "connect" — it was never built on either side. This is the single biggest gap if a points-redemption economy is wanted.
- **Mission ratings.** `mission_ratings` (requester rates helper, built this session) is **not referenced anywhere in `admin/src`**. No page shows a helper's average rating, no way to see or moderate a bad rating.
- **Chat.** `messages` (the mission chat table) is **not referenced anywhere in `admin/src`**. No way to view or moderate a conversation between a requester and helper, even for abuse investigation.
- **AKHOO+ / "SANAD+" membership.** The mobile app's `lib/membership.ts` / `memberships` table has **no admin page**. `member_only` is settable per-offer in `OfferForm`, but there's no list of members, no way to grant/revoke/see membership status, no membership pricing config visible.
- **AKHOO Pro Max.** Doesn't exist as a real feature anywhere yet (mobile side is a static "coming soon" image, not backed by data) — nothing to connect on the admin side either.
- **Pilot zones / geofencing.** `pilot_zones` (used by the mobile app to gate requests to the Jerusalem pilot area) has no admin page — zones can only be edited by hand in the database today.
- **Push notifications.** No broadcast/announcement tool, and no way to see who has a push token registered.
- **Complaints / disputes / reports.** No such feature anywhere in the product yet (confirmed absent on the mobile side too, by design — an earlier note in `MissionScreens.tsx` explicitly calls this "not real product, don't build it").
- **QR redemption.** Doesn't exist anywhere — no QR generation, no scan/redeem flow, on either the mobile or admin side.
- **Content/banner/CMS management.** The mobile header banner and "AKHOO Pro Max" images are static bundled image assets (`assets/images/perks-*.png`), not admin-editable content. There's no CMS of any kind — no way to change app copy, banners, or translated strings without a code deploy.
- **Multi-market.** `partners.market` exists and defaults to `'IL'` (fixed by migration `0016_perks_plus_corrections.sql` after a real bug where it defaulted to `'JO'` — already resolved), but there is **no market selector anywhere in the admin UI**. Fine today (single market), but the business form has no way to pick a market if/when Jordan is activated.
- **Live helper GPS.** `volunteer_profiles.latitude/longitude` is fetched (`useUserDetail`) but never rendered — no coordinates shown, no pin on the operations map. Only `is_available` (available/unavailable badge) surfaces per-user, plus an aggregate "active volunteers" count on the dashboard. This looks like a deliberate privacy choice (the map's own code comment says so explicitly), not an oversight — worth confirming with product intent either way.

## 5. Partially-working / notable gaps within existing pages

| Feature | What works | What's missing |
|---|---|---|
| Business `status` (pending/verified/suspended/rejected) | Field exists, type-safe end to end | **No UI to change it.** `admin_upsert_business` hardcodes new businesses to `'verified'` immediately. There is no "pending approval" workflow — because there's no self-serve partner signup to approve in the first place. The other 3 status values are currently unreachable dead states. |
| Points / Activity levels | Real transaction ledger, real running total, `activityLevel.ts` mirrors the mobile thresholds (5/15/30/60) | **Read-only.** No way to manually award/adjust points, no way to change the level thresholds from the UI (they're a hardcoded constant duplicated in both apps, not admin-configurable) |
| Helper availability/GPS | Per-user available/unavailable badge; dashboard's "active volunteers" aggregate (available AND updated in the last 20 min) | No live map of *where* helpers are, no list of who's currently online |
| Reviews | Full moderation (hide/show) for **business** reviews | Doesn't cover mission ratings (different table, not surfaced at all — see §4) |

## 6. Broken functionality

**None found.** No dead buttons, no forms that silently fail, no TODO/FIXME/mock/placeholder markers anywhere in `admin/src` (checked by direct grep across the whole tree). Every mutation hook has a real RPC behind it, a `toast.error` on failure, and correct query-cache invalidation on success.

## 7. Mock / test data

**None in the shipped app.** No hardcoded arrays standing in for real data, no fake user/business/offer fixtures rendered in production code. The only "test data" is inside `*.test.ts` unit tests (`activityLevel.test.ts`, `categories.test.ts`, `direction.test.ts`, `offerStatus.test.ts`, `pagination.test.ts`, `locales.test.ts`) and the Playwright `e2e/` suite, which is exactly where it should be.

## 8. Security / permissions observations

- Solid as far as it goes: real auth, real server-side admin check, real RLS-backed RPCs, real audit log. Nothing here reads as fake or bypassable from the client.
- **Single admin role.** No distinction between (say) a support agent who should only see requests/users and someone who can edit business/offer content or ban users. Every admin account is equally powerful. Worth deciding if that's acceptable at current scale.
- **No rate limiting / no 2FA** visible on the admin login itself — standard Supabase email/password only. Reasonable for a small internal tool, worth a second look before wider admin-team growth.
- `admin_audit_log` doesn't capture *read* access (who viewed a user's phone number, etc.) — only mutations. Fine for most purposes, but a consideration if PII-access auditing ever matters.

## 9. Comparison against AKHOO app features

| Mobile feature | Admin coverage |
|---|---|
| Users | ✅ Full (list, detail, ban/unban, volunteer-verify) |
| Help requests | ✅ Full (list, detail, cancel, map layer, dashboard metrics/trend) |
| Helpers (as a role) | ✅ Covered *through* Users — no separate "helpers" concept exists in the product (any user can be a requester or a helper), so this isn't a gap |
| GPS / availability | ⚠️ Partial — per-user badge + dashboard aggregate count only, no live map/position (see §4–5) |
| Weekly offers | ⚠️ Partial — the underlying real offers (price, image, expiry) are fully admin-manageable via **Offers**; the points-cost half of that UI has nothing to manage because it doesn't exist in the schema yet |
| Points & levels | ⚠️ Partial — real ledger is visible and searchable; no manual award/adjust, thresholds not configurable |
| Rewards (spend points on something) | ❌ Not connected — doesn't exist in the schema at all, on either side |
| QR redemption | ❌ Not connected — doesn't exist anywhere |
| Partners / Business accounts | ✅ Full (this *is* the Businesses feature — full CRUD, photos, offers, reviews, activate/hide) |
| AKHOO Pro Max | ❌ Not connected — static "coming soon" image in the mobile app only, no real feature to administer yet |
| Community (perks hub: header, points card, offers, Pro Max banner) | ⚠️ Partial — the real parts (offers, business info) are admin-manageable; the header/Pro Max banner are static bundled images, not admin content |
| Notifications | ❌ Not connected — no broadcast tool, no visibility into push token registration |
| Complaints / reports | ❌ Not a real product feature yet on either side (by design, per existing code comments) |
| Content / banners / multilingual assets | ❌ Not connected — no CMS; UI copy and banner images are code/asset changes, not admin-editable |

## 10. Recommended next steps (ordered by likely impact, no code touched yet)

1. **Decide the points-redemption model before building any UI for it** — this blocks "Weekly offers points pricing," "Rewards," and "QR redemption" all at once, and was explicitly deferred by the user in the mobile redesign work earlier this session. A real answer here (spend real points? cash+points hybrid? redemption code shown at the business?) determines a real schema change (`partner_offers.points_cost`, a redemption/ledger table) before either app can show it honestly.
2. **Add mission ratings visibility** to the Request detail and/or User detail pages (`mission_ratings` already exists and is populated by the mobile app) — low effort, high value for spotting problem helpers.
3. **Add a lightweight chat viewer** to Request detail for abuse/dispute investigation (read-only is enough to start).
4. **Give Business `status` a real control** (or remove the unreachable values if there's genuinely no plan for partner self-signup) — right now it's a schema field with no UI, which is confusing for whoever inherits this codebase later.
5. **AKHOO+ / membership admin page** — at minimum, a list of active members and manual grant/revoke, before marketing the tier any further.
6. If a market beyond Jerusalem is ever activated, add the market selector to `BusinessForm` before that's needed under time pressure.

---
*Generated by a static, read-only review of `admin/src/**`, `src/lib/membership.ts`, and every `supabase/migrations/*.sql` file relevant to the tables above. No files were modified.*
