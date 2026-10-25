# Android production release 2.0.3: prepared, NOT started

Android is frozen. Nothing in this file has been run. Start only when **both** are true: Google Play approved production access (email to the account owner; the request was sent on 2026-10-25 at 15:55) **and** the owner says to build Android.

Source: branch `android/release-2.0.3-20261025`, which is `main` (everything merged on 2026-10-25) plus the version name `2.0.3` and the draft-only submit profile `android-production`.

## What the build contains

- Everything on `main` that is not iOS-only. The new iOS/web design lives in `*.ios.tsx` / `*.web.tsx` files and does not reach Android, whose screens are the shared ones.
- Native parts that need this binary and that Android build 7 does not have: notification sound pack and channels (`akhoo_request`, `akhoo_update`, `akhoo_message`, `akhoo_calm`; `expo-notifications` plugin `sounds`), the push `channelId`/`priority` fix, the corrected adaptive launcher icon (`assets/images/adaptive-icon.png`).
- Shared app code: announcement video/GIF player, notification events and preferences, AKHOO+ removal, translations, legal text.

Deliberately **not** in it:

- Background location: `ACCESS_BACKGROUND_LOCATION`, `FOREGROUND_SERVICE` and `FOREGROUND_SERVICE_LOCATION` stay blocked in `app.json`, so no Google permission declaration is needed for this release. Volunteer availability still refreshes only while the app is open.
- The iOS partner/home TestFlight beta (its code and assets are iOS-only; the Android bundle was checked and contains none of its assets).

## Checked on 2026-10-25 (main `70302a4`)

`tsc`, `eslint`, 307 tests, edge-function typecheck, the admin checks, the web export, and a local Android JavaScript export (`expo export --platform android`, 13 MB Hermes bundle). CI on `main` is green. EAS holds the FCM V1 key for `app.akhoo.help` (checked 2026-10-23). **Not checked**: a real Android build, the app on a real phone, the Expo Free plan's remaining cloud Android builds, and what Play Console shows.

## Versions

- Version name `2.0.3` (also the OTA runtime, `runtimeVersion.policy = appVersion`; an OTA published later for Android must come from this version's source).
- `versionCode`: `app.json` still says 7 (the closed-test build). The `production` build profile has `autoIncrement`, so the build becomes **8**. Play rejects a versionCode it has already seen; if Play Console shows a higher one, set it by hand first.

## Steps once approved

1. Read the approval email, then ask the owner for the explicit go-ahead to build.
2. Build the bundle: `eas build --platform android --profile production` (uses the Free plan's cloud allowance). If the allowance is gone, run the GitHub workflow **Android release build** (Actions, "Run workflow", type `BUILD-ANDROID`); it builds with `--local` on a GitHub runner and keeps the `.aab` for one day (it has never been run).
3. Install the result on a real Android phone if possible: launcher icon (heads and the AKHOO line visible), a nearby-request notification with sound and heads-up, an announcement with video.
4. Upload as a **draft**: `eas submit --platform android --profile android-production --path <file.aab>`. A draft on the Production track is not live.
5. The owner finishes the release in Play Console: release notes, a staged rollout (suggested 20 %, then 100 % after a day without crashes), then "Send for review". Nothing goes to users before that.
6. After most users have updated: make the `request-photos` bucket private (build 7 still reads public URLs) and send an admin announcement asking people to update.

## If something is wrong

Halt the rollout in Play Console. A fix needs a new versionCode and a new upload; users who already updated keep the new version until they update again.
