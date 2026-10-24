# Partner / home TestFlight beta

Scope authorized by the owner: Apple TestFlight only, incorporating the approved local design. No App Store release, review, listing, Android build/update, OTA, database or admin operation.

Source branch: `ios/testflight-partner-home-20261024`, based on `main` at `c22b3b6`. Version 2.0.4, reserved build 30; a separate version from the already-approved 2.0.3. Profile `partner-testflight` extends the existing store-signed TestFlight profile, uses the preview environment and disables OTA. The new UI is selected only by `extra.partnerHomeBeta` in this profile and only imported by the iOS home entry. Normal app configuration is preserved. Initial run `40094484990` was cancelled before the build to correct the version; nothing was uploaded from it.

Included:

- The approved megaphone/shop artwork and silent video, with native ar/en/he copy and poster fallback.
- Home cards sized to the actual space after safe areas and tab navigation. Compact modes preserve actions and active-mission resume on small screens and larger text settings.
- Blue coupon-style rewards action, opening the existing community/offers screen.
- Partner application modal: four approved FAQs, form validation, review/edit and simulated confirmation. Clearly labelled as a test: **no real request is sent**. Drafts remain only in component memory and reset when closed.
- Motion pauses under the modal, while backgrounded, away from the screen, during guides and with Reduce Motion.

Verification before build:

- TypeScript, targeted ESLint and 304 tests passed.
- iOS export bundles the two approved assets.
- React Native Web rendering harness checked the native presentation components in Arabic, Hebrew and English at 320×568 and 390×844, with no page overflow; it checked mission resume, partner form/review/edit/simulated submit and offers navigation. Media and platform/provider APIs were mocked in this harness. It is **not** an iOS simulator or physical-device test.
- Expo token belongs to the existing project owner; preview environment contains the existing Supabase public URL/key.
- Git-triggered Vercel deployment is disabled for this exact beta branch in app/admin configuration. No remote Vercel setting is changed.

Apple baseline, read-only on 2026-10-24:

- 2.0.3 build 29: VALID and IN_BETA_TESTING; App Store version `e5e8b9ad-5bfc-4cfb-bbcd-b262ecc26c2b` is PENDING_DEVELOPER_RELEASE, MANUAL, attached to build `0b53048d-110b-415f-825c-a805b0532cdf`.
- 2.0.2 build 28 remains READY_FOR_SALE.
- Existing internal TestFlight group: Test. No new testers will be invited.

Delivery status: pending signed macOS build and TestFlight processing. Physical iPhone playback, safe areas, Dynamic Type, VoiceOver, keyboard interaction and authenticated two-account request flows require device QA.
