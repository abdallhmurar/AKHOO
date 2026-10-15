# 3D character motion production

The user selected Grok for actual 3D character animation. Both resulting clips are now integrated into the isolated local preview, replacing the earlier CSS/SVG scene effects.

Prepared image-to-video inputs:

- `../assets/help-3d-poster.png`: blue request-help scene, coral hoodie character, clear space for the real heading and button.
- `../assets/helper-3d-poster.png`: two 3D helpers with jumper cables and a green car.
- `help-3d-image-to-video.txt` and `helper-3d-image-to-video.txt`: the matching motion prompts.

Both frames were generated using the built-in image tool. The first prompt requested a premium 3D first frame based on the approved blue help card, preserving the blue/orange identity with a man beside an open-hood blue car, all artwork within the left 61%, empty right and bottom space, and no UI or lettering. The second requested the approved green-car helper scene in matching 3D style: a green-hoodie man and a white-hoodie man visibly holding jumper leads, fixed camera, pale mint background, no UI or lettering.

Each image-to-video prompt was submitted once with the matching poster as both the first and final frame, six seconds, 3:2, 720p selected in Grok and video sound disabled. Both completed outputs were downloaded through Grok's normal download control and copied into `../assets/help-3d.mp4` and `../assets/helper-3d.mp4`. The downloaded files report 1168×784 and a duration of 6.041667 seconds. Local HTML playback is muted regardless of whether the source container includes audio.

Visual review of decoded frames at 0.2, 2.5, 4.3 and 5.8 seconds verified actual arm, head and torso movement, coherent character appearance and stationary cameras. The hero bends toward the engine and returns; the helpers seat their clamps and turn to each other. The matching endpoints support repeated playback. As generated animation, the clips remain subject to the user's final visual review.

Earlier text-only experimentation in `help-3d-video.txt` is retained as a draft, not as the source of either delivered clip. An initial upload permission issue was resolved by the user enabling the browser extension's file access. No browser security setting was changed by the agent.

The real HTML buttons and text remain above the media. The preview respects reduced motion, pauses in the background and serves all media from localhost. Delivery is limited to this preview branch; production, native Android and iOS remain out of scope.
