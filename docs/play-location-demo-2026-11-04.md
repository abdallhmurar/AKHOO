# Google Play location demo and Android device QA — 4 November 2026

This follows the [authorized production release](nearby-alerts-production-release-2026-11-04.md). Resolved installation on the owner's Android, captured actual native behavior, and verified a targeted push while the phone was locked. The capture/QA phase made no new build, store-track change, production deployment or broadcast. Later the same day, the owner saved both Play declarations and the existing Android 2.0.6 (11) was submitted for public review through the official API. **Update, 5 November:** public Google Play now shows 2.0.6; Apple API/public lookup confirm iOS 2.0.8 released. See the release report for the dated evidence. Store installation and the outstanding physical checks below are still separate from listing availability.

## Installation issue resolved without deleting data

The Google-generated universal APK was signed correctly but displayed Google's “Get this app from Play” screen after sideloading. Authorized Samsung Flow inspection confirmed version 2.0.6, installation from My Files, and a Play update action that did not start a download. A read-only Play API inspection at 15:21 UTC confirmed production 2.0.5 (10) completed, candidate 2.0.6 (11) draft, and internal/alpha 2.0.4 (9). The inspection edit was deleted.

For the owner's developer device, Google's official `generatedApks.list` response provides `unprotectedGeneratedSplitApks`. Downloaded variant 3 (minimum SDK 29), selecting base, arm64-v8a, xxxhdpi and Arabic/English/Hebrew language splits for the connected Samsung phone. All six APKs passed `apksigner`; the certificate matched the installed app and Google's metadata. Package `app.akhoo.help`, version/code 2.0.6/11, target SDK 36, runtime `2.0.6-nearby-v1` and `nearbyBackgroundAlerts=true` were checked.

Installed with `adb install-multiple -r` over the USB connection authorized by the owner. Result: `Success`; first-install timestamp unchanged, account session retained, and the actual nearby-alert disclosure opened. No uninstall, data clearing, permission grant command, signature modification, Play Protect change or production automatic-protection setting change was used. The official developer APKs are private QA artifacts and must not be distributed to users as the public release.

- Google signing certificate SHA-256: `47cc138345e14dbbf9d63f2fa369e6053b38816c87372ada4b72176e98b04992`.
- Developer base APK SHA-256: `25b7cf1f5b195c311415f7898d2d90efac87560e316c8015eb4e21d2e2c7bbd0`.
- Original protected universal APK SHA-256: `9d66ce5dd05122f67ad6b35b33a13ba7b5660750a62d71ef00f444bcf082689c`.
- Local ignored artifacts: `test-results/official-device-demo-11/` in the `AKHOO-play-video-handoff` worktree. Device identifiers, tokens and account data are not included in this report.

## Native permissions and background service

The owner personally accepted the disclosure and Android background-location permission. The recording shows changing Android location access from “While using the app” to “Allow all the time”; foreground location was already granted. Account subsequently displayed `طلبات قريبة بالخلفية` / `مفعّلة`. The owner briefly disabled and later re-enabled it; the final enabled state was independently observed.

Read-only device inspection confirmed notification, fine/coarse location and background-location permissions granted. `expo.modules.location.services.LocationTaskService` was foreground-active with location type `0x8`. After returning to the phone's Home screen, the notification shade displayed the genuine ongoing notification `أخوو · طلبات المساعدة القريبة`. Privacy/security prompts were handled by the owner, not automation.

Samsung Flow initially enabled remote observation but had recording/control limitations. USB ADB ultimately provided the successful installation, native recordings and device-state evidence. No recording remains intentionally running.

## Locked-phone diagnostic push — passed

At **15:47:24 UTC**, sent exactly one diagnostic push to the single recently refreshed device token belonging to the verified owner's account. The phone was already locked and Dozing. Title: `فحص أخوو — التلفون مقفّل`; body clearly said this was a test, not a real help request. Used the real requests channel and request sound. No help request was created and no unrelated user was notified.

Expo accepted the push and its delivery receipt returned `ok`. At **15:48:50 UTC**, Android's notification record contained the exact diagnostic title under the AKHOO package, while keyguard was showing, input was restricted and wakefulness remained `Dozing`. The owner then confirmed: **«آه، وصل وأنا مقفّل التلفون»**.

This verifies handset delivery of the targeted Android push while locked. It does **not** establish nearby-request selection, movement/location-refresh behavior, iPhone delivery or delivery after Android Force Stop. A pre-existing nearby battery-help notification was separately observed; it was not generated by this controlled test and is not claimed as matching-test evidence.

## Reviewed video

- [Watch the native Android demonstration](https://akhoo-922v7ljxu-abad003-6200s-projects.vercel.app/).
- [Direct MP4](https://akhoo-922v7ljxu-abad003-6200s-projects.vercel.app/background-location-review.mp4).
- Duration **24.88 seconds**, H.264, **1080 × 2480**, **2,260,329 bytes**, no audio or source data tracks.
- SHA-256: `84bd95fa92a19f267286ee297dd7863079d42af1ba0a8be941c813a45b3679d8`.
- Vercel preview `dpl_2gpcioHrQK51cSSV4khKP43SAhYR`, project `akhoo`, team `abad003-6200s-projects`, READY. No production target/domain assignment. Only the reviewed MP4, explanatory HTML and robots file were uploaded.
- Anonymous HTTP 200, `video/mp4`, identical downloaded hash, noindex header and Chromium decoding through the last frame verified.

The video contains actual native screen-recording excerpts: readable in-app disclosure, the owner's background-permission selection, enabled Account state, then the persistent service notification with the app in the background. The account email/avatar and unrelated messages/notifications are masked. Map/location and private phone Home-screen footage were excluded. No app UI, permission dialog or notification was generated or fabricated. Labels disclose that the video uses excerpts and privacy redactions.

Raw recordings remain private and git-ignored: the owner's 32-second clip, the longer permission recording and a 62-second service recording. The short final video was fully decoded, visually reviewed with per-second contact sheets, and checked against the actual source permission/service frames. The existing battery-help notification remains visible in the service excerpt; the hosting page explicitly says it does not demonstrate a new request being created or matched.

## Submission and remaining checks

1. The owner saved both Console forms: background location and location foreground service, using the prepared accurate feature description and reviewed MP4. The final FGS checkbox selection was not independently inspected. Validation passing does not establish Google's policy approval of the declarations or video.
2. At **17:18:26.133 UTC**, after official release validation passed, committed the existing production release **2.0.6 (11)** as `completed` with `changesInReviewBehavior=ERROR_IF_IN_REVIEW`. Fresh API inspection confirmed production 11, IL-only availability and unchanged testing tracks. Same bundle hash and release notes; no new build/version. [Full submission evidence](nearby-alerts-production-release-2026-11-04.md).
3. On 4 November the owner confirmed «ظهرت قيد المراجعة». His screenshot showed release 11/full rollout and both declarations under review/initial automatic checks, managed publishing OFF. The up-to-14-minute estimate concerned initial checks, not final approval. On 5 November the public listing independently showed 2.0.6; verify the public store install/update on a real device next.
4. Play Console browser automation had stopped because it could not verify the current URL safely. No alternate UI automation or private endpoint bypassed that refusal. The owner handled the forms; the official API handled the authorized publication.
5. Do not claim this clip or the diagnostic push proves new nearby-request triggering. Controlled matching/movement and any matching/arrival recording remain outstanding; isolate recipients and use consenting accounts before creating a test request. Physical iPhone QA is also outstanding. iOS 2.0.8 (35) was previously submitted with automatic release; its review state was not rechecked during this Android submission.

References: [Google automatic protection and developer APKs](https://support.google.com/googleplay/android-developer/answer/10183279?hl=en), [official generated APK API](https://developers.google.com/android-publisher/api-ref/rest/v3/generatedapks/list), [background-location video requirements](https://support.google.com/googleplay/android-developer/answer/9799150?hl=en), [foreground-service declarations](https://support.google.com/googleplay/android-developer/answer/13392821).
