# Logo counter concept — 9 November 2026

The owner requested the logo rising from below, turning 360 degrees, then exiting upward, with a better heading. The local preview now implements that sequence with the new heading **كل فزعة إلها أثر**. The example completed-help count remains 44, clearly labelled as sample data.

- [Saved image](../previews/help-counter/assets/akhoo-logo-counter-v1.png): `previews/help-counter/assets/akhoo-logo-counter-v1.png`.
- Reference: `assets/images/icon.png`, inspected before generation.
- Method: built-in `image_gen`; no fallback CLI.
- Visually checked the logo silhouette, handshake/road, lettering, Arabic labels and absence of levels/stars.
- [Transparent dimensional logo layer](../previews/help-counter/assets/akhoo-logo-dimensional-v1.png): `previews/help-counter/assets/akhoo-logo-dimensional-v1.png`, extracted from the still with the built-in image tool. Original official logo assets are unchanged.
- Live local preview: http://localhost:4190/level-card-preview. The previous still retains its original heading as a design-history artifact; current copy is rendered as native text in the preview, separate from the image.
- `LogoHelpCounter.tsx` is imported only by the guarded dev-web preview. Real Activity, backend, store versions and deployments are unchanged. Branch deployment remains disabled.

## Motion and checks

One 5.55-second loop: 250 ms pause, 850 ms rise, 400 ms hold, 1.8 s full Y-axis turn, 600 ms hold, 950 ms upward exit, 700 ms pause. The counter and heading remain stationary. The replay control restarts this sequence. Both faces use the same logo with hidden backs, keeping the wordmark readable during the turn. This is a transformed image with a dimensional appearance; there is no WebGL renderer or 3D mesh.

Disabling motion or enabling reduced motion displays the logo centered and fully visible. AppState inactivity also stops the sequence. Effects clean up their animations and subscriptions. Count changes produce a small independent pulse, with no database writes.

Validation: TypeScript and targeted ESLint passed. Isolated headless Chrome (external requests blocked) sampled actual styles throughout a complete loop and verified: positive Y before turning, a centered turn, reaching 360 degrees, then negative Y. It also verified replay, motion-off stability, reduced-motion stability, 44 → 45, zero/1000, image loading, ar/en/he and compact bounds at 320/390/480 px. No page errors. Light/dark screenshots were visually inspected; the dark gradient was lightened behind the logo to preserve readability. Physical iOS/Android performance, native AppState behavior and authenticated real-data rendering are not verified by this local fixture.

## Extraction prompt

Reference: `previews/help-counter/assets/akhoo-logo-counter-v1.png`. Built-in image generation/editing, `transparent_background: true`.

```text
Precise background extraction edit. Extract ONLY the dimensional AKHOO logo on the LEFT of this reference image, including its two navy/turquoise people, handshake, heart-shaped opening, winding road, original Arabic wordmark and small AKHOO letters below. Preserve that exact logo's proportions, colors, letterforms, satin bevels and front-facing view. REMOVE the entire card, background, all text on the right and number 44. The output must be the standalone complete logo on genuine transparent alpha, with transparency through the heart/road openings and between all letters. No white rectangle, cyan wash, ground plane, surrounding glow or drop shadow. Keep only the object's own shading and raised edges. Tight centered square composition with 6 percent clear transparent margin around the complete logo. Do not redesign anything, no new text or objects.
```

## Final prompt

```text
Use case: ui-mockup / compositing. Make one refined high-end mobile UI concept image for AKHOO's completed-help counter, using the attached OFFICIAL AKHOO LOGO as the hero instead of any car illustration. Reference image 1 is the exact official brand mark. Preserve the logo's recognizable silhouette and geometry: navy left person and turquoise right person, their joined hands, the heart-shaped opening and winding road inside, and original Arabic wordmark and AKHOO lettering. Give this exact logo subtle dimensional depth with softly extruded satin edges, keeping a clear front view and accurate navy/turquoise colors. Do not redesign the logo, turn it into a character, invent arms or extra fingers, alter its lettering, or replace the heart/road. The logo should look like a beautifully crafted softly raised brand emblem, NOT a medal, award or coin. Create a single wide compact rounded mobile card on an extremely pale ice-blue canvas. Card fills most of the canvas with balanced margins, approximate card proportions 2.3:1. Left 42%: the elegant official logo, comfortably sized and crisply legible, sitting directly in the card with a gentle realistic contact shadow; no pedestal or badge. Right 58%: spacious Arabic right-to-left typesetting: exact heading 'فزعاتك بتفرق', then large bold navy number '44', then exact smaller label 'مساعدة مكتملة'. Keep the Arabic letters and dots clean, properly spaced, and readable on a phone. White-to-very-pale-cyan surface, restrained deep navy and turquoise only, soft daylight, outstanding visual hierarchy, modern premium friendly brand feeling. The number is the primary metric; the official logo is the memorable visual. Add a subtle pale turquoise soft background wash behind the emblem, not a ring or progress indicator. No car, no trees, no cartoon face, no stars, no medals, no levels, no targets, no progress bars, no rewards, no buttons, no sparkles, no gold, no neon, no excessive lighting or decorative objects, no phone frame, no watermark. This is a STILL visual proposal for an eventual gently animated brand element; don't draw arrows or motion annotations. Render one single finished concept, not multiple options.
```
