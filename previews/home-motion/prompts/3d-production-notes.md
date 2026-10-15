# 3D character motion production

The user rejected the CSS/SVG-only preview and selected Grok for actual 3D character animation. The existing local preview has not yet been replaced with videos.

Prepared image-to-video inputs:

- `../assets/help-3d-poster.png`: blue request-help scene, coral hoodie character, clear space for the real heading and button.
- `../assets/helper-3d-poster.png`: two 3D helpers with jumper cables and a green car.
- `help-3d-image-to-video.txt` and `helper-3d-image-to-video.txt`: the matching motion prompts.

Both frames were generated using the built-in image tool. The first prompt requested a premium 3D first frame based on the approved blue help card, preserving the blue/orange identity with a man beside an open-hood blue car, all artwork within the left 61%, empty right and bottom space, and no UI or lettering. The second requested the approved green-car helper scene in matching 3D style: a green-hoodie man and a white-hoodie man visibly holding jumper leads, fixed camera, pale mint background, no UI or lettering.

Grok's UI was inspected while signed in. Video settings were selected as 3:2, 1080p and six seconds. The first text-to-video prompt (`help-3d-video.txt`) was submitted once, but its generation was not confirmed: the composer cleared, no result appeared, and the newest visible library item was eight hours old. Do not blindly submit that same request again; reconcile first. No generated video has been downloaded or verified yet.

Image upload was blocked by the ChatGPT browser extension's missing file URL permission. The user authorized enabling it, but browser security rejected navigation to `chrome://extensions`; the user must enable the setting manually. Do not circumvent that browser policy.

Before integration, verify actual arm/torso motion in the resulting videos, stable camera and coherent character geometry. Keep the real HTML buttons and text above the media. Deliver only in this isolated local preview branch; production, native Android and iOS remain out of scope.
