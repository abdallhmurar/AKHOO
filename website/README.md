# AKHOO marketing website — local preview

This is a standalone public introduction to AKHOO. It is separate from the
authenticated Expo application and is not deployed by this task.

## Run locally

Use Node.js 24 (for the existing app's TypeScript legal-content source) and the
repository's installed dependencies. Install the website's pinned Motion library
once (or after its lockfile changes):

```powershell
npm.cmd ci --prefix website --ignore-scripts
node website/build.mjs
node website/server.mjs
```

Open **http://127.0.0.1:4180/?lang=ar**. English and Hebrew are available from the
language menu or `?lang=en` / `?lang=he`. The server binds to loopback only and
serves only `website/dist/`; it cannot serve the repository or environment files.
The optional `AKHOO_WEBSITE_PORT` variable changes the local port.

If Node is not on PATH on this Windows workstation:

```powershell
$env:PATH = 'C:/Users/User/AppData/Local/nodejs-portable/node-v24.21.0-win-x64;' + $env:PATH
```

Rebuild and reload the browser after edits. Generated assets and bundles stay in
the ignored `dist/` directory. `website/` is excluded from future EAS uploads.

## Visitor flow

- Introduction and four roadside-help categories.
- Interactive phone preview with requester/helper tabs, selectable issue cards,
  three navigable steps, an optional local note and an illustrative map. It never
  creates requests, reads a real location or uploads photos. Notes last only for
  the current demonstration and are cleared when the page or language changes.
- Helper community, animated perks artwork, and the app's real Three.js gift.
- Partnership form with local validation and a review dialog. It only prepares a
  WhatsApp message. Nothing is submitted or stored by this website; visitors send
  the message themselves in WhatsApp. The copy button is an alternative.
- FAQ, support phone/WhatsApp, and iPhone download link.
- Android is described as **closed testing**, without a public-download claim.
- Privacy, terms, and account-deletion instructions in all three languages.
  Privacy/terms are copied directly from the app's existing `legalContent.ts`.
  Credits are accessible from those pages, without repeated icon-credit footers.

## Approved source assets

The build copies the existing assets rather than generating replacement artwork:

- `previews/home-motion/assets`: AKHOO logo, road header, help/helper movies.
- `previews/home-motion/requester/assets`: four existing service illustrations.
- `previews/home-motion/assets/perks/header-people-motion-v3.*`: gift exchange.
- `src/components/dock-assets`: existing person/handshake/gift images.
- `src/features/home/rewardsGiftScene.web.ts`: the interactive gift engine.
- Existing Tajawal, Inter and Noto Sans Hebrew font packages and their licenses.

The current design adds a selectable hero scene, a three-part connection story,
a phone walkthrough and a dedicated interactive gift panel. Selecting an issue
in the hero carries that choice into the phone preview. Motion
14.4.0 handles reveal animations and reading progress; reduced-motion preferences
disable the decorative transitions. Motion's MIT license is included in the build.
Research sources and the MCP investigation are recorded in `DESIGN-NOTES.md`.

The right third of the gift-exchange movie contains baked Arabic copy. The website
crops that area and renders its own translated text outside the artwork. Videos
have posters, loop silently without controls, and pause offscreen or in background
tabs. Reduced-motion preference uses still artwork. The WebGL gift loads near the
viewport and has a static fallback when WebGL is unavailable.

## Preview limitations

No marketing domain, analytics, mailing-list database, store release, or production
hosting is configured. The preview has `noindex` metadata. Contact information and
store links use existing public project details. There are no fabricated user
counts, testimonials, response-time promises, or fixed Android release dates.

## Verification, 2026-10-21

Browser checks covered Arabic, English and Hebrew at effective widths of 320,
approximately 768, 1024 and 1440 CSS pixels, plus the normal desktop viewport.
There was no horizontal overflow or overlapping desktop header navigation.

Verified mobile menu, language changes/RTL, requester/helper tabs, partner-form
required fields and draft generation (without sending), Android availability
dialog, legal navigation, media loading and 3D gift interaction. Reduced-motion
emulation paused all videos and displayed posters. Browser-extension warnings
were excluded from application errors.

Local HTTP checks passed for every built page and asset, video range requests
(`206` and `416`), unknown paths (`404`), disallowed writes (`405`), and a
path-traversal attempt (`403`). Translation dictionaries have matching keys.

Screenshots and local server logs are stored under ignored
`test-results/website-local/`. The local server is intentionally left running for
the requested review; no website deployment is part of this work.

The second edition was checked at 320 CSS pixels in all three languages, at 390
in Arabic, at approximately 768 and 1024 in English/Hebrew, and at 1440 in Arabic.
The phone's issue selection, next/back/restart, helper flow and local note
retention were exercised. Gift interaction reached its WebGL celebrating state.
The three videos paused under reduced motion, and hidden sections remained
readable. Partnership validation/draft generation, the Android information dialog,
mobile navigation and the Motion license link passed. No JavaScript errors were
captured by the browser during these checks.

The subsequent journey design was checked at 320 CSS pixels in all three
languages, around 768 and 1024 in Arabic/English, and on the desktop viewport.
Scenario buttons showed exactly one scene, changed the translated caption and
carried the selected issue into the phone. Both role shortcuts worked. Switching
away from the battery scene paused its video; returning resumed it. Reduced motion
stopped the beam, scene-entry animation and videos. No horizontal overflow or
JavaScript errors were observed. Screenshot evidence includes
`test-results/website-local/journey-route-ar.jpg`.

The app-color pass restores the actual project's signal blue (`#1768E5`),
home background (`#F2FBFF`) and blue/teal dock gradient. It adds scene floating,
decorative orbiting accents, button press responses, perspective scene changes
and a sequenced connection path. Continuous effects pause outside the visible
section and in background tabs. Reduced motion disables these effects.

Browser checks verified the color pass at 320px in Arabic, English and Hebrew,
390px in Arabic and desktop. Scene selection still reaches the correct issue in
the phone preview. Language changes create exactly one animation wrapper and one
decoration group. Offscreen animations pause, reduced motion stops all new CSS
animations and videos, and no application errors were captured. Visual proof:
`test-results/website-local/app-colors-motion-ar.png`.

The subsequent storytelling pass replaces decorative icon clusters with labeled,
consistent service symbols placed inside their illustrated example. The hero
explains what AKHOO does and prioritizes download; the following section explains
benefits instead of duplicating the interactive steps. Helper, rewards, business
and download copy has been revised in Arabic, English and Hebrew. Decorative
orbs, floating badges and duplicate labels are removed; the app's media and
interactive 3D gift are retained. Research is recorded in `DESIGN-NOTES.md`.

Validation: build and JavaScript syntax checks passed. Browser checks covered
320px in all three languages, Arabic at 390px and 767px, and desktop. No horizontal
overflow, broken images or JavaScript errors were observed. Scene selection
carried the chosen issue into the phone, requester and helper flows worked,
the gift reached its WebGL celebration state, and the rewards link reached the
download section. Reduced motion paused all videos and disabled continuous scene
animation. The scene's inherited RTL alignment was corrected. Local proof:
`test-results/website-local/story-mobile-ar.png` and
`test-results/website-local/story-desktop-ar.png`.

The hero's four service scenes now play their existing requester MP4s (battery,
fuel, tire and other) rather than still illustrations. Assets load when visible;
switching the selected service immediately pauses hidden clips. Videos loop
silently inline with no playback controls. Posters remain for loading failures
and reduced motion. The old CSS still-image zoom has been removed.

Verified all four MP4 responses, decoded playback and increasing playback time,
hidden-video pause, mobile layout at 390px, reduced-motion pause and an empty
browser error log. Screenshot: `test-results/website-local/service-videos-ar.png`.

The benefits section now uses a light background, a short centered heading and
three illustrated cards: location, chat and request status. The illustrations
are local CSS/SVG examples, labeled as illustrative and hidden from assistive
technology because the adjacent text explains the same benefits. They make no
network requests. Route, typing and status accents animate only while the
section is visible and respect reduced motion. All text has Arabic, English
and Hebrew versions.

Verified three-language layouts at 320px, the 767px two-column card layout,
desktop rendering, reduced-motion cancellation and an empty browser error log.
No page or card overflow was observed. Screenshot:
`test-results/website-local/benefits-cards-ar.png`.

The benefits composition now gives location a large card beside two smaller
chat and status cards. The map uses a raised CSS surface and glossy animated pin;
its request card reuses the app's battery artwork. Chat reuses the existing hands
icon and status uses the AKHOO logo. All examples remain decorative, translated
and labeled as illustrative. A new link leads to the existing interactive demo.
No additional assets, dependencies or backend calls were introduced.

Validation: build and JavaScript syntax checks passed. Browser checks covered
320px in Arabic, English and Hebrew, Arabic at 390px, Hebrew at 767px and English
at 1024px, plus the normal desktop view. No page/card overflow or clipped copy
was observed. The new link reached the demo, whose next-step control worked.
Reduced motion disabled all benefit animations and paused videos; the browser
error log was empty. Screenshot: `test-results/website-local/benefits-depth-ar.png`.
