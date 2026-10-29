# Local volunteer level card — 2026-10-29

The owner approved replacing only the existing level/progress card, without a star. The rest of Activity and all of Benefits retain the original layout. This branch starts at `abe631a`, not the earlier full-page mobile-hub exploration.

## Preview

- Local development: `http://localhost:4190/level-card-preview`.
- The dev-web-only route renders the same card as Activity with explicitly labelled example values. Controls cover add-one, replay, reset, level boundaries, Arabic/English/Hebrew, light/dark and narrow widths.
- The card has a blue-to-teal progress ring, completed-help count, current level, remaining count and next level. No medal or star is rendered.
- The production Activity integration retains `get_volunteer_completed_count` for the authenticated user, the existing loading/error states and centralized level thresholds. Returning to Activity refreshes that count. Example values are confined to the preview.
- Progress animates for one second when its value changes; there is no continuous animation loop. System Reduce Motion is respected. Pending animations and subscriptions are cleaned up.
- Rendering uses native React Native/SVG primitives. There is no WebView, WebGL, Three.js or bitmap text in the new card. Large native font settings switch to a stacked layout.

## Isolation

No store build, OTA, deployment, database change or backend write was performed. GitHub synchronization is on `ui/level-card-local-20261029`; Vercel deployment is disabled for that branch in both app and admin configuration. No version/build number changed.

Small changes in Claude-owned areas: a new `levelCard` translation namespace in the three existing locales, plus the branch-specific deployment suppression. Existing locale keys and application policy were preserved.

Metro previously reused an absolute Expo Router route context from another worktree because dependencies are shared. Its cache version now includes the worktree path. Only exports after this fix validate this implementation. The Android source-graph check now requires the new card/model and rejects the earlier full-page `mobileHub` prototype.

## Verification

- TypeScript: passed. Full suite: 342 tests across 58 files passed. The 15 new model/component cases cover level boundaries, invalid counts, updates, reduced motion and cleanup; they were rerun after the final compact-ring spacing adjustment.
- ESLint: no errors; the existing `components/motion/medal-element.js` import-resolver warning remains.
- Isolated headless Chrome on localhost: passed at viewport widths 320, 390 and 480. No page or console errors. Add-one changes 42 to 43 and remaining 18 to 17; replay visibly interpolates the arc; reset, languages, dark mode, reduced motion and counts above the final level all passed.
- Screenshots inspected for Arabic normal/narrow, Hebrew and dark mode. Card dimensions are 288×227, 358×180 and 448×182; content stays within the viewport. Narrow ring labels fit within the circle.
- Final Android, iOS and web exports and source-graph verification recorded with the task's local validation outputs under ignored `credentials/`.

Not verified on physical iOS/Android devices or against an authenticated account's live completed-help RPC. Browser verification used explicitly labelled example data with non-local requests blocked; it did not create help records or write to Supabase. Native large-font layout is implemented but not device-verified.
