# Android 2.0.5 benefits/activity crash mitigation

## Report and scope

The owner reported that the benefits tab, the home benefits ticket and the activity tab close the application and return to the phone launcher. They identified the latest published version; Google Play independently confirmed 2.0.5 (10) as `PUBLISHED` on 2026-10-29 at 02:21 UTC.

Both benefits entry points open `CommunityHubScreen`; activity opens `ActivityScreen.ios` through its Android entry. Once the completed-help count is loaded, both show `HelperMedal`. The 2.0.5 Android entry introduced the iOS medal implementation: earned tiers create an offline Three.js/WebGL renderer in a native WebView. The earlier Android implementation used the native SVG artwork.

Inspection of the first mitigation export revealed a second entry: the shared tab bar imported `RewardsGift.ios` directly. Selecting benefits mounted its WebView even when the user had no earned medal; switching to activity unmounted that view. Removing the medal alone was insufficient, and that intermediate artifact was not published.

## Change

Android `HelperMedal` now resolves directly to the existing native `HelperMedalArtwork`, avoiding the browser/GPU surface on these screens. The earned tier, color, dimensions, points, progress, data queries and navigation remain. The medal is static on Android. iOS still uses its existing 3D medal implementation.

The tab bar now imports a platform-resolved `TabBarGift`. Android uses the existing bundled gift PNG inside the same native tab press/lift animation. The iOS entry re-exports the original 3D gift with the same props. The existing parent tab retains its accessibility label and selected state.

The Android export check now rejects the iOS medal, gift, `InteractiveScene.ios` and generated scene HTML in the actual Metro graph, so these surfaces cannot silently return through another import.

## Evidence and limits

- Six regression cases cover every tier on both screen sizes, distinct SVG gradient IDs, refresh from the empty tier to earned tiers, and repeated mount/unmount. Five fail against the previous Android entry because it creates the browser scene; all pass after the change. This demonstrates removal of the suspect boundary, not reproduction of the native process crash.
- Two tab regression cases exercise actual tab press handlers, repeated benefits/activity navigation, selected accessibility state and cancellation of a prevented tab press; the gift stays a native image throughout.
- TypeScript, targeted ESLint and 327 tests across 56 files pass. React review: platform imports are statically resolved; no added data requests, effects or event listeners; decorative gift remains hidden from accessibility because the tab owns its label.
- The production Android export passes the Metro graph check: 28 presentation/auth entries and four Arabic fonts, with both iOS WebGL paths absent. The separate iOS export still resolves `TabBarGift.ios`, `RewardsGift.ios`, `HelperMedal.ios` and `InteractiveScene.ios`; it does not contain the Android gift fallback.
- Google crash-report access is unavailable: Play Developer Reporting API is disabled, and the existing service account cannot read its Service Usage configuration. The existing Supabase management token also returned 401; no backend data/configuration was changed. Categorical client diagnostics would not provide a native stack trace in any case.
- No affected physical device is connected to the development machine. The WebView path is the strongest shared regression identified in the reported screens, but the precise native exception is not confirmed. The owner subsequently verified recovery on the affected phone, as recorded below; this is not a full-device or full-app QA pass.

## Delivery

Published the inspected export to **Android runtime 2.0.5 only** on the production branch/channel, at 2026-10-29 02:48:11 UTC. This is an OTA for the existing public version 2.0.5 (10), not a new Play binary. No iOS update or web/admin deployment.

- Source: `c18123a496ce88c1e45c669428540b5a085f21ba` (pushed and remote hash verified).
- Update group: `6967256c-e01a-4320-9216-99aebf641cc1`; Android update: `01a1858e-ce8f-78d1-bcf6-88e040eeb184`.
- Production update endpoint returns the exact Android update ID/runtime. Downloaded the launch bundle using the native protocol's asset headers and matched its SHA-256 to the inspected local export: `54ca026805ca93cc086f5d7f5f716ea1cc83398147465cfb65b92e0849b981fd`.
- The published native gift PNG was also downloaded and matched to its local source. iOS runtime 2.0.4 still returns 204, unchanged from the pre-publication baseline.

The published build 10 manifest confirms updates enabled, runtime 2.0.5, channel `production`, launch checks `ALWAYS` and launch wait 0 ms. A cold launch downloads an available update in the background; a subsequent cold launch loads it. Before publication, the update endpoint returns 204 for Android runtime 2.0.5 and iOS runtime 2.0.4.

The owner was asked to cold-open the app online, wait on home for approximately a minute, cold-open again, and retry all three reported entry points. On **2026-10-29**, the owner replied **«صاروا يفتحوا»** (they now open). The reported benefits-tab, home-benefits-ticket and activity-tab failure is therefore **resolved on the owner's affected phone after the OTA**. No additional app change or publication was made to record this confirmation. If a native exit recurs, obtain crash evidence before changing unrelated UI or data paths.
