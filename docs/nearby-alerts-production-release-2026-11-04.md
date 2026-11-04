# Optional nearby alerts — public release, 4 November 2026

The owner explicitly requested public App Store and Google Play publication, replacing the earlier testing-track target. The already-running builds use store distribution and are eligible for production; their historical profile/branch names do not select a store release track. No new TestFlight group or Play internal-track release is part of this publication.

## iOS

- **2.0.8 (35), WAITING_FOR_REVIEW**, submitted **2026-11-04 11:53:33 UTC**. Automatic release `AFTER_APPROVAL`, no future date. This is an App Store submission, not a claim of public availability.
- EAS build `86dac8db-c0e6-4a4a-a2d5-47c96f46df49`, source `b6f74c18ee02597752bc70b6b8a81fb192972fa1`, branch `ios/testflight-nearby-20261104`, profile `nearby-testflight-208`.
- App Store version `7eb0c015-af5e-4001-b314-8adc0ba0718c`; Apple build `e1eda923-7da5-4f27-863b-b8ff63622d6d` VALID and APP_STORE_ELIGIBLE; review submission `c051dfe6-4964-4f40-9bde-212efcbbae92`.
- Uploaded through EAS submission `10ad4bac-6095-4437-8838-887b3d2c2cd0`, then separately attached and submitted to App Review through Apple's official API.
- IPA inspected: bundle `app.akhoo.help`, version/build correct, location background mode and Always-purpose disclosure present, embedded `nearbyBackgroundAlerts=true` and `partnerHomeBeta=true`. OTA disabled; runtime `2.0.8-testflight-nearby-v1`. Apple validated the uploaded binary. This is not execution on an iPhone.
- Arabic, English and Hebrew release notes saved; inherited review credentials retained privately; review notes explain disclosure, consent, Account toggle and platform limits. All **15 screenshots COMPLETE**. Encryption declaration false. State and build attachment read back after submission.
- Previous **2.0.7 (34) READY_FOR_SALE** verified before creating this version.

## Android

- **2.0.6 (11) uploaded and committed as a production-track DRAFT**; not submitted for public review or live. Google rejected validation of the completed public release with **403: `Release artifacts require permissions that are missing from permission declaration.`** Current **2.0.5 (10) remains completed** with Israel-only availability.
- EAS build `832b6fbe-405e-4942-b819-b7f2853d0003`, source `cb41e375681074fddac373e4af284a31b864abdb`, branch `android/test-nearby-20261104`, profile `nearby-internal-206` (store AAB).
- Based on the actual Android photo/crash/safe-area/partner-form source, not the older main Android implementation. Runtime `2.0.6-nearby-v1` is separate from existing users' runtime 2.0.5.
- The binary's historically named channel `nearby-test` was pointed to the existing `production` update branch (`01a04047-6629-752e-95c2-08b251f1c655`). No OTA was published. Existing production channel mapping and old-runtime updates were not changed.
- Previous production release is 2.0.5 (10), completed; internal and alpha remain 2.0.4 (9). New background-location and location foreground-service declarations require Play Console review and a real native demonstration. Do not describe a prepared draft or track status as proof of store availability.
- AAB inspected with bundletool: package/version/code correct, target SDK 36, `ACCESS_BACKGROUND_LOCATION`, `FOREGROUND_SERVICE` and `FOREGROUND_SERVICE_LOCATION` present; non-exported Expo LocationTaskService has location type `0x8`. Embedded config has `nearbyBackgroundAlerts=true` and the expected runtime. `jarsigner -verify` returned `jar verified` with self-signed/no-timestamp and ZIP streaming-layout warnings; Google's upload accepted these exact bytes.
- Google-confirmed AAB SHA-256 **`5b4d1123508124dd9d3e85851e0332e52873641f32081709f6ecdc48d4f7053e`**. An upload connection closed after transfer; the bundle was reconciled by listing the same edit and matching version 11/hash, without uploading it twice.
- After public validation failed, preserved release 10 and changed only candidate 11 to draft. Draft validation passed. Google refused `changesNotSentForReview=true` on this account; the draft was committed without that parameter and with `ERROR_IF_IN_REVIEW` (no pending review canceled). New read-only edit at **2026-11-04 12:00 UTC** confirmed 11 draft, 10 completed, unchanged internal/alpha/beta, locales ar/en-US/iw-IL and only IL country availability. Inspection edit deleted.
- **Next:** complete background-location and foreground-service declarations and supply a genuine native demonstration, then promote existing production draft 11 to completed and submit for review. Do not build version 12 just to retry this policy step. The production publication is already authorized.
- Play Console UI could not be used: computer-use automatically stopped because it could not verify the current Chrome URL safely. No alternative desktop automation or private endpoints were used to bypass that refusal. Official APIs completed the upload/draft; the owner was asked for the outstanding form details. No demonstration video has been created or submitted.

## Public privacy policy

Published on **https://akhoo.app/privacy.html**, English `/en/privacy.html`, Hebrew `/he/privacy.html` before store submission. Explains optional collection when not in use, latest-location storage, opt-out/sign-out, Android service indicator and OS limits.

- Source branch `web/nearby-location-privacy-20261104`, commit `e70da0266f40f4bce6575e03321ebaca87d2ca4e`, based on the actual deployed marketing source **68dcde2**. Main's marketing source is older and was not deployed.
- Vercel project `dist` (`prj_OQAAoAUvWmMBN1gVm7aMkhzTdhNz`), deployment `dpl_7PuuLBL7BUS3TojJK5khLcHUeNKb`, READY, production alias `akhoo.app`. Project build-ignore setting preserved.
- Reused the verified existing static artifact and refreshed `legal.json`, three prerendered privacy bodies and three shared legal-date labels. All other artifact files identical to the existing artifact. Public main HTML/JS/CSS matched the baseline before publication and remained unchanged afterward.
- Public HTTP read-back returned 200 and exact matches for the new legal JSON and all three privacy pages. New legal SHA-256 `6e2dfe465ce89e307e2840f20fb7bff7b244f286198dc85de75ecdd61c461392`. Full future builds use the updated `legalContent.ts`; no generated files committed.

## Validation and remaining physical checks

Source validation: **389 tests / 62 files** on shared source, **394 / 64** on Android; app and edge type checks, lint (zero errors, one existing resolver warning), native permission introspection and both Hermes exports. Release-number/profile checks passed. Main receives release documentation and the matching legal text only; its typecheck/lint/**354 tests** passed again before the final push. Main push triggers the existing web/admin pipeline; no native feature implementation was merged into main by this publication step.

**No physical iPhone or Android was connected; lock-screen delivery, native permission interaction and movement were not verified.** Owner requested direct production publication despite the earlier testing-track proposal. Never equate an accepted push ticket, uploaded build or store approval with handset receipt. After availability, use two controlled consenting accounts; enable notification/background permissions, lock the receiver, verify a recipient-targeted push and then a controlled nearby request. Never use unrelated users as test recipients. Android Force Stop prevents normal delivery until reopening.

Request-photo bucket cutover is outside this release; no existing public photo URLs were closed. No backend migration was needed or deployed for this native release.

## Play declaration text prepared for review

**Feature:** Nearby roadside-help request alerts when AKHOO is not in use.

AKHOO connects people requesting roadside help with nearby people who can assist. After an optional in-app disclosure and explicit permission, background location updates the user's latest location so the server can notify them of nearby requests while the app is not in use. Movement can otherwise make the last foreground location inaccurate. This is part of the app's roadside-help function. It is not used by this feature for advertising or travel-history collection.

**Foreground service:** Location. The user enables the service after disclosure and OS permission. Android shows an ongoing notification. The user can disable it in My Account or phone settings; sign-out stops it. Deferring or interrupting updates can leave location stale, miss nearby requests or match a previous recent location. Matching expires locations after 24 hours. Do not claim delivery is guaranteed.

**Real video still required:** Show the native disclosure before OS permissions, allow background access, enable the Account control, show Android's ongoing service notification, background/lock the app, demonstrate controlled nearby-request delivery, then turn tracking off. The demo must show actual behavior; no mockups or fabricated results.

References: [Google background location requirements](https://support.google.com/googleplay/android-developer/answer/9799150), [foreground service declaration](https://support.google.com/googleplay/android-developer/answer/13392821), [Apple App Review submission](https://developer.apple.com/help/app-store-connect/manage-submissions-to-app-review/submit-an-app).
