# AKHOO marketing website — local preview

This is a standalone public introduction to AKHOO. It is separate from the
authenticated Expo application and is not deployed by this task.

## Run locally

Use Node.js 24 (for the existing app's TypeScript legal-content source) and the
repository's installed dependencies. No additional package installation is needed.

```powershell
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
- Requester/helper tabs explaining the three steps.
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
