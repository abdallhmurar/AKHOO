# Benefits and activity — local implementation

**Owner decision, 2026-10-29:** This implemented design was rejected after review and is not approved for publication. A replacement image-only concept was shown (offers-first discovery, compact points balance, activity calendar and timeline). Its examples are illustrative; no replacement app changes have been made.

The owner approved the mobile wallet/impact concept and requested local implementation. This branch changes the real Benefits and Activity screens and adds a development-only web showcase at `http://localhost:4188/design-preview`.

## Behavior

- Benefits uses the existing spendable-points RPC and approved `public_offers`. “بنقاطك” filters by the actual balance; unknown balances never become a false zero. All offers remain accessible, ordered with the curated weekly slots first. Cards retain the real partner images, translations, membership note, price and point cost. Details still open the existing offer/redemption screen.
- Activity offers calendar-month/all-time summaries and a compact history with given/received/points filters. Completed counts use exact database counts, based on completion time. Earned points come from the paginated ledger, independently of the history limit. History displays up to 100 rows per category with an explicit notice when truncated. Entries still open their associated missions.
- Returning to either real tab refreshes its data. New screens use native views, static PNG artwork and simple SVG contours. Arabic/English/Hebrew, RTL/LTR, dark mode, loading, error and empty states are implemented. App controls have 44–48 point minimum touch targets and the existing native tab bar remains.
- The web-only `design-preview` route is disabled outside development. It renders the same view components with clearly labelled examples, language/theme/state controls and illustrative detail sheets. The examples never write to Supabase. The actual authenticated routes use real data.

## Scope and release safety

No store upload, OTA, Vercel deployment, database migration, backend write or release-number change. Work is isolated from the shared working copy on `ui/perks-activity-local-20261029`, based on the Android 2.0.5 hotfix line. Vercel Git deployments are explicitly disabled for this branch in the app and admin configs. The GitHub sync is source backup only; do not merge this branch into `main` without separate deployment authorization.

Claude-owned areas touched narrowly: new read-only repository queries, the three locale namespaces, existing `expo-asset` made explicit for web preview image resolution, and branch deployment suppression. No administrative behavior or release pipeline changed.

## Verification

- TypeScript: pass.
- Tests: 336 passed across 59 files, including affordability boundaries, calendar dates, full ledger totals versus capped history, read errors, partner lookup and mounted view interactions/navigation.
- Source lint: zero errors; one existing resolver warning in `src/components/motion/medal-element.js`. Local generated bundle files under ignored `credentials/` are excluded from this check.
- Local Metro page and web bundle: HTTP 200. Android/iOS/web production exports pass. Android graph verification retains the crash fix and excludes iOS WebGL surfaces from Android.
- **Not visually verified in the browser or on a physical device.** The computer-use tool stopped because it could not determine the current Windows Chrome URL confidently enough to enforce policy. No alternate browser automation was used. React view tests and bundle compilation do not establish pixel-perfect rendering or real-device behavior.
- No authenticated real-account workflow or live redemption was exercised; repository behavior is covered by query tests, and existing offer-detail/redemption code is retained.

## Artwork provenance

- New asset: `assets/mobile-hub/help-impact.png` (transparent PNG). Tool: built-in ImageGen, derived from the owner's approved mockup.
- Generation prompt brief: extract the approved impact illustration of two friendly 3D helpers beside a blue car, one in a reflective vest and one in an orange hoodie, with jumper leads; transparent background, no lettering, no interface elements. Preserve the friendly blue/teal visual style.
- Existing `assets/images/perks-coupon-icon.png` is reused in the wallet. Real offer cards use partner media; the development showcase uses the existing `previews/home-motion/assets/perks/sticker-offer.png`, labelled as illustrative.

To restart locally: run `npm run native:scenes`, `node scripts/sync-approved-motion.cjs`, then `npx expo start --localhost --port 4188` from this worktree. Open `/design-preview` on this computer. `localhost` on another phone refers to that phone, not this server.
