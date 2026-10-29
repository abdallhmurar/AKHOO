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

Source validation passed: TypeScript, ESLint (one pre-existing import-resolver warning), 319 tests across 54 files, Android Hermes export and iOS regression export. The actual Android graph contains all 26 checked presentation/auth entries and four Tajawal fonts, and excludes old request/helper/activity/tab screens and the unapproved local prototypes. The final helper-inset adjustment passed TypeScript, targeted lint, Android export and the full test suite.

- Signed [EAS build](https://expo.dev/accounts/abad003/projects/sanad/builds/238792da-a807-4eea-985c-11c39d2ebcb3) finished successfully on 2026-10-29. Built source: [`a10d00be8fe152ae63899d76bc804d8a544de2ed`](https://github.com/abdallhmurar/AKHOO/commit/a10d00be8fe152ae63899d76bc804d8a544de2ed).
- Native AAB: 177,807,152 bytes; SHA-256 `e9e61a66f2bc6f80158848a4d614cf19812c81e4bf6d512ed96f1a06cc05e3a2`.
- Decoded the AAB manifest/resource table: package `app.akhoo.help`, version 2.0.5, code 10, native runtime 2.0.5, non-debuggable, no background-location or foreground-service permission. Signature metadata present. Verified production backend and auth callback in the embedded bundle, 108 offline asset entries, and matching content hashes for all 14 presentation videos and four Tajawal fonts.
- Google accepted code 10 with the identical SHA-256. Production edit validated and committed with `changesNotSentForReview=false` and rollout status `completed` (all eligible users after approval). Release notes supplied in Arabic, English and Hebrew.
- Fresh read-back at **2026-10-29 00:55 UTC**: **2.0.5 (10) `RELEASE_LIFECYCLE_STATE_IN_REVIEW`**; 2.0.4 (9) remains `PUBLISHED`. Country availability (`IL`), internal/closed tracks and store listings are unchanged.

Use `expo export --platform android --source-maps` with the release environment, then `node scripts/verify-android-presentation.cjs <export-dir>` to verify the actual Android graph, including all new presentation routes/fonts and exclusion of the old screens/local prototypes. Unit tests include platform typography equality, release/runtime/permission isolation and existing auth, mission and video lifecycle checks.

Physical Android device testing and a new installation from Google Play are not yet verified. Compilation/source-graph checks do not replace device QA. Play track status `completed` describes the requested rollout; it alone does not prove Google's approval or public availability.

## Store-state verification

The production release lifecycle endpoint confirmed 2.0.4 (9) as `RELEASE_LIFECYCLE_STATE_PUBLISHED` at 2026-10-29 00:38 UTC, superseding the previous README statement that it was awaiting review. After submission it confirmed 2.0.5 (10) as `IN_REVIEW`. Use `GET /androidpublisher/v3/applications/app.akhoo.help/tracks/production/releases` for actual review/publication state, rather than inferring it from edit-track `completed`. Production country availability is Israel (`IL`).

Reference: [Expo Video Android surface types](https://docs.expo.dev/versions/latest/sdk/video/), [Google Play edit commit/review semantics](https://developers.google.com/android-publisher/api-ref/rest/v3/edits/commit), [Google Play release lifecycle](https://developers.google.com/android-publisher/api-ref/rest/v3/applications.tracks.releases).
