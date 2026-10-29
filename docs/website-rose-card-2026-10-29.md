# Website hero uses the approved rose help card

The owner identified the old battery scene in the website hero and supplied the current app's rose “Need help?” card as the replacement. The hero now shows that compact card: the same approved white-car video and poster from `assets/help-rose`, the matching gradient, localized title/subtitle and full-width white action.

The whole card is one accessible button. It starts the existing website request demonstration, marked as a demo below the card; it does not create a real request. Service selection still exists in that walkthrough. The obsolete four-scene hero picker and its scene-switch animation are removed. The card stays still while its illustration animates; optional editorial tilt handles its absence safely.

The poster is used before playback, on video failure and for reduced motion. Video is muted, inline, loops and pauses offscreen or when the page is hidden. Its original approved bytes are reused, without generating or altering imagery. Labels remain HTML text, not embedded in artwork.

Validation:

- Static build, JavaScript syntax and diff checks pass.
- Isolated Chrome checks pass in Arabic, English and Hebrew at widths 320, 390, 768 and 1440: no horizontal overflow, no text/action overlap, 196 px card height, maximum 480 px width, 44 px action minimum.
- Pointer and keyboard actions focus the request walkthrough in “need” mode. No page errors.
- The 1344 × 672, 5.54-second video plays; reduced-motion and offscreen pause, failed-video poster fallback and keyboard activation pass.
- Mobile and desktop screenshots visually checked against the supplied reference. Physical phones and Safari have not been tested.
- Vercel dry run contains 61 static files, including the two reused rose assets, and excludes credentials, environment files and dependencies.

Scope: marketing website only. Existing app/native assets were read and reused, not edited. Feature-branch deployment suppression in root/admin Vercel configs is the small Claude-area edit. Current coordination notes were merged from main without discarding the previous website updates.

Publication details will be recorded after deployment verification.
