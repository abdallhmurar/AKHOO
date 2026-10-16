# Requester problem selection — local motion preview

Run `node previews/home-motion/serve.cjs` from the repository root and open
<http://127.0.0.1:4178/requester/>. The local home page's “بدي مساعدة” button
also opens this screen. The default port remains 4178.

This is an isolated, Arabic, responsive visual prototype of the first requester
step. It does not import the Expo application, make API requests, send assistance
requests, read account data, or change Vercel, Android or iOS. The Next button
requires one of the four native radio inputs and opens a local explanatory sheet.
Actual request creation and the next two screens remain in the existing app.

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

Videos loop silently while visible. Selection replays the selected clip. Playback
pauses when the page is hidden, the preview sheet is open or the user pauses it.
Reduced-motion preference starts with posters and does not fetch video files.
Failed or blocked playback keeps the original image. No connection to Grok is
needed to view the completed preview.

The preview reuses the adjacent home preview's Noto Sans Arabic fonts and license.
It intentionally remains on the preview branch and is not a production release.
