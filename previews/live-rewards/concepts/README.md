# Rewards card visual review — 2026-10-27

Two review mock-ups, generated with the built-in ImageGen tool. Neither image is imported by the application or used as a flattened replacement for live text/data.

- A: `2026-10-27-a-navy.png` — uninterrupted navy/teal card, warm gold medal, integrated dark progress section.
- B: `2026-10-27-b-pearl.png` — pearl/mint card, teal recessed medal area, warm gold medal.

The owner rejected the medal direction (both A and B) on 2026-10-27. Keep those images as history, not approved designs. The interrupted medal-layout draft is archived in ignored `credentials/live-rewards-preview/rejected-medal-layout-20261027.patch`; the last committed prototype remains available. No store upload, OTA, deployment or backend change.

## Direction C — approved for local 3D implementation

`2026-10-27-c-impact-tree.png`: “أثر مساعدتك”, with help count as the main number, a symbolic growing tree and a separate compact points balance. Owner approved local implementation on 2026-10-27. `LivePointsCard` now uses a true procedural WebGL tree: instanced veined leaves, three crowns, curved ridged trunk/roots, grass, rocks and a young shoot. The tree represents personal/community impact; it does not claim that any real trees have been planted. Existing reward thresholds and data meanings are unchanged. Sample count is 42 confirmed assists, not 42 distinct people.

Concepts use sample values: 320 points, 42 of 60 helps. Text/progress remain live, localized and accessible. The earlier A/B gold progress marker is not part of C. The implementation reproduces the composition and major botanical details using real geometry; it is not a pixel-identical recreation of the generated artwork.

Run `npm run preview:rewards` and open `http://127.0.0.1:4186/` on this computer. The controls outside the card simulate growth from 0 to 60, sample levels, and ar/en/he. They never award points or write data. In-app count and spendable balance still come from existing queries. The standalone preview cannot validate real-account refresh. iOS uses the offline WebView scene, web loads the renderer lazily, Android keeps its old panel. No deployment or store upload. Physical iPhone graphics/performance still need review.

## Direction D — rejected, not implemented

The owner rejected D on 2026-10-27 and requested a stronger alternative. Retained as review history only.

`2026-10-27-d-help-journey.png`: “مشوارك مع أخوو”, a miniature roadside help scene with a short road ribbon and a completion marker. Uses the same sample 42 assists, 320 points and 18 assists remaining; the count does not represent distinct people. Generated with built-in ImageGen and visually reviewed. Prompt: `2026-10-27-d-prompt.txt`.

Proposed interaction, pending owner selection: a marker advances only when the confirmed-assist count increases, with a brief arrival/check gesture at milestones; subtle character motion and touch parallax, static under reduced motion. No play/pause UI or fake always-increasing points. The generated text is a visual reference only; any later implementation must retain real localized/native text and data.

On the owner's request to explore another idea, detailed tree-motion refinements were paused as an uncommitted local draft. Concept D is not imported by the app. No application change, store upload, deployment or backend write.

## Direction E — solidarity sculpture, rejected

The owner rejected E on 2026-10-27 and requested another stronger idea. Retained as review history only.

`2026-10-27-e-solidarity.png`: “بصمتك بأخوو”, a blue/teal handshake sculpture and a tilted progress track, replacing the roadside scene. Built-in ImageGen; exact prompt in `2026-10-27-e-prompt.txt`. Sample numbers remain 42 assists, 320 points and 18 assists to the next level. Visually reviewed; image-only, not imported or implemented.

Proposed motion: restrained touch tilt; the track gains progress when a confirmed assist is added, with a short handshake response at a milestone. A static presentation for reduced motion. Artwork ticks are illustrative; a later implementation must calculate progress and render localized text using live data. No release or deployment.

## Direction F — automotive assist gauge, rejected

The owner rejected F on 2026-10-27 and asked to take inspiration from established products before another design attempt.

`2026-10-27-f-assist-gauge.png`: “عدّاد الفزعات”, a tangible blue/teal automotive-style instrument measuring completed assists (not speed). Gold needle at 42 out of 60, separate 320-point balance and gold-helper status. Built-in ImageGen; exact prompt in `2026-10-27-f-prompt.txt`. Visually inspected; no app implementation. The rendered footer bar is LTR: a selected implementation must correct it to RTL and use live/native localized text instead of flattening this bitmap.

Proposed motion: needle eases to the real count and advances on confirmed assists; touch tilt is restrained, with a static reduced-motion state. No continuously rising fake count. Existing reward thresholds/data remain unchanged. No deployment or store upload; tree-detail draft preserved.

## Established-product research — 2026-10-27

Official product/design pages reviewed, with their published static examples inspected. These are reference patterns, not a claim that we tested current installed versions. Duolingo's examples include older design articles, Spotify's are Wrapped 2025, and Apple's page includes older device imagery. No borrowed artwork is committed or imported by AKHOO; local inspection downloads are ignored.

| Reference | Observed pattern | Proposed AKHOO adaptation |
|---|---|---|
| [Apple Activity](https://www.apple.com/watch/close-your-rings/) | Immediately legible completion rings and milestone awards. | One restrained progress arc tied to completed assists; legible remaining count and next level. |
| [Nike Run Club](https://www.nike.com/help/a/nrc-activity) | Prominent activity total, secondary metrics and a separate achievements area. | Clear 42-assist headline, smaller 320-point balance, earned milestones available in detail. |
| [Duolingo milestone motion](https://blog.duolingo.com/streak-milestone-design-animation/) and [achievements](https://blog.duolingo.com/achievement-badges/) | Character transformation at milestones and a visible achievement collection. | Optional original AKHOO character changes pose/accessory on rank-up; animation triggered by confirmed progress, not daily attendance. |
| [Spotify Wrapped 2025](https://newsroom.spotify.com/2025-12-03/2025-wrapped-user-experience/) | Personal data presented as expressive stories and share cards; the minutes example uses a dominant number. | Make the assist count visually central; an optional personal achievement-share view in the user's selected language. |
| [Airbnb Superhost](https://www.airbnb.com/help/article/829) | Status tied to explicit requirements and visible on profile. | Show why a helper has a rank and exactly how far to the next existing level; don't imply a rank guarantees safety. |

Design recommendation (our judgment): a personal helper-achievement card combining Nike's numeric hierarchy, Apple's legible progress and a brief Duolingo-style rank-up response, all in AKHOO blue/teal. One central message, a small current-rank element, 42 confirmed assists, 18 remaining to the existing 60 threshold, and 320 spendable points kept separate. Compact layout first; depth only where it reinforces interaction. A character-led alternative can be reviewed if the owner prefers a warmer direction.

No new design or implementation is selected. Proposed share/story/character behavior is not implemented. Existing thresholds and backend data remain unchanged. Reduced-motion presentation should be static and text/data must remain live, localized and accessible.

## Direction G — evolving helper character, rejected after local prototype

`2026-10-27-g-helper-character.png`: original AKHOO helper character with blue/teal clothing and gold details for the sample current level, under “أثرك بأخوو”. The separate strip beneath the card previews bronze, silver, gold and green appearance changes; it is a design exploration, not extra in-app UI. Built-in ImageGen; full prompt in `2026-10-27-g-prompt.txt`.

Inspired by Duolingo's milestone-transformation principle and Apple's clear information hierarchy, without copying their characters or artwork. Sample values: 42 confirmed assists, 320 points, 18 assists remaining. Visual inspection confirmed readable Arabic and the intended RTL progress direction; final progress geometry/text would be data-driven if selected.

The owner initially requested a local implementation. An ImageGen/Grok transparent-animation prototype was created and reviewed in the local browser, then rejected on 2026-10-28. That character code/assets and the earlier tree draft remain uncommitted locally and are not selected for release. No deployment, store, backend or production change.

## Direction H — miniature AKHOO help station, rejected

Rejected by the owner on 2026-10-28; keep as image-only history.

`2026-10-28-h-help-station.png`: “محطّتك بأخوو”, a premium isometric service-station miniature in cobalt/teal/pearl, with a blue car, tool case and three small progression studies. The idea represents a growing contribution to the community; it does not claim AKHOO owns physical garages. Built-in ImageGen, exact prompt in `2026-10-28-h-prompt.txt`.

Sample values: 42 completed assists, 320 points, 18 remaining. Visually inspected for Arabic readability and a distinct architectural direction. This is only a review image, not imported by the app. The mockup's left-filled bar and three exploration scenes are illustrative; any selected implementation must use RTL progress, actual existing rank thresholds, live localized text and compact mobile spacing.

Possible motion if selected: the service bay opens briefly on confirmed progress, a car arrives gently and the station gains a small detail at earned milestones. No implementation or new animation has started. G's rejected draft is preserved separately; no store, deployment or backend action.

## Direction I — premium car key, rejected

Rejected by the owner on 2026-10-28; retained as image-only history.

`2026-10-28-i-help-key.png`: “مفتاح الخير بإيدك”, a tactile cobalt/teal car-key fob with chrome ring, woven loop and restrained gold accent. One object beside clear completed-assist totals, rank and a separate point balance; no scene or character. Built-in ImageGen; exact prompt in `2026-10-28-i-prompt.txt`.

Visually inspected: legible Arabic, distinct materials, uncluttered composition, right-to-left progress fill. Sample values remain 42 completed assists, 320 points and 18 assists remaining. The rendered lock symbols are part of the illustration, not usable controls or a claim of remote car access. Any implementation would retain native/localized text and existing thresholds; no rank-gated benefits are invented.

Possible motion if selected: small touch-responsive tilt and a restrained material highlight on a confirmed milestone, static with reduced motion. Image-only; no code or animation work started for I. Earlier rejected drafts remain uncommitted locally. No deployment or store action.

## Direction J — interlocking heart on navy, awaiting image review

`2026-10-28-j-heart.png`: “أثرك بيفرق”, a tactile heart sculpture made from interlocking cobalt and teal pieces, representing mutual support. The card changes to deep navy, white completed-assist total, restrained gold rank label, turquoise point balance and integrated progress strip. Built-in ImageGen; exact prompt in `2026-10-28-j-prompt.txt`.

Visually inspected: legible Arabic, clear object silhouette, no overlap and right-to-left progress fill. Sample values are unchanged: 42 completed assists, 320 points, 18 remaining. This is image-only, not imported into the application. Possible motion after selection: a gentle breathing movement and touch tilt, with a static reduced-motion state. Any implementation must use real localized text and the existing reward thresholds. No code, new motion, backend, store or deployment action for J.

## Prompts

### A

Use case: ui-mockup. Make ONE premium mobile app REWARDS BALANCE CARD design mockup for the Arabic roadside-help community app AKHOO. This is a design REVIEW bitmap, not a poster, not a phone screenshot. Flat orthographic front view, no device, no perspective on the UI card. The card takes 88% of a compact landscape image, on a very pale ice-blue background. Card about 1.5:1 aspect ratio with perfectly rounded corners, precise spacing, clear right-to-left layout. Highly polished real product UI. All Arabic typography must be legible correctly shaped with generous baselines and clear dots, NO fake microtext. Use only the exact following labels: upper right small "رصيدك من النقاط", huge numeric "320", below it "نقطة", prominent "مساعد ذهبي", smaller "مستواك الحالي". Bottom progress area text "باقي 18 مساعدة وبتوصل لأخوو الأخضر". Below a thick elegant progress bar filled 70% from RIGHT toward LEFT, caption "42 من 60 مساعدة". A striking TRUE premium 3D GOLD MEDAL on the left, thick machined warm gold rim, raised dimensional five-point star, realistic folded blue and teal satin ribbons with natural curves, angled enough to show depth. It is an object designed to be animated later, not a flat emoji. Larger more dimensional and better lit than a standard flat medal icon. No other symbols, no confetti, no glitter, no bright beams, no particles, no play/pause controls, no irrelevant buttons, no extra labels. Meticulous hierarchy, suitable for a 390px mobile screen. DIRECTION A: a single uninterrupted deep midnight-navy to petrol-teal card. Warm ivory huge 320 and clean gold level title. Very subtle embossed sweeping curves behind the medal, diffused studio illumination and restrained contact shadow. Integrated dark translucent bottom progress section separated only by a hairline; do NOT use a white bottom tray. Mint-teal progress with a small gold leading dot. The result feels refined, warm, tactile and calm. Medal fills the left half generously without touching text. Balanced airy spacing but no vacant vertical padding. Small external option label "A" above the card on the pale background.

### B

Use case: ui-mockup. Make ONE premium mobile app REWARDS BALANCE CARD design mockup for the Arabic roadside-help community app AKHOO. This is a design REVIEW bitmap, not a poster, not a phone screenshot. Flat orthographic front view, no device, no perspective on the UI card. The card takes 88% of a compact landscape image, on a very pale ice-blue background. Card about 1.5:1 aspect ratio with perfectly rounded corners, precise spacing, clear right-to-left layout. Highly polished real product UI. All Arabic typography must be legible correctly shaped with generous baselines and clear dots, NO fake microtext. Use only the exact following labels: upper right small "رصيدك من النقاط", huge numeric "320", below it "نقطة", prominent "مساعد ذهبي", smaller "مستواك الحالي". Bottom progress area text "باقي 18 مساعدة وبتوصل لأخوو الأخضر". Below a thick elegant progress bar filled 70% from RIGHT toward LEFT, caption "42 من 60 مساعدة". A striking TRUE premium 3D GOLD MEDAL on the left, thick machined warm gold rim, raised dimensional five-point star, realistic folded blue and teal satin ribbons with natural curves, angled enough to show depth. It is an object designed to be animated later, not a flat emoji. Larger more dimensional and better lit than a standard flat medal icon. No other symbols, no confetti, no glitter, no bright beams, no particles, no play/pause controls, no irrelevant buttons, no extra labels. Meticulous hierarchy, suitable for a 390px mobile screen. DIRECTION B: a refined pearl-white and pale mint card with subtle embossed curvature, a large recessed teal circular alcove on the left holding the beautifully dimensional gold medal and its folded ribbons. Generous natural soft shadows, tasteful depth, no plastic glass effects. Right-hand numeric 320 in deep navy, gold-helper title deep warm teal with tiny gold accent rule. Bottom integrated pale mint progress section with deep teal fill and a small gold leading dot. Make this genuinely bright and tactile, clean modern community app rather than dark fintech. No chunky frames or nested cards. Small external option label "B" above the card on the pale background.
