# Helper flow — local motion preview

Run `node previews/home-motion/serve.cjs` from the repository root and open
<http://127.0.0.1:4178/helper/>. The home preview's **بدي أساعد** button opens
this screen; its back button returns home. `/helper` redirects to `/helper/`.

This isolated Arabic visual prototype covers a nearby battery request, its detail
sheet, and the helper's mission after acceptance. It reuses the established blue,
teal and 3D visual style, with compact map/cards, safe-area header spacing, short
contact labels and one next-stage action. The previous empty state remains available.

- Nearby request (default): <http://127.0.0.1:4178/helper/?view=nearby>
- Detail sheet: <http://127.0.0.1:4178/helper/?view=details>
- Accepted mission: <http://127.0.0.1:4178/helper/?view=mission>
- No requests: <http://127.0.0.1:4178/helper/?view=empty>

The nearby card and map chip open the same native modal dialog. Escape, Close and
browser Back close it; Forward restores it. Its Accept action opens the mission.
The five-stage RTL timeline progresses explicitly through accepted, on the way,
arrived and awaiting confirmation. Completion requires the separate, clearly labeled
local-preview control; no timer fabricates the requester's response. Progress lives
only in memory across same-document navigation and clears on reload or Reset.
Returning to a request already accepted offers Continue instead of accepting again.
Unknown view values fall back to the nearby page.

Call, Chat, Navigation and request details open explanatory local dialogs. They do
not call, message, launch external navigation or transmit a location. A generic avatar
and sample request ID replace the private portrait, phone number and identifier in
the user's screenshots. The displayed distance/time/status are sample data.
The collapsed local-preview controls allow resetting or viewing the empty state.

The map uses the existing installed MapLibre distribution, served through the local
server's explicit vendor allowlist, and OpenFreeMap's Liberty style. One retained map
instance supports pan, zoom, keyboard/pinch, recenter and loading/failure/retry.
It starts at an illustrative Jerusalem point and keeps attribution visible.
Only `tiles.openfreemap.org` is an allowed external data destination. No GPS, account,
availability, request, backend or messaging API is used. The application, native
platforms, Vercel configuration and dependencies are unchanged.

The existing local fonts and city header are reused. Nearby/detail scenes reuse
`../requester/assets/battery.png` and `battery.mp4`; mission tracking reuses
`accepted.png` and `accepted.mp4`. Their original image/Grok video prompts and
metadata remain in the requester's production/statuses prompt records.
These are real six-second rendered 3D character/object videos, not CSS movement
of still images, literal GIFs or live 3D models. No new generation was required.

The empty state's `assets/helper.png` and `helper.mp4` remain unchanged.
Its approved reference is `assets/approved.png`; exact image/video prompts are in
[prompts/production.json](prompts/production.json). The clip is 1168×784, 6.04 seconds
and 1,153,074 bytes.

Video loads only while visible, with pause controls in both header and detail sheet.
Background-page motion stops under a modal; informational dialogs pause all clips.
Hidden pages/sections and reduced-motion preferences prevent playback, and reduced
motion prevents initial video fetches. PNG posters remain when playback fails.

## Verification

Verified nearby → details → accept → on the way → arrived → confirmation → explicit
demo completion → nearby, including Escape/focus restoration and Back/Forward.
One map instance remains across routes. Call/chat/navigation stay local and pause
motion. Captured action requests were GETs for local assets and map resources,
with no account, request or messaging API calls.

Checked nearby, detail sheet and mission at 320, 390 and 480px: no horizontal
overflow; the modal fits the viewport and mission controls clear the content.
Reduced motion loaded no video sources on mission/details; blocking the battery MP4
retained the loaded PNG. The blocked URL/cache/media overrides were then cleared.
The original map loading/error/retry, zoom, pan and recenter were verified when
the helper preview was introduced. Syntax, scoped ESLint and diff checks passed.
QA screenshots are saved under ignored `test-results/helper-flow/`.
