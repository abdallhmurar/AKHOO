# Approved M card materials

Source reference: `previews/live-rewards/concepts/2026-10-28-m-helper-card.png`, approved by the owner with a request to reproduce it exactly in the local preview.

Generated with built-in OpenAI ImageGen on 2026-10-28. `gold.png` extracts the reference's front-facing blue/teal brushed-metal face, embossed curves, gold corner and rim, with every text/avatar/UI element removed. `bronze.png`, `silver.png` and `green.png` are material-color variants of that blank face. Exact prompts: `gold-prompt.txt`, `bronze-prompt.txt`, `silver-prompt.txt`, `green-prompt.txt`.

All four images were visually inspected and retain transparent alpha outside their rounded silhouette. These files contain **material only**. Names, profile photo, brand label, earned rank, assist count, point balance, next-rank copy and progress are React Native/DOM content. They remain localized, accessible and data-driven. The slight reference perspective is reproduced with live transforms rather than baked text.

`LivePointsCard` uses the current account name/avatar and existing point/count queries through its parent. New members use the neutral steel material with the existing unranked label. Rank requirements stay 5/15/30/60; the material samples do not claim that future ranks have been earned.

These are raster material textures on an interactive card, not a rigged 3D model. The reference composition, material, palette and hierarchy are reproduced; exact generated pixels and native typography differ. Source-resolution PNGs total about11MB, retained for local visual review. Physical iPhone performance, Dynamic Type, VoiceOver and Safari still need device checks before release.
