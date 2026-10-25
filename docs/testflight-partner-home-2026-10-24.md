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

Delivery: **ready in internal TestFlight**, verified through Apple's API on 2026-10-24.

- Version **2.0.4 (30)**; build ID `0ebdcd0a-9e1f-4d82-927b-665e62ddc73c`.
- `processingState: VALID`, `internalBuildState: IN_BETA_TESTING`; existing internal group **Test** only.
- `externalBuildState: READY_FOR_BETA_SUBMISSION`: no external beta review or invitation was submitted.
- Test instructions saved in Arabic (`ar-SA`), English (`en-US`) and Hebrew (`he`).
- Source commit: [`5f368840868a96d9da081162fa0fa4d82109cf03`](https://github.com/abdallhmurar/AKHOO/commit/5f368840868a96d9da081162fa0fa4d82109cf03).
- Successful [GitHub macOS build](https://github.com/abdallhmurar/AKHOO/actions/runs/40094564032), using EAS CLI 25.3.0. Artifact `12560667027` retained for one day; downloaded IPA remains locally in ignored `credentials/`.
- IPA SHA-256: `2e7f08035b2e223a2b61c248a55ed82403a48623eb5777eb5871f259763caa09`.
- Inspection confirmed `app.akhoo.help`, 2.0.4 / 30, signing/provisioning files, `EXUpdatesEnabled: false`, `partnerHomeBeta: true`, the exact approved video/poster hashes, and the existing AKHOO backend URL. Apple's subsequent VALID state confirms processing passed.
- Upload used Apple's Build Uploads API directly; all 19 file parts completed. No App Store version or review submission was created. The original 2.0.3 / build 29 association and manual-release status remained unchanged, and every App Store version matched the pre-task baseline. GitHub returned zero deployments for the source commit.

On the iPhone: open **TestFlight → AKHOO → Update**, select **2.0.4 (30)**. Check the home screen, partner banner/video, preview form (review/edit), active-request resume and offers button in Arabic, Hebrew and English. The partner application does **not** send a real request.

Physical iPhone playback, safe areas, Dynamic Type, VoiceOver, keyboard interaction and authenticated two-account request flows require device QA. This beta must not be promoted to App Store release while the partner form remains a simulation without explicit owner approval and completion of the real submission flow.
