# AKHOO home motion preview

Standalone local visual prototype of the approved home design. Run from the repository root:

```sh
node previews/home-motion/serve.cjs
```

Open http://127.0.0.1:4178. An optional `AKHOO_PREVIEW_PORT` environment variable changes the port.

The approved illustration is retained in a text-free art plate; headings, navigation and buttons are live HTML. CSS/SVG add flowing steam, gentle headlights, a moving cable highlight, reward sparkles and press feedback. These are browser animations, not an animated GIF or newly generated character video. The people themselves are not animated. Motion can be paused, respects reduced-motion preferences and pauses when the page is hidden. The comparison button displays the approved static image.

All actions open local explanatory sheets. The preview makes no API requests and never creates help requests or reads account data. It imports no application code and does not change the Expo app, Android, iOS or Vercel configuration. The pixel positions preserve the approved composition at a responsive 887:1774 aspect ratio; this is a review prototype, not the final translated production layout.

`assets/home-art.png` was created with the built-in image tool by removing text and controls from the approved mockup while retaining its artwork and layout. The source prompt requested a text-free illustration plate, preserving all people, cars, roads, card backgrounds, gift art and positions. `assets/approved-home.png` is the user-approved reference. `assets/brand.png` is copied from the existing project logo. Noto Sans Arabic fonts are included under the adjacent font license.
