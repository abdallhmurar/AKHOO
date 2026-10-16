# Activity — local design preview

Run `node previews/home-motion/serve.cjs` from the repository root and open
<http://127.0.0.1:4178/activity/>. The local home page's **نشاطي** button opens
this page, and its Home navigation item returns to the home preview.
`/activity` redirects to `/activity/` for relative assets.

The design keeps the established navy/blue/teal identity, city header, silver
helper tier, statistics and four navigation destinations. A compact level card,
lighter body type, grouped daily activity and shared row containers replace the
large repeated cards. The duration control sits with the feed so it does not
appear to change lifetime statistics. The medal, tabs, statistics and navigation
have subtle press/hover transitions; reduced-motion preferences disable them.

The silver medal extends the application's existing code-native `HelperMedal`
shape with layered SVG metal/ribbon gradients. Seven colored Flaticon PNGs are
stored locally for the navigation, statistics, feed and entry dialogs. Visible
author/source credits appear below the feed; asset provenance and licensing are
recorded in [assets/icons/ATTRIBUTION.md](assets/icons/ATTRIBUTION.md). Utility
controls and the header clock retain inline SVG. This page does not introduce a
new GIF, video or live 3D model. The existing
`requester/assets/details-header.png` city artwork is reused.
`assets/arabic-regular.ttf` is copied unchanged from the already installed Noto
Sans Arabic package. Its SIL OFL license is in `../assets/FONT-LICENSE.txt`.
Bold and extra-bold fonts are reused from the home preview.

## Interaction and scope

- All / Given / Received / Points tabs filter the feed, with RTL arrow-key,
  Home/End navigation, roving focus and an associated tab panel. Statistics act
  as shortcuts to the matching filter.
- The duration dialog supports 7, 30, 90 days and all time. Apply changes the
  feed; Escape/Close cancels the draft. An empty state can widen the period.
- Type and duration persist in the URL and support reload and Back/Forward.
  Invalid values fall back to All and 30 days. Pagination resets when filters
  change and loads six entries at a time without duplicates.
- Activity rows open a local detail dialog with service, status, date, time,
  sample ID and earned points when applicable. Cancelled requests retain their
  cancelled status and do not acquire points. Closing restores focus.
- The level dialog shows the same tier thresholds as `src/lib/activityLevel.ts`:
  5, 15, 30 and 60 completed helps. The fixed sample is silver with 25/30 progress.
- Perks opens an explanatory preview dialog. Account opens the local account
  preview at `../account/`. The active Activity item scrolls back to the top;
  Home returns to the existing local home page.

The 12 feed records are synthetic and use `DEMO-*` identifiers. They are anchored
to **16 October 2026, 18:00 Asia/Jerusalem**, not the viewer's current clock. The
collapsed preview note states this. Lifetime values (25 given, 19 received and
250 spendable points) are fixture totals, not sums of the limited sample feed.
No account data, private screenshot identifiers, contact details or portraits
are included. There are no fetches, account APIs, storage writes or app imports.
The page keeps the server's `connect-src 'none'` policy. No production, native,
Vercel, backend, authentication or dependency configuration is changed.

## Verification

Verified type filters, statistics shortcuts, native duration radio selection,
Apply/Cancel, the empty state and widening the date range. The fixed-date All
feed returns 5 / 9 / 11 / 12 records for 7 / 30 / 90 days / all time. Pagination
shows all 12 sample IDs once. Lifetime totals remain unchanged across filters.
Checked cancelled and points detail dialogs, Escape/focus restoration, level
details, preview navigation, query persistence and browser Back/Forward.
Checked 320, 390 and 480px layouts without horizontal overflow. Network capture
showed only local GETs; no account requests or mutations. JavaScript syntax,
scoped ESLint and `git diff --check` pass. Screenshots and local QA files are
under ignored `test-results/activity-motion/`.
