# Local helper-card preview — approved concept M

Run `npm run preview:rewards` and open `http://127.0.0.1:4186/?lang=ar` on this computer. Use `?lang=en` or `?lang=he` for English/Hebrew. Loopback is intentionally local to this computer; it will not open from a phone or another network.

The actual iOS/web `LivePointsCard` renders a native-text personal card matching the approved reference: brushed blue/teal material, gold rim/corner, identity row, earned rank, 42 completed assists and 320 points by default, next-level progress, and four material corners. Its face tilts with pointer/touch movement and deliberately flips to show the existing rank requirements. Reduced motion makes the switch immediate. No autoplay video or perpetual animation is used.

Controls below the design are preview-only: simulate count/rank/balance/name, switch language, or restore the reference values. They do not award points or write backend data. The in-app parent passes the current account's existing name/avatar, available points balance and confirmed-assist count. These are completed assistance requests, not distinct people. Thresholds remain 5/15/30/60. Android keeps its existing panel.

Materials and exact generation prompts: `assets/helper-card/README.md`. Reference and rejected explorations: `concepts/README.md`. “قصص الفزعة” remains a separate future page, deferred at the owner's request.

This branch disables Vercel deployment for app and admin. No store, TestFlight, OTA, production, Android release, backend change or build-number reservation is included. Rejected character/tree drafts remain local and uncommitted; the active preview no longer imports them.

## Verification scope

TypeScript, ESLint (one existing `medal-element.js` import-resolver warning), the existing Vitest suite and Expo iOS/web exports were checked. The working-copy suite includes prior uncommitted character/tree tests; those are excluded from this task's commit. All four new material PNGs are in both exports, with no rejected character atlases imported by the new card.

Chrome visual/interaction review covers ar/en/he, narrow320px and390px layouts, front/back controls, keyboard Enter, pointer tilt, material changes, real DOM text and existing threshold/progress semantics. A long sample name truncates safely and a1,234,567-point sample stays visible without overflow. Emulated reduced motion produces `transform:none` and a0s transition while flip still works; every material image loaded and no app console errors appeared. Temporary viewport/media overrides were reset. Proof: `proofs/2026-10-28-helper-card-ar.png`.

The card's end-to-end boundary in this isolated preview is sample controls → production card props → localized rendering/interaction. The real-account data path is traced in `CommunityScreens.tsx`, not exercised against a live account. Physical iPhone, Safari, VoiceOver, native large Dynamic Type and on-device performance remain unverified. Export success is not a device test or uploaded binary.
