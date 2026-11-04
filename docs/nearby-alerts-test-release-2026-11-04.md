# Nearby alerts — approved native test distribution, 2026-11-04

The owner approved: “جهّز وانشر للآيفون والأندرويد، ونفحص وصول الإشعار والتلفون مقفّل”, in response to the proposal for native test builds. Scope: TestFlight and Android internal testing; physical lock-screen/background QA follows installation. This is not a production App Store review submission or Google Play production rollout.

## Reserved releases

- iOS **2.0.8 (35)**, profile `nearby-testflight-208`, branch `ios/testflight-nearby-20261104`, based on `133a5c5`; OTA disabled, runtime `2.0.8-testflight-nearby-v1`, internal group `Test`.
- Android **2.0.6 (11)**, profile `nearby-internal-206`, branch `android/test-nearby-20261104`, based on `8aef45c`; keeps the actual Android photo/parity/crash fixes, channel `nearby-test`, runtime `2.0.6-nearby-v1`, internal Play track only.
- Both use `AKHOO_NEARBY_BACKGROUND_ALERTS=1`. Numbers reserved in main before use; next iOS build 36, Android versionCode 12. Existing production versions and OTA channels remain untouched.

## Preflight

Apple API: latest build 34 VALID; iOS 2.0.7 is now READY_FOR_SALE. Existing internal group `Test` found. Google API: production 2.0.5 (10), internal and closed test 2.0.4 (9), maximum uploaded bundle 10. Temporary inspection edit deleted without committing.

The prepared code passed 389 shared / 394 Android tests, TypeScript, ESLint (one existing resolver warning), native-config introspection and both Hermes exports. No code changes were made for this release beyond explicit build/submit profiles and release documentation. `docs/nearby-background-alerts-2026-11-04.md` records implementation and the physical-device test checklist.

## Build / distribution results

In progress. Record actual IDs, signed-artifact checks, submission and tester availability here before marking complete. Do not infer handset delivery from an accepted Expo ticket or an uploaded build.

## Physical QA after installation

1. Receiver signs into the new build, enables nearby alerts and notifications, grants background location, then locks the phone without using Android Force Stop. The receiver need not open the helper screen.
2. Use a second controlled account nearby to create a clearly marked test request. Avoid notifying unrelated users; use recipient-targeted diagnostic delivery first or explicitly isolate controlled test accounts for the request test. Verify visible notification, sound and tap navigation, then close/cancel the test request.
3. Repeat with Android and iPhone, normal backgrounding and termination separately. Test real movement, opt-out, permission revocation and sign-out. Record edge audience counts and actual phone receipt independently.

Public policy publication and the Play background-location/foreground-service declaration/demo are required before a public rollout; no marketing deployment or public rollout has been performed by the test release.
