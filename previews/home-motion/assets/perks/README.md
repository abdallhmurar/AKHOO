# Perks — local motion preview

Open <http://127.0.0.1:4179/assets/perks/index.html>. The existing preview server
already serves this asset directory, so review requires no restart, new port
or server/security configuration change. The same asset URL works on the older
4178 server too, but use 4179 for navigation to the newer Account page.
Home's two Perks buttons, Activity and Account navigate here.

The full-page reference is `approved.png`; the newly approved header is
`header-approved-v2.png`. The page keeps the blue, teal and navy
palette, 250 sample points, silver helper level with 25 of 30 completed helps,
and the single sticker offer. Free benefit and 50-point cost remain separate
facts. Next-level thresholds match `src/lib/activityLevel.ts`.

## Motion and interaction

- The header uses the exact newly approved static image at its natural 3:1
  ratio, with no cropping or overlaid controls. A visually hidden heading and
  subtitle preserve the accessible page outline. No gift video is loaded.
- `scene.js` builds the silver medal from real Three.js 0.186.1 geometry: blue
  ribbons, a layered metal face and raised star. It turns before opening levels.
  Procedural studio reflections need no external textures/models. Its single
  transparent WebGL canvas caps rendering at 30fps and device pixel ratio at 2.
- Pause/Resume, reduced-motion preferences, page visibility, dialogs and
  intersection observation govern the medal. Its Pause/Resume control now sits
  below the medal. Reduced motion shows a still frame and opens dialogs
  immediately. WebGL failure preserves the static medal. No native app
  dependency changed.
- Photo and Details open a native offer dialog. Escape, close, backdrop and
  return restore focus. The active Perks item scrolls to the header;
  Home, Activity and Account navigate to their local previews.
- No redemption, API calls, purchases, private user data, storage or points
  deductions. The page identifies local fixtures and the product illustration.
  No production deployment is part of this change.

## Assets and provenance

`header-approved-v2.png` is the exact 2172 × 724 image approved in chat, copied
without image processing from built-in ImageGen output
`exec-1716b5d9-7108-4973-bce5-b064bcd16642.png`. The generation prompt is in
[header-approved-v2-prompt.txt](header-approved-v2-prompt.txt). It supersedes the
gift video in the page; earlier media files below are retained as design history.

`gift-poster.png` was generated with the built-in image tool, using the approved
design as a visual reference. Exact prompt: [gift-poster-prompt.txt](gift-poster-prompt.txt).
The poster was supplied as both first and last frame to Grok Imagine with
[gift-motion-prompt.txt](gift-motion-prompt.txt), using its 3:2, 720p, six-second
settings. The normal browser download was saved locally as `gift.mp4`.
Decoded output: **1168 × 784, 6.041667 seconds, 1,073,428 bytes**.
SHA-256: `d9315e03ab2604b74bfe6d5299ac0d70a42304667dff3594b9ee02385e7fe9aa`.

`sticker-offer.png` is an illustrative product photo created with the built-in
image tool from existing `../brand.png` and the approved mockup. It is not an
actual merchant photograph or product specification. Exact prompt:
[product-prompt.txt](product-prompt.txt). Original output:
`exec-99429db3-3b35-4f3a-afba-943d02a4bbd6.png`.

Existing Flaticon PNGs are reused from `../../activity/assets/icons/`; sources
and licenses are in that folder's `ATTRIBUTION.md`. Author credits stay visible.
Utility icons, coin stack, medal fallback and medal geometry are original code.
Existing Arabic fonts and OFL license are reused.

`vendor/three.module.js`, `vendor/three.core.js` and `vendor/THREE-LICENSE.txt`
are unchanged official distribution files from
<https://registry.npmjs.org/three/-/three-0.186.1.tgz>, pinned at **0.186.1**.
Archive integrity:
`sha512-blFeqb49wRCSGUGj7gtpfnSGHy2lwDk94RhUmS1c/hTby70kvChbWpkJ4Pm1390LqzzvTmzgXKHPEafJwCb8jA==`.
Only this third-party directory is excluded from ESLint.
Reference: [Three.js WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer.html).

## Verification

The static header revision checks image loading, natural aspect ratio, accessible
heading, absence of a gift video or obsolete controls, responsive overflow,
medal Pause/Resume and level dialog, offer details and focus restoration.
Reduced motion disables medal animation controls. Preference changes also
reconcile on frames, focus and resize to handle deferred browser notifications.

Medal levels, both offer entry points and Home/Activity/Account round trips were
checked. At 320/390/480px, images load without horizontal overflow. The offer
dialog fits 320px width and scrolls within its maximum height. Balance stays 250.
The page returns HTTP 200 under the original `connect-src 'none'` policy.
Chrome/ANGLE emits a nonfatal shader precision warning during PMREM compilation.
Scoped ESLint, JavaScript syntax and `git diff --check` pass for authored files.
The unchanged Three.js core distribution has one upstream mixed-indent warning
at line 49957; the vendor bytes are preserved and excluded from that check.
Runtime screenshots belong in ignored `test-results/perks-motion/`.
