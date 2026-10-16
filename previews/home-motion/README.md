# AKHOO home motion preview

Standalone local visual prototype of the approved home design. Run from the repository root:

```sh
node previews/home-motion/serve.cjs
```

Open http://127.0.0.1:4178. An optional `AKHOO_PREVIEW_PORT` environment variable changes the port.

The request-help button now opens the [local problem-selection preview](requester/README.md)
at http://127.0.0.1:4178/requester/, with four separate 3D character video cards.

The offer-help button opens the [local helper preview](helper/README.md) at
http://127.0.0.1:4178/helper/, with an interactive map, animated battery request,
detail sheet and mission tracking. The previous empty state is available at
http://127.0.0.1:4178/helper/?view=empty.
The helper's completed-help reward/rating page is available at
http://127.0.0.1:4178/helper/?view=success and follows explicit demo confirmation.

The Activity navigation item opens the [local activity preview](activity/README.md)
at http://127.0.0.1:4178/activity/, with filterable sample history, date ranges,
level progress and detail dialogs.

The Account navigation item opens the [local account preview](account/README.md)
at `/account/`, with grouped settings, light/dark themes and a local profile
editor. The current review server is on port **4179**:
http://127.0.0.1:4179/account/ (the previous 4178 process remains running).

The Perks buttons now open the [local 3D perks preview](assets/perks/README.md)
at http://127.0.0.1:4179/assets/perks/index.html, with the approved static 3D gift
header, interactive silver medal, points progress and sticker offer layout. This path
uses the running server's existing asset allowlist, so no server restart or
additional port is needed. Home, Activity and Account link to the same page.

The compact header uses the approved 3D road, blue car and city illustration with no visible headline, road caption or logo. Its notification button remains live HTML. The landscape keeps its natural 3:1 proportions and fades into the page behind the first card's rounded corners. The original card artwork is shifted upward by 12% of the screen width, keeping card sizes and text alignment intact; the opaque lower art plate starts after the first video so it cannot cut across the landscape. Headings, navigation and buttons remain live HTML. The two main cards contain real six-second 3D character videos generated in Grok from the included reference frames and motion prompts. The request-help character lowers his hand, leans toward the car and returns to his starting pose. The helpers move the jumper clamps, lean toward the battery and exchange a glance. These are locally served looping MP4s, not GIF files. The earlier SVG steam, light and cable effects have been removed.

Videos play silently with inline playback, loop automatically and can be paused. Reduced-motion preferences disable playback, and motion pauses while the page is hidden, the approved reference is displayed or a demo sheet is open. Posters remain visible before playback or if playback is blocked. The comparison button displays the approved static design. The media stays behind the real HTML text and buttons; a soft blue gradient keeps the white hero text readable throughout the animation.

Both clips are 1168×784, 6.04 seconds and about 4.1 MB combined. The local server supports byte-range requests for video playback and seeking. No Grok connection is needed to view them.

The two help actions, Activity, Account and Perks navigate to their local previews; notifications open an explanatory sheet. The home preview makes no API requests and never creates help requests or reads account data. It imports no application code and does not change the Expo app, Android, iOS or Vercel configuration. The responsive canvas now has a 100:188 aspect ratio after shortening the header; this is a review prototype, not the final translated production layout.

`assets/road-header.png` is the 2172×724 standalone landscape generated with the built-in image tool from the approved header mockup. Its exact generation prompt is recorded in [prompts/road-header.txt](prompts/road-header.txt). `assets/approved-road-header.png` is the latest approved full-screen comparison, displayed without stretching when the reference button is pressed. The header background is decorative; a visually hidden page heading preserves the accessible page outline.

`assets/home-art.png` was created with the built-in image tool by removing text and controls from the approved mockup while retaining its artwork and layout. The source prompt requested a text-free illustration plate, preserving all people, cars, roads, card backgrounds, gift art and positions. `assets/approved-home.png` is the user-approved reference. `assets/brand.png` is copied from the existing project logo. Noto Sans Arabic fonts are included under the adjacent font license.
