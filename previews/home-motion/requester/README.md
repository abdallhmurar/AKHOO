# Requester selection and details — local motion preview

Run `node previews/home-motion/serve.cjs` from the repository root and open
<http://127.0.0.1:4178/requester/>. The local home page's “بدي مساعدة” button
also opens this screen. The default port remains 4178.

This is an isolated, Arabic, responsive visual prototype of the first two requester
steps. It does not import the Expo application, make API requests, send assistance
requests, read account data, or change Vercel, Android or iOS. The first Next button
requires one of the four native radio inputs and opens the details screen with the
matching title, animated scene and example note. Direct preview:
<http://127.0.0.1:4178/requester/?step=details&problem=battery>.

The details screen has an optional 500-character note and an optional image picker
with a local preview, replacement and removal. JPEG, PNG, WebP, GIF and AVIF images
up to 10 MiB are accepted and decoded before display. Invalid replacement files
leave the previous photo intact. The draft remains in memory while switching
between these two steps, including browser Back/Forward. Reloading clears the note
and photo. Neither is stored, put in the URL, uploaded or committed. Object URLs are
revoked when replaced or removed; the local server permits `blob:` images while
keeping all API connections disabled through CSP. The location button opens an
explanatory sheet because the next screen is outside this prototype's current scope.

## Artwork and motion

`assets/approved.png` is the approved design reference. The five independent PNG
assets were generated with the built-in image generation tool from that reference:
blue car and city header, red-hoodie battery helper, white-hoodie fuel helper,
blue-hoodie inspection scene, and green-hoodie tire helper. All headings, labels,
radios and buttons are live HTML; no text is baked into the artwork.

Each card has its own six-second Grok image-to-video MP4. The matching PNG was
uploaded as both the first and last frame, with 3:2, 720p and six seconds selected.
The prompts are saved in `prompts/production.json`. The files were downloaded using
Grok's normal Download control and are served locally. These are real character
animations, not CSS panning of still images and not literal GIF files.

`assets/approved-details.png` is the approved step-two reference.
`assets/details-header.png` and `assets/details-camera.png` were created with the
built-in image generation tool and copied into this project. The camera preserves
its generated transparency. Their exact prompts are in `prompts/details.json`.
The selected-problem card reuses the four existing character videos and posters.

Videos loop silently while visible. Selection replays the selected clip. Playback
pauses when its step or page is hidden, the preview sheet is open or the user pauses it.
Reduced-motion preference starts with posters and does not fetch video files.
Failed or blocked playback keeps the original image. No connection to Grok is
needed to view the completed preview.

The preview reuses the adjacent home preview's Noto Sans Arabic fonts and license.
It intentionally remains on the preview branch and is not a production release.

## Verification (2026-10-16)

Checked the selection-to-details flow for all four problems, optional empty
submission, 500-character limit, local image preview/removal, invalid-file
replacement, draft retention across Back/Forward and clearing on reload.
Verified 320, 390 and 480px mobile layouts, inactive-video pausing and reduced
motion (no video sources fetched). Browser console had no errors. JavaScript
syntax checks, scoped ESLint and `git diff --check` passed; media byte ranges
returned HTTP 206. The 390px screenshot is saved locally under
`test-results/requester-motion/details-390.jpg` (ignored, not committed).
