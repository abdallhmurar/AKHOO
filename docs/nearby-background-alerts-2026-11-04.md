# Nearby help alerts while the UI is closed — 2026-11-04

**Release update:** The implementation-stage scope below is historical. The owner subsequently authorized public publication; iOS 2.0.8 (35) is WAITING_FOR_REVIEW, Android 2.0.6 (11) is a committed production draft blocked by Google's permission declaration. See [the current release report](nearby-alerts-production-release-2026-11-04.md) for artifacts, privacy deployment and outstanding physical checks.

## Status and scope

Implemented and validated locally, **not deployed, built for a store, uploaded, or sent to users**. The owner explicitly chose background location with user permission. This task does not include new store-publication approval. No build/versionCode or migration number has been consumed. The photo-release approval does not cover these new native permissions.

- iOS/shared source: `fix/nearby-background-alerts-20261104`, based on `86fd28e` (main, including signed request photos).
- Android source: `fix/android-nearby-alerts-20261104`, based on `dfa7622` (actual shipped Android photo OTA source). The port retains Android layout, safe areas, motion/crash fixes and real partner submissions. **Do not build Android from the shared/main branch.**
- Default configuration remains unchanged. `AKHOO_NEARBY_BACKGROUND_ALERTS=1` enables the new native permission configuration and UI. It creates a distinct `*-nearby-v1` runtime. Never send this capability to the existing 2.0.5 Android binary via OTA.
- No main push, marketing deployment, SQL migration, function deployment, live push, or change to the request-photo bucket in this task.

## Diagnosis (read-only hosted checks)

On 2026-11-04 the database had 24 distinct users with enabled push devices. None met the nearby audience's existing freshness/availability/location conditions; 15 of those push users had no volunteer profile. Enrollment and foreground heartbeat previously depended on opening the helper screen; shipped Android explicitly disabled background location.

The request-created trigger and webhook setting exist. `notify-new-request` (version 17) and `notify-event` (version 4) were ACTIVE. The deployed request function contains the 24-hour filter, availability check, recipient RPC and delivery-count logging. This confirms an audience problem; it **does not establish delivery to an APNs/FCM handset**. No individual tokens, IDs, locations or credentials are recorded here.

## Resulting behavior

- After sign-in, new capable binaries offer an optional Arabic/English/Hebrew disclosure before location permission requests. “Not now” does not request background permission. The app remains usable without consent.
- Agreeing registers push, requests foreground/background location, records consent per account on the installation and enrolls the account from anywhere in the app. Visiting “I want to help” is unnecessary.
- GPS is refreshed at launch/resume and while the UI is active. Expo's OS task uploads the latest fix in the background. Balanced accuracy, a 250 m distance threshold and a 120-second minimum interval are requests to the OS, **not guaranteed timing**. Stationary/battery-restricted devices can update less often.
- Android runs a visible foreground-location service; iOS uses background location mode and its system indicator. Only the latest location is updated; this feature does not introduce a travel-history table.
- Account has an on/off control. Turning it off revokes local tracking consent, stops the service and disables the server's `requests` preference. If the server save fails offline, it is retried at next foreground/resume; an error explains that the off setting has not fully saved. Previously queued pushes cannot be recalled.
- Explicit sign-out, an expired/switched/restricted account, or revoked notification consent stops tracking. Headless execution verifies stored account identity, current session and consent. Old GPS results cannot be written under a new account. A location fix more than 24 hours old or over one minute in the future is ignored.
- Busy-user availability remains server-controlled. Background GPS never forces `is_available=true`. Foreground enrollment uses existing database guards. Existing exclusions for banned/blocked users, preferences and released helpers remain unchanged.
- Existing radius **20 km** and last-fix freshness **24 hours** remain. This is approximate matching, not a promise that someone is still within the radius or will accept. If the OS stops location updates, a recent last location can still qualify until expiry.
- Existing server notifications already carry title/body and can be displayed by the OS without an open UI. Force-stop in Android settings prevents normal delivery until the app is opened again. Termination, battery controls, network and permission choices affect location updates and delivery; swiping away the app is not a reliable live-GPS guarantee.

## Local verification

- Shared source: TypeScript app and edge checks; ESLint (0 errors, existing resolver warning in `medal-element.js`); **389 tests passed across 62 files**.
- Android port: TypeScript, ESLint and **394 tests passed across 64 files**, including prior Android crash/parity tests.
- New coverage: disclosure before tracking; accepting/declining; old binary/web gate; background identity and consent; denied/revoked permissions; sign-out and account changes; no late GPS write; GPS timeout; disable during permission prompt; offline opt-out retry.
- Full-migration PostgreSQL tests: account enrolled without helper-screen activity remains eligible after two hours with its UI closed; distant and >24 h old locations excluded; new background fix restores eligibility; busy accounts excluded; request opt-out honored; helper coordinates remain private under RLS.
- `node scripts/check-nearby-native-config.cjs` verifies Expo introspected permission mods, location service declaration in the installed Expo module, iOS background mode, disclosure string, separate runtime and disabled-by-default behavior. This is **not** inspection of a signed IPA/AAB's merged manifest.
- Hermes exports passed for both iOS and the actual Android branch. These are JavaScript compilation checks, not native device execution.
- Not verified: physical-phone permissions and lock-screen delivery, real movement while backgrounded, OEM battery behavior, signed native artifacts, or store approval. No phone was connected to this session.

## Concrete next release steps

1. Get the owner's approval for native test builds/uploads; reserve fresh numbers in the current main registry. Prepare isolated TestFlight and Android test profiles with `AKHOO_NEARBY_BACKGROUND_ALERTS=1`. Existing profiles intentionally do not enable this feature. Do not reuse the old build numbers used as local compilation fixtures.
2. For iOS use the shared branch plus current release settings, `AKHOO_BUILD_TARGET=testflight`, `AKHOO_PARTNER_HOME_BETA=1`, fresh version/build and OTA disabled. For Android use its dedicated branch and `AKHOO_BUILD_TARGET=android-release`, fresh Android version/versionCode. Keep test distribution isolated from production.
3. Inspect signed artifacts for background permission/mode and Android foreground location service before uploading. Check push credentials in the same release environment.
4. Perform the physical QA below, record actual results and collect a real permission/feature demo. No production rollout until these checks and the owner's publication approval.
5. Publish the updated privacy paragraph from `src/features/account/legalContent.ts` to the public policy page before the new feature is publicly distributed. `website/build.mjs` consumes this source; the public website was not changed here. Review existing Google Data safety and Apple App Privacy answers against actual collection and update only where required.
6. Submit Google's background-location/foreground-service declarations and real demonstration video with the Android release. Google approval is not guaranteed. Existing iOS 2.0.7 photo review is a separate submission; recheck its state before creating the next release.

## Draft Play explanation and demonstration

Feature: **Nearby help-request alerts while AKHOO is not in use.**

> AKHOO connects people requesting roadside help with nearby people who can assist. After an optional in-app disclosure and explicit permission, background location updates the user's latest location so our server can notify them of nearby help requests when they are not using the app. Movement can otherwise make the last foreground location inaccurate. Android displays an ongoing location-service notification, and users can stop the feature from My Account or phone settings. The rest of the app is usable without enabling this feature. Location is not used by this feature for advertising or to create a travel history.

Use the exact translated disclosure from `src/lib/nearbyAlertCopy.ts` in the demo. Record the real native candidate: sign-in → disclosure → accept → OS foreground/background permissions → Account toggle → ongoing Android service indicator → app background/phone locked → nearby request sent from a second consented test account → visible notification → tap opens the help flow → toggle off stops location service. Show rejection too. Do not fabricate a video or use real users as test recipients. Store declarations must describe only verified behavior.

## Phone QA checklist

- Two controlled accounts on separate phones; one receiver has never visited the helper screen. Enable alerts, verify server coordinates and device registration, then lock the receiver. A nearby test request must display its title/body/sound. Tap it and verify the request can be opened and acted on.
- Repeat with Android and iPhone, backgrounding normally and swiping away separately. Test real movement beyond 250 m in the background with permission. Do not demand an update at an exact two-minute interval.
- Reject the disclosure and background permission separately: app stays usable and no background tracking starts. Revoke notification/location permission in OS settings: no further location uploads. Re-enable explicitly and check recovery.
- Disable in Account online, then repeat offline and reconnect/reopen. Local GPS must stop; server opt-out must eventually persist. Sign out and switch accounts while GPS acquisition is slow; previous account must not upload or receive account-bound data.
- Receiver busy on another request, outside 20 km, or with location older than 24 hours must not qualify. A fresh authorized fix restores eligibility. Blocked/banned/request-opted-out recipients remain excluded.
- Android Force Stop: document that delivery/updates resume only after opening the app; never promise notifications through Force Stop.
- Compare edge `candidateCount`, `nearbyCount`, Expo accepted/failed results and actual handset receipt. An accepted Expo ticket is not proof of delivery to the phone.

## Official references checked

- [Expo: notification behavior in foreground, background and terminated states](https://docs.expo.dev/push-notifications/what-you-need-to-know/)
- [Expo SDK 57: location permissions, configuration and platform limitations](https://docs.expo.dev/versions/v57.0.0/sdk/location/)
- [Google Play: background location disclosure, declaration and demonstration requirements](https://support.google.com/googleplay/android-developer/answer/9799150)
