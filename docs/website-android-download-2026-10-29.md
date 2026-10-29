# Website Android download — 2026-10-29

The owner asked for the Android button shown on the official website to take visitors to the app. It now reads **حمّل من Google Play** and opens `https://play.google.com/store/apps/details?id=app.akhoo.help`, using a standard HTTPS link with the same new-tab behavior as the Apple button. The outdated closed-testing dialog, event handler and translated dialog copy were removed. The corresponding FAQ answer and button label were updated in Arabic, English and Hebrew.

## Deployment

- URL: https://akhoo.app/?lang=ar#download
- Target/status: production, READY.
- Vercel project: `dist`, `prj_OQAAoAUvWmMBN1gVm7aMkhzTdhNz`, team `abad003-6200s-projects`.
- Source: `832a63ea3424bc8d562cc7daf02c7470c30e64ac`, `web/android-download-20261029`.
- Deployment: `dpl_2bjDnAWebHSTKF3foM1r8rna4xrv`, `dist-k5hoqjq1d-abad003-6200s-projects.vercel.app`.
- Built static `website/dist/` only. Staged with `--prod --skip-domain`, checked the protected staged JS files through authenticated `vercel curl`, then promoted that exact deployment. Protection was not disabled.
- The project still has `commandForIgnoringBuildStep: exit 0`. The www redirect remains 308. No DNS/email settings, native applications, app-store releases, backend behavior, partnership form or indexability changes were made.
- App/admin Git previews are disabled for this branch; the production website was deployed explicitly. No push to main.

## Verification

- JavaScript syntax, matching language keys and static build passed; both existing partner-feed tests passed.
- Before deployment, comparison of all 56 website output files with the live site found exactly two changed files: `site.js` and `content.js`.
- Isolated Chrome at 390px, before and after publishing: the Android link rendered with the correct localized label, remained within the viewport, had a 62px target height, and its click opened the exact Google Play URL in each language. No page errors. The old Android dialog was absent and the iPhone URL remained unchanged. Arabic download-section screenshot inspected.
- The external store navigation was intercepted in the browser check to assert the destination without requiring a Google session. Separately, the public Play listing URL for `app.akhoo.help` with `gl=IL` returned HTTP 200. Native Play Store handoff, installation and country/account eligibility were not tested on a physical Android phone.
- After promotion, all 56 served files are byte-identical to the tested local build. Vercel inspection of `akhoo.app` resolves to the new READY production deployment; www still redirects to the apex.
- Static-site observation: browser error list empty. No server application code or function changes were part of this release; runtime function logs were not used as evidence.

Local validation outputs and screenshots are kept in ignored `credentials/`, not committed. The deployed site still uses the existing `noindex,nofollow` metadata, as noted during the domain connection task.
