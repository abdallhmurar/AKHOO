# Google Play location demo — recording handoff, 4 November 2026

This follows the [authorized production release](nearby-alerts-production-release-2026-11-04.md). Android 2.0.6 (11) is already uploaded as a production draft. This task prepares a genuine Android recording for the location and foreground-service declarations; it does not create a new build or change a store track.

## Verified installation artifact

- Downloaded the universal APK for versionCode 11 through the Google Play generated APKs API.
- Local, git-ignored path: `test-results/AKHOO-2.0.6-11-google-signed.apk` in the `AKHOO-play-video-handoff` worktree. Size: 255,724,021 bytes.
- SHA-256: `9d66ce5dd05122f67ad6b35b33a13ba7b5660750a62d71ef00f444bcf082689c`.
- `apksigner verify --print-certs` succeeded. Signing certificate SHA-256: `47cc138345e14dbbf9d63f2fa369e6053b38816c87372ada4b72176e98b04992`; matches the Google-generated APK metadata for the existing versionCode 10.
- `aapt2` confirmed `app.akhoo.help`, versionName `2.0.6`, versionCode `11`, target SDK 36, background-location and location foreground-service permissions.
- This is the Google-signed artifact from the uploaded bundle, not a debug APK. Signature checks do not establish successful installation or device behavior. Do not uninstall or clear the owner's existing app to install it.

## Device and recording state

The owner connected their Android phone through Samsung Flow and explicitly requested Astra control. Smart View displayed AKHOO, and navigation to Account and back to Home worked. The currently displayed Account screen lacked `طلبات قريبة بالخلفية`; it did not expose an installed version number. The exact installed version is therefore unverified.

The APK transfer through Samsung Flow completed: the file remained in transfer history after the progress/cancel controls disappeared. The owner was guided to handle the installation-source prompt personally. A later fresh Smart View observation showed AKHOO open with Android's notification-permission prompt, and a subsequent observation showed the app without that prompt. The installed version number and new background-alert control have not yet been independently verified.

No video has been recorded and no locked-phone push receipt has been verified. No background-location consent or phone security setting has been changed by automation.

Windows Snipping Tool was prepared in video mode. Both Window and Rectangle capture attempts reached a picker not exposed as a targetable window by the automation host; no running recording was observed. Game Bar likewise exposed no targetable window. Samsung Flow's observed menu offers screenshots, not video recording. Native Samsung screen recording is the next capture route being inspected. These are tooling observations, not evidence of an AKHOO app failure.

## Capture sequence

1. Transfer the verified APK to the owner's phone through Samsung Flow. The owner handles any installation-source/security prompts; do not bypass them or uninstall the existing app.
2. Prepare a portrait screen recording of the actual Android app, excluding unrelated desktop content, calls and personal notifications. Start before accepting the new disclosure. Code 11 shows it automatically on first signed-in use; it can also be reopened from `حسابي` → `طلبات قريبة بالخلفية`.
3. Show the disclosure `ننبّهك إذا حدا احتاج مساعدة قريب منك؟` and its text. The owner personally accepts `موافق، فعّل` and the Android permission flow, including background access. Do not automate security or privacy permission requests.
4. Show the Account state `مفعّلة`, then put the app in the background and show the genuine persistent notification `أخوو · طلبات المساعدة القريبة`. Observe actual behavior; do not create a mock notification or substitute a web/iOS recording.
5. Demonstrate the declared background feature with controlled consenting accounts. Before any test request, ensure it cannot alert unrelated users. A recipient-targeted diagnostic push checks delivery only and must not be represented as proof of nearby-request matching.
6. The owner can demonstrate disabling the feature and disappearance of its foreground-service notification. Preserve the owner's chosen final preference.

Aim for a short video (Google recommends 30 seconds or less), but retain the real disclosure, runtime prompt and background behavior. Do not fake permission dialogs, timestamps or notification results. Review the actual video before sharing; keep raw recordings and personal data out of git. No video link exists yet.

## Remaining publication work

Supply the real recording URL and complete both Google Play declarations, then resume publication of the existing draft 11. The public-release authorization remains valid. Physical locked-phone delivery, movement/location refresh and complete request matching remain unverified until observed separately.

References: [Google background-location video requirements](https://support.google.com/googleplay/android-developer/answer/9799150?hl=en), [foreground-service declarations](https://support.google.com/googleplay/android-developer/answer/13392821), [Google-generated APK API](https://developers.google.com/android-publisher/api-ref/rest/v3/generatedapks/list).
