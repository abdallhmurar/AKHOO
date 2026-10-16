# Helper empty-state preview

Run `node previews/home-motion/serve.cjs` from the repository root, then open
<http://127.0.0.1:4178/helper/>. The home preview's **بدي أساعد** button now opens
this screen; its back button returns to the home preview. `/helper` redirects to
`/helper/` so relative assets resolve correctly.

This is a local visual prototype of the helper's available / no-nearby-requests
state, matching `assets/approved.png`. It has a live pan/zoom map and animated 3D
volunteer illustration. Status and requests are sample UI: it does not read GPS,
change account availability, poll for real requests, or import the application.
The collapsed local-preview note makes this scope explicit. No Vercel, Android,
iOS, backend, authentication or dependency configuration is changed.

The map uses the existing installed MapLibre distribution, served through the local
server's explicit vendor allowlist, and OpenFreeMap's Liberty style. It begins at
an illustrative Jerusalem point, with one teal pin, zoom buttons, keyboard/pinch
controls and recenter. It has a loading/failure/retry state. Map attribution remains
visible. Only `tiles.openfreemap.org` is allowed as an external data destination by
the helper CSP; no personal data or exact device location is sent.

The original local Noto Sans Arabic fonts and license are reused, along with the
requester preview's city header image. The character keyframe `assets/helper.png`
was created using built-in image generation from the approved mockup. Grok Imagine
uses the same image as first and last frames for a six-second, 720p, 3:2 silent loop.
The character moves his head, face and hand naturally while the car stays parked.
This is a rendered 3D MP4, not a live 3D model or a literal GIF. Exact prompts and
file metadata are recorded in [prompts/production.json](prompts/production.json).

Motion is lazy-loaded and pauses offscreen, in hidden tabs and through the pause
control. Reduced-motion preferences prevent video loading. The PNG stays visible
if playback fails. No connection to Grok is needed to view the finished page.

The finished clip is 1168×784, 6.04 seconds and 1,153,074 bytes. Its opening,
middle and closing frames were inspected for coherent character motion.

Verified in Chrome at 320, 390 and 480 px widths without horizontal overflow:
home/back navigation, map loading, zoom, keyboard pan and recenter, playback and
pause, reduced-motion suppression, poster fallback, and map failure/retry after
blocking and restoring the tile provider. A captured page load issued only GETs
to the local server and map provider. Syntax checks, scoped ESLint, HTTP routes,
MP4 byte-range serving and `git diff --check` passed.
