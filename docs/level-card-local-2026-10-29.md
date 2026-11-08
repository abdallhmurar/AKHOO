# Local volunteer level card — 2026-10-29

## Latest visual options — 2026-11-09, after counter feedback

The owner did not like the saturated gradient counter and requested something better. The dev-only preview now shows two different light concepts: **impact** (large blue count, subtle native handshake artwork, quiet footer) and **compact** (horizontal count with a slim tinted caption). Both omit levels and targets, retain the app's blue/teal colors, and animate only briefly on count changes. Numbers are example-only. The main controls stay visible; language/theme/width tools are collapsed by default so the cards are easy to compare.

`HelpCounterConcept` is imported only by `LevelCardPreview`, behind the existing dev-web route guard. No Activity screen or `CompletedHelpCard` integration was changed in this follow-up. The earlier saturated design remains an unapproved local draft; neither proposal is published or selected for release. New ar/en/he copy is the only change in Claude-owned files. No backend calls/writes, store action or deployment.

Validation: TypeScript and targeted ESLint passed. Isolated localhost browser checks passed at 320/390/480: both counters update 44→45, zero has accurate copy, 1000 fits at 320, no levels/untranslated keys/page errors, ar/en/he, dark mode, reduced motion and replay. Arabic normal/narrow and Hebrew compact screenshots were inspected. The compact footer spacing and long-number sizing were corrected before the final check. External requests were blocked. Physical devices and native large-font behavior were not tested. Existing unit tests were not rerun because production components/data logic were unchanged by this follow-up.

## Latest revision — 2026-11-09

The owner requested removing levels and keeping only the completed-help counter in AKHOO colors. `CompletedHelpCard` replaces the previous card in the same Activity entry points. Its background uses the existing signal-blue and community-teal brand tokens; it displays the total, “فزعاتك بتفرق”, and a short caption. There is no rank, medal, next target, denominator, percentage, or progressbar accessibility role. The displayed count is unbounded by the old 60-help threshold.

The real lifetime `get_volunteer_completed_count` query, loading/error handling, points balance and rest of the page are unchanged. No backend change. The existing local URL still works; its initial **44** is explicitly an example, with zero, large-count, increment, replay, language, theme and width controls. A brief 420ms scale/fade runs on count changes, respects reduced motion, and cleans up. The old card-specific level model/tests were removed; shared level policy elsewhere was not changed by this local card task.

Validation: TypeScript passed; source ESLint passed with the pre-existing `medal-element.js` resolver warning; 330 tests across 57 files passed, including adapted counter accessibility/update and reduced-motion cleanup checks. The initial unfiltered lint run also picked up ignored generated bundles in `credentials/`; rerunning with `--ignore-pattern 'credentials/**'` avoids those non-source files. Isolated headless Chrome at 320/390/480 passed without page errors/overflow; checked 44→45, zero/1000, ar/en/he, dark mode and reduced motion. Arabic narrow/normal and dark screenshots inspected. External requests were blocked. Native devices and the authenticated RPC were not tested this revision; no native build or new export was made.

Saved on the same review branch; app/admin Vercel deployment remains explicitly disabled. No store build, OTA, backend write, or publication. The remaining sections describe the original October design and are kept as history.

## Original October revision

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
