# Original illustrated help counter — local review

The owner asked for invented moving imagery for the completed-help counter after rejecting earlier designs. This concept pairs an original blue/teal compact car illustration with the total number of completed assists. It has no levels, medals, stars, targets or progress bars.

Preview: http://localhost:4190/level-card-preview. The initial **44** is explicitly labelled example data. The original Activity integration and its real count source are unchanged in this task. Both earlier lightweight concepts remain behind a comparison control. Nothing was deployed or released.

## Artwork and saved files

Generated with the built-in `image_gen` tool, not the fallback CLI. The first image was rendered inline for review; a second edit isolated the car with alpha transparency. The selected files were copied into this workspace without replacing existing artwork.

- [Complete still concept](../previews/help-counter/assets/akhoo-car-card-v1.png) — `previews/help-counter/assets/akhoo-car-card-v1.png`, 1536 × 1024 PNG.
- [Transparent car layer](../previews/help-counter/assets/akhoo-helper-car-v1.png) — `previews/help-counter/assets/akhoo-helper-car-v1.png`, 1536 × 1024 RGBA PNG.

The local component uses only the transparent car layer. All card text and numbers are live React Native text, rather than baked into the image. The first image is a static design reference; it is not a video.

## Motion and verification

`IllustratedHelpCounter.tsx` gently translates, bobs and tilts the image over a 4.8-second cycle. The count briefly scales on changes/replay. Motion stops when disabled, when reduced motion is requested, or when AppState becomes inactive. This is animated 2D artwork with a 3D appearance, not a real-time 3D model, rotating wheels or a generated video.

Verified:

- TypeScript and targeted ESLint for the two changed TSX components passed.
- Isolated headless Chrome, with all non-local requests blocked: 320, 390 and 480 px widths, compact card bounds and no horizontal overflow, loaded artwork, 44 → 45, zero and 1000, ar/en/he labels, dark mode.
- Actual transforms changed while motion was on, remained stable after toggling off, and remained stable with the browser's reduced-motion preference.
- Screenshots visually inspected at 320, 390 dark, and 480 px. Fixed the image's inherited intrinsic height so the card stays compact.
- The route is guarded by `__DEV__` and web platform. Review-branch Vercel deployment remains disabled; no main merge, store build, OTA, backend or data changes.

Not verified: physical iOS/Android rendering, battery usage, native AppState transitions or authenticated production data. This is a local design fixture pending owner selection, not a release candidate.

## Final prompt set

### 1. Still concept

```text
Use case: ui-mockup / stylized-concept. Create ONE beautiful original concept image for the AKHOO Arabic roadside-help app, showing a small mobile 'completed assists' card with our own newly invented 3D helper-car character. This is a still concept for a future gentle animation, not a video and not an entire app screen. Landscape canvas, about 3:2. A single polished wide rounded card floating very subtly against an extremely pale icy-blue background, generous margins. Inside the card, left half: a distinctive small rounded cobalt-blue compact car, teal roof and mirror accents, satin premium 3D material, soft white trim, black rubber tires, three-quarter front angle facing right. Its personality is friendly through its gently curved front and warm small headlights, but NO human face, NO windshield eyes, no arms, no recognizable existing cartoon character, no car-manufacturer logo. The car is the hero artwork, lively and beautifully designed, simple enough to stay clear at 140px size. Suggest that it has just rolled forward with a very subtle short soft ground shadow; no speed streaks or sparks. On the right half of the card, impeccably typeset spacious RTL Arabic UI, exact text at top 'فزعاتك بتفرق', then a large beautiful dark-blue '44', then exact text 'مساعدة مكتملة'. Keep Arabic dots and glyphs perfectly legible and separated, not crowded; text is a restrained minor part. Pale white-to-ice-blue card surface, refined cobalt #1768E5 and teal #147D62 color accents. The count must read as a simple total, with NO levels, NO medals, NO stars, NO progress rings, NO progress bars, NO targets, NO reward meter, NO buttons. High-end playful 3D app illustration combined with calm professional mobile typography. Soft daylight, understated shadows, no neon, no dramatic effects, no extra props, no buildings, no scenery, no trees, no glitter, no excessive decorations, no phone bezel, no watermark. Make the car original and appealing, not a generic emoji or a flat icon.
```

### 2. Transparent car extraction

Input reference: the complete still concept above. `transparent_background: true`.

```text
Precise extraction/edit. Isolate ONLY the exact original blue and teal 3D compact car from the provided concept image onto a genuinely transparent background. Preserve the exact car design, proportions, three-quarter front view facing right, blue body, teal roof and mirrors, white trim, headlights, tires and premium 3D rendering. Remove all Arabic text, the number 44, the UI card, the blue background, and all surroundings completely. The car must remain unchanged. Full car including every wheel and mirror in frame, tight but not cropped composition with about 5 percent transparent margin. No new objects, no text, no labels, no glow effects. A very soft small contact shadow directly under the tires is okay; the rest must have real alpha transparency. This will be used as a separate moving character layer inside a native app card.
```
