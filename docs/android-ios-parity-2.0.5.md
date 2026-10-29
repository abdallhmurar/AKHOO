# Android 2.0.5 (10): complete published-iOS presentation

Owner authorized public Google Play release on 2026-10-29. Reference: iOS 2.0.4 (31), confirmed `READY_FOR_SALE` through App Store Connect; shipped source `5b471c98db12763c1ef50952fb708b2995c920c1`. Its presentation files are unchanged on the main branch used for this port. Android 2.0.4 (9) only ported the partner home/form.

## Scope

- Android resolves the published native implementations for welcome/launch, home, request selection/details/location, helper map/details sheets, requester waiting/tracking, helper mission, activity, tab bar, buttons and page/list containers.
- Account identity/header, benefits header/points/offers and mission completion/rating now use the same presentation on Android. The points panel is the published medal panel, not the experimental local membership card/tree/character.
- Tajawal Arabic fonts and paragraph metrics match iOS. Existing English/Hebrew fonts remain. Native direction is explicit and system insets are applied to Android helper, mission and sheet containers.
- Android video uses TextureView for compositing under masks/gradients. Android WebView renderer failure falls back to the existing illustration. Partner form keyboard handling keeps Android resizing; the form remains labelled memory-only.
- Native auth, OAuth callback fix, maps, notifications, location permission restrictions, backend queries and rank thresholds remain. No Apple binary, OTA, backend or Vercel publication.

Android entry files re-export the existing published implementation, so future fixes are shared rather than maintaining another copied design. Platform adapters cover insets, keyboard and video compositing. Changes in the shared files retain the existing iOS branches.

## Build/release isolation

`android-parity` EAS profile reserves version 2.0.5 / code 10 explicitly, uses production environment/channel and runtime 2.0.5. The base iOS/default config stays unchanged. TestFlight profiles are untouched. Both Vercel projects disable deployment on this release branch.

## Verification and delivery

Source validation passed: TypeScript, ESLint (one pre-existing import-resolver warning), 319 tests and the Android Hermes export. The actual exported graph contains all 26 checked presentation/auth entries and four Tajawal fonts, and excludes old request/helper/activity/tab screens and the unapproved local prototypes. Native signed build and Play delivery are pending.

Use `expo export --platform android --source-maps` with the release environment, then `node scripts/verify-android-presentation.cjs <export-dir>` to verify the actual Android graph, including all new presentation routes/fonts and exclusion of the old screens/local prototypes. Unit tests include platform typography equality, release/runtime/permission isolation and existing auth, mission and video lifecycle checks.

Physical Android device testing and a new installation from Google Play are not yet verified. Compilation/source-graph checks do not replace device QA. Play track status `completed` describes the requested rollout; it alone does not prove Google's approval or public availability.

Reference: [Expo Video Android surface types](https://docs.expo.dev/versions/latest/sdk/video/), [Google Play edit commit/review semantics](https://developers.google.com/android-publisher/api-ref/rest/v3/edits/commit).
