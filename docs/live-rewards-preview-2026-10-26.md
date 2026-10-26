# Live points card — local review, 26 October 2026

The approved navy/teal/gold concept is now a live iOS/web component. It replaces only the points panel in Perks. The Android panel, other medals, home layout and rewards rules are unchanged.

## Behavior

- Native text, actual spendable balance and confirmed-help count from the existing Community queries. No points are awarded by the component.
- A procedural Three.js medal with thick metal edges, a faceted star and blue/teal curved ribbons. Gentle idle motion; tap/keyboard spins it, mouse movement tilts it. iOS uses the existing offline WebView bridge and selection haptic.
- Balance and progress interpolate when their input values change. Actual target values are exposed to accessibility APIs.
- Existing tier thresholds remain authoritative. Unearned rank shows its neutral fallback; earned bronze/silver/gold/green medals use their respective metals. At the highest level, the caption shows the total help count rather than a fraction greater than 100%.
- Existing user-scoped points/count queries refresh on focus/foreground and every 30 seconds while the card's screen is active. Timers stop on blur, background and blocking guide overlays.
- Reduced motion stops idle/spin/counter animation. WebGL failure retains the SVG fallback. Offscreen/hidden web scenes stop rendering; the existing native wrapper unmounts offscreen/background WebViews.
- Arabic/Hebrew use right-to-left progress and English uses left-to-right. Large native text uses a stacked layout. No motion-control buttons were added.

## Local preview

Run `npm run preview:rewards` in this branch, then open `http://127.0.0.1:4186/` on the computer. This is a loopback-only URL, not a phone/public link.

The review harness runs the actual component, typography helpers, translations, gradient and 3D engine. Only navigation/guide context is replaced. Its clearly labelled sample values (320 points, 42 helps), level/language selectors and +10 button are local review controls; no backend is contacted or changed. The harness is not an app route. Generated bundles, logs and screenshots live in ignored `credentials/live-rewards-preview/`.

## Validation and limits

- TypeScript and targeted ESLint passed.
- Existing suite: 50 test files, 307 tests passed. After adding the top-level labels, locale/activity-level/native-bridge tests passed (17 tests).
- Final iOS and web Expo exports succeeded. This is a bundling check, not an IPA upload or physical-device test.
- Chrome review: Arabic, English and Hebrew, 320px and 390px CSS widths, no horizontal page overflow; bronze/silver/gold/green/new states; changing balance/count; RTL progress; reduced-motion setting; accessible progress values. App error logs were clear; unrelated extension warnings were ignored.
- Reviewed the real data path: Community queries → `rewardRepository.points` / `get_points_balance` and `get_volunteer_completed_count` → existing rank calculation → panel props. An authenticated live-account session was **not** exercised. The local review uses sample inputs, not live account data.
- Physical iPhone checks of WebKit rendering, VoiceOver, Dynamic Type and haptics remain outstanding.

## Delivery scope

Branch `ios/live-rewards-preview-20261026`, based on `origin/main` at `67bcbdd`. GitHub synchronization only; root/admin Vercel automatic deployment is disabled for this branch. No merge to main, Vercel deployment, TestFlight upload, App Store/Play change, OTA, migration or backend write. Two new labels in each locale are limited to this card; no existing translations changed. No build or migration number reserved.
