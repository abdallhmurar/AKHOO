# AKHOO home motion preview

Standalone local visual prototype of the approved home design. Run from the repository root:

```sh
node previews/home-motion/serve.cjs
```

Open http://127.0.0.1:4178. An optional `AKHOO_PREVIEW_PORT` environment variable changes the port.

The compact header uses the approved 3D road, blue car and city illustration with no visible headline, road caption or logo. Its notification button remains live HTML. The original card artwork is shifted upward by 10% of the screen width, keeping card sizes and text alignment intact. Headings, navigation and buttons remain live HTML. The two main cards contain real six-second 3D character videos generated in Grok from the included reference frames and motion prompts. The request-help character lowers his hand, leans toward the car and returns to his starting pose. The helpers move the jumper clamps, lean toward the battery and exchange a glance. These are locally served looping MP4s, not GIF files. The earlier SVG steam, light and cable effects have been removed.

Videos play silently with inline playback, loop automatically and can be paused. Reduced-motion preferences disable playback, and motion pauses while the page is hidden, the approved reference is displayed or a demo sheet is open. Posters remain visible before playback or if playback is blocked. The comparison button displays the approved static design. The media stays behind the real HTML text and buttons; a soft blue gradient keeps the white hero text readable throughout the animation.

Both clips are 1168×784, 6.04 seconds and about 4.1 MB combined. The local server supports byte-range requests for video playback and seeking. No Grok connection is needed to view them.

All actions open local explanatory sheets. The preview makes no API requests and never creates help requests or reads account data. It imports no application code and does not change the Expo app, Android, iOS or Vercel configuration. The responsive canvas now has a 100:190 aspect ratio after shortening the header; this is a review prototype, not the final translated production layout.

`assets/road-header.png` is the 2172×724 standalone landscape generated with the built-in image tool from the approved header mockup. Its exact generation prompt is recorded in [prompts/road-header.txt](prompts/road-header.txt). `assets/approved-road-header.png` is the latest approved full-screen comparison, displayed without stretching when the reference button is pressed. The header background is decorative; a visually hidden page heading preserves the accessible page outline.

`assets/home-art.png` was created with the built-in image tool by removing text and controls from the approved mockup while retaining its artwork and layout. The source prompt requested a text-free illustration plate, preserving all people, cars, roads, card backgrounds, gift art and positions. `assets/approved-home.png` is the user-approved reference. `assets/brand.png` is copied from the existing project logo. Noto Sans Arabic fonts are included under the adjacent font license.
