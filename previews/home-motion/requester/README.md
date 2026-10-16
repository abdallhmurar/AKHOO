# Requester flow — local motion preview

Run `node previews/home-motion/serve.cjs` from the repository root and open
<http://127.0.0.1:4178/requester/>. The local home page's “بدي مساعدة” button
also opens this screen. The default port remains 4178.

This is an isolated, Arabic, responsive visual prototype of all three requester
steps plus waiting, accepted and confirmation screens. It does not import the Expo application, call its APIs, send assistance
requests, read account data, or change Vercel, Android or iOS. The first Next button
requires one of the four native radio inputs and opens the details screen with the
matching title, animated scene and example note. Direct preview:
<http://127.0.0.1:4178/requester/?step=details&problem=battery>.

The details screen has an optional 500-character note and an optional image picker
with a local preview, replacement and removal. JPEG, PNG, WebP, GIF and AVIF images
up to 10 MiB are accepted and decoded before display. Invalid replacement files
leave the previous photo intact. The draft remains in memory while switching
between all three steps, including browser Back/Forward. Reloading clears the note
and photo. Neither is stored, put in the URL, uploaded or committed. Object URLs are
revoked when replaced or removed. The location button now opens the third screen:
<http://127.0.0.1:4178/requester/?step=location&problem=battery>.

## Location preview

The third screen uses the same header, compact progress bars, typography, rounded
cards and footer as the details page. Its interactive map uses the already installed
MapLibre GL JS package with the same OpenFreeMap Liberty style as the application.
The local server exposes only four explicitly allowed MapLibre distribution files
from `node_modules`; no dependencies or generated vendor bundles were committed.
Run the repository's dependency installation first if `node_modules` is absent.

The map starts at an illustrative Jerusalem point labeled as a preview. It never
reads the device's GPS or requests location permission. Manual selection shows a
fixed center pin; drag/pinch, click a place, or use keyboard arrows and +/- before
confirming. Cancel restores the selected point. Recenter returns to that point;
Update resets to the illustrative point. Confirmed points survive switching steps
and are kept only in memory. Send is disabled while choosing a point or while the
initial map is unavailable. It opens the local waiting preview and does not create
a real assistance request.

## Waiting preview

Send opens <http://127.0.0.1:4178/requester/?step=waiting&problem=battery>.
The page matches the approved waiting mockup: compact map, white 3D scene card,
RTL status timeline and paired refresh/cancel buttons. A visible local-preview note
clarifies that the waiting status is simulated. Refresh reports the unchanged demo
status; it never invents a helper, notification or ETA. Cancel opens a confirmation
dialog; continuing resumes motion, while confirming returns to the location step
and keeps the note, optional photo and selected map point in memory.

The existing map frame moves between the location and waiting screens, preserving
the selected point and one WebGL instance. Browser Back/Forward works across the
screens. The waiting scene is decorative; headings and status remain live HTML.
The pause button, reduced-motion preference, offscreen and hidden-tab behavior also
apply to this clip. Opening the cancel dialog pauses it.

`assets/waiting.png` was generated from `assets/approved-waiting.png` using the
built-in image tool, then supplied as the first and last frames in Grok Imagine.
`assets/waiting.mp4` is a six-second 1168×784 video (1,323,448 bytes), downloaded
through Grok's Download control. The teal pin and blue magnifying glass rotate
independently around the car, with matching starting and ending poses. It plays
silently in a loop from the local server. Exact prompts and settings are recorded
in [prompts/waiting.json](prompts/waiting.json). This is a rendered 3D video, not an
interactive 3D model or a GIF file.

## Accepted and confirmation previews

- Accepted: <http://127.0.0.1:4178/requester/?step=accepted&problem=battery>
- Confirmation: <http://127.0.0.1:4178/requester/?step=confirmation&problem=battery>

These pages implement the approved blue/teal 3D comparison design. They share the
existing map instance and a five-stage RTL timeline. The accepted screen marks only
acceptance as current. Confirmation marks the first three stages complete and
leaves the final stage pending until the success button is selected.

The collapsed local-preview controls switch explicitly between waiting, acceptance
and confirmation; no timer or refresh fabricates a helper response. Refresh reports
the same simulated state. Chat opens an explanatory local dialog and sends no
messages. The helper uses clearly labeled sample data and a generic avatar; no real
person's portrait or account details are included in these assets.

Success updates the local timeline to completed and hides the question illustration;
incomplete keeps the timeline at confirmation. Both decisions have a reset control
for trying the other outcome. Outcomes are held in memory per problem type and are
cleared on reload. Draft notes/photos and the chosen map point survive route changes.

`assets/accepted.png` and `assets/confirmation.png` were generated with the built-in
image tool from the approved comparison. Each was supplied to Grok's Loop template
as matching first/last frames, at 3:2, 720p and six seconds. `accepted.mp4` animates
the handshake medallion; `confirmation.mp4` animates the question bubble, car lights
and radar base. Both are 1168×784 and 6.041667 seconds, served locally, muted and
looped. Exact prompts and file metadata are in [prompts/statuses.json](prompts/statuses.json).
Motion stops for hidden pages/steps, offscreen media, open dialogs and reduced-motion
preferences. Posters remain visible if playback is unavailable.

Map styles, tiles, fonts and sprites need an internet connection to
`https://tiles.openfreemap.org`. They are the only external data requests allowed
by the requester's CSP. No note, photo, account data or device location is sent.
Loading failure has a retry control and preserves the rest of the form. The home
preview keeps its original `connect-src 'none'` policy. The requester allows local
module/worker loading and WebAssembly compilation required by MapLibre.

Implementation references: [MapLibre Map API](https://maplibre.org/maplibre-gl-js/docs/API/classes/Map/)
and [OpenFreeMap quick start](https://openfreemap.org/quick_start/).

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

`assets/approved-location.png` is the approved location mockup from the built-in
image generation tool. The location header reuses `assets/details-header.png`.
`assets/location-safety.png` is an unchanged copy of the application's existing
`assets/images/service-location-ar.png`, preserving the user's safety banner.
The map itself is a live map, not generated artwork. The teal marker is CSS.

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

The location step was also checked at 320, 390 and 480px: map rendered, controls
fit and no horizontal overflow or footer overlap in the default view. Verified
manual selection/confirmation, cancel, recenter, reset, keyboard panning, reduced
motion, invalid route fallback, and full selection → note/photo → location flow.
Browser Back/Forward retained the draft. The submit dialog issued no network
requests. Blocking the map provider produced the retry state with disabled submit;
unblocking and Retry recovered successfully. The final clean run had no browser
errors. The worker returned JavaScript with HTTP 200, disallowed vendor files
returned 404, and the copied safety image matched the original SHA-256 exactly.
Final local screenshot: `test-results/requester-motion/location-390.jpg` (ignored).

Waiting preview: verified the selection → note → manual location → waiting flow,
one retained map instance, Back/Forward, local refresh, both cancel choices, keyboard
and pointer activation, and pause/resume. Reduced motion loaded no video sources;
blocking the waiting MP4 preserved the poster. At 320, 390 and 480px there was no
horizontal overflow and the default content cleared the footer. Compared video
frames at 0.05, 2.8 and 5.95 seconds: independent pin/lens motion and matching loop
endpoints. Sending the preview made no assistance API request. Scoped ESLint,
JavaScript syntax and diff checks passed. Final screenshot:
`test-results/requester-motion/waiting-390.jpg` (ignored).

Accepted/confirmation previews: checked both states at 320, 390 and 480px, with
no horizontal overflow and the confirmation/chat controls above the sticky footer.
Verified both confirmation outcomes and reset, acceptance/confirmation Back/Forward,
chat dialog pausing, refresh without status advancement, and the full note → manual
location → waiting → accepted → confirmation flow with one retained map and draft.
Refresh, chat and confirmation generated no assistance or messaging requests.
Reduced motion fetched no video sources; a blocked confirmation clip kept its PNG.
Both six-second clips were inspected at 0.05, 2.8 and 5.95 seconds for independent
object motion and matching endpoints. MP4 range requests returned 206/video/mp4.
JavaScript syntax, scoped ESLint and diff checks passed. Screenshots are saved under
`test-results/requester-motion/accepted-390.jpg` and `confirmation-390.jpg` (ignored).
