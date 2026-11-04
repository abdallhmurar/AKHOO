# Nearby-update web preview — 4 November 2026

The owner requested a Vercel upload to inspect whether the web app could be used for the Google Play permission video. This preview uses current `main` (`37e959f`) plus the existing shared nearby-alert implementation from `133a5c5`; the current privacy text is retained. No new native build, OTA, backend deployment or production promotion is part of this preview.

## Target and build

- Existing Vercel project `akhoo`, ID `prj_TqOBmZDoOxByfXDpaYzGuWC4DLtn`, team `team_8Kf333e3Jpr04VTrDDIk1kfO`; target **preview**.
- The Vercel connector was unavailable; authenticated CLI 64.0.2 verified the existing project and team.
- Preview environment had no Supabase client configuration. The production pull returned secret placeholders, so the local export uses only the two existing verified public client values from the ignored local environment: the expected Supabase project URL and its `sb_publishable_` key. No service-role or deployment credentials are bundled.
- Native-scene and approved-motion generation ran before checks. Typecheck passed; lint has zero errors and the existing resolver warning; **389 tests / 62 files passed**. Expo web production export completed with a clean Metro cache.
- Deploy the generated static output with Build Output API v3 and SPA fallback. Git-triggered deployment is disabled for this preview branch only, because its server-side preview environment lacks the client values; this prevents a later documentation push from replacing the working manual preview with an unconfigured build. Other branches and production are unchanged.
- Deployment URL and browser verification: pending.

## Video boundary

`supportsNearbyBackgroundAlerts()` explicitly excludes `Platform.OS === 'web'`. The preview therefore must not display an actionable native background-location control, fabricate Android permission sheets, or claim native foreground-service operation. Browser footage can demonstrate the ordinary app interface, but cannot replace Google's required Android background-location demonstration. Native installation/version, actual background updates and locked-phone notification receipt remain unverified.

References: [Google's Android video requirements](https://support.google.com/googleplay/android-developer/answer/9799150?hl=en), [Vercel Build Output API](https://vercel.com/docs/build-output-api/v3).
