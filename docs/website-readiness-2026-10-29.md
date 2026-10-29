# Marketing website readiness — 2026-10-29

Scope: the owner's five requested improvements to `akhoo.app` only. This does
not change the native applications, their release numbers, store listings,
backend function, database schema or admin interface.

## Changes

- Indexable, prerendered HTML for the home, privacy, terms, deletion and credits
  pages in Arabic, English and Hebrew: 15 pages, localized canonical/hreflang,
  robots.txt, sitemap.xml and WebSite metadata. Legacy language query links
  redirect to their localized routes on Vercel.
- Partnership requests use the existing public function and shared validator.
  The review step precedes the final POST. Success requires `{ok:true}`; duplicate
  clicks are blocked, failures retain input, and success clears personal data,
  including after a language switch. The application is tagged `source=web`.
  Existing admin review and best-effort owner email notifications are reused.
  Website privacy explains these contact details and their use.
- The rose help card opens an app chooser. Existing Android intent/iOS custom
  scheme links target `/requester`; visible web and store alternatives remain.
  The website's interactive phone is still clearly an illustrative demo.
- Three 1200×630 sharing images use the already approved artwork and real brand.
  Open Graph and Twitter metadata are provided in each page's initial HTML.
- Derived WebP illustrations total 605,628 bytes, versus 18,935,258 bytes of
  source PNGs (96.8% smaller). Original app artwork is untouched. A 4 KB favicon
  replaces loading a 902 KB PNG. Startup JavaScript is bundled; the gift engine
  remains lazy. Lossless WOFF2 copies reduce fonts from 951,456 to 335,224 bytes.
  Save-data/slow-network modes retain static artwork. Form inputs use 16px text
  to avoid automatic input zoom on iPhones.

## Verification

`node website/build.mjs`, `node --test website/partner-feed.test.mjs` and
`node website/readiness.test.mjs`. The readiness suite intercepts every submission;
it does not contact businesses or create applications. It checks 15 raw pages,
metadata and sitemap; Chrome/WebKit at 320/390 CSS pixels in all three languages;
desktop layout; platform link selection; required fields; review; normalized body;
duplicate guards; success; 429/400/500, malformed success and network failure;
retained fields; language switching; reduced motion and save-data fallback.

Screenshots and cold-network measurements are kept in ignored `credentials/`.
WebKit/phone viewport emulation is not testing on an actual iPhone or Android.
The owner has both phones and will check the published link. Native link handling,
installed-app state and iOS low-power mode need that actual-device result.

## Publication and live verification

Pending the final build and live checks. Deploy only the static `website/dist/`
directory to Vercel project `dist` (`prj_OQAAoAUvWmMBN1gVm7aMkhzTdhNz`). The
project's ignored-build command remains `exit 0`. The small root/admin Vercel
changes only suppress automatic deployment of this task branch; no push to main.

Search engines choose when to crawl/index; this work removes technical blockers,
not a promise of search visibility. Email acceptance and final mailbox delivery
are separate from successful database storage.
