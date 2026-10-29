# Website brand and action icons — 2026-10-29

The official website download buttons now use Apple and Google Play silhouettes instead of generic phones. Contact links, the partnership form heading and its WhatsApp draft action use the WhatsApp logo. Phone, copy, menu, FAQ, navigation, location and walkthrough symbols share Lucide outlines. The existing AKHOO artwork and wheel symbol remain.

SVG paths are bundled locally with no new runtime dependency or external icon requests. Brand marks stay upright in Arabic, Hebrew and English. Icons are decorative to assistive technology; adjacent visible labels and accessible button names remain. Store and WhatsApp destinations are unchanged. See `website/vendor/icons/README.md` for pinned upstream sources and licenses; both licenses are also available through the website licenses page.

Validation completed before publication:

- Static build, JavaScript syntax and `git diff --check` pass.
- Isolated Chrome checks passed for ar/en/he at 320, 390 and 1280 px: no horizontal overflow, brand icons at least 24 px and action targets at least 44 px.
- Nine store/contact clicks reached the expected URLs using intercepted external destinations; no WhatsApp message was sent.
- Menu, FAQ, partnership draft/close actions and four legal routes work without page errors. The draft icon is WhatsApp, while the illustrative in-app conversation uses a normal chat symbol.
- Mobile form/contact/download and desktop buttons visually reviewed from browser screenshots. No real-device test performed.
- The static upload contains exactly 59 files, excludes `.vercel`, credentials, environment files and dependencies. Compared with the previous published build, five existing files changed semantically, three icon/license files were added, and `content.js` differs only by checkout line endings.

Only the marketing site is eligible for this publication. The root/admin `vercel.json` changes disable automatic deployments for this feature branch; this is the small coordination edit in Claude's area. Vercel project `dist` (`prj_OQAAoAUvWmMBN1gVm7aMkhzTdhNz`) retains its `exit 0` ignored build step. No native application, store listing, backend or email configuration changed.

Publication verification will be recorded here after the staged deployment is checked and promoted.
