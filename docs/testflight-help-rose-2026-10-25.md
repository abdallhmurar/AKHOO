# Rose help-card TestFlight update — 2026-10-25

Owner requested the approved red/dark-rose card with a white car, animated through Grok, and delivery to **TestFlight only**. This changes the existing build-30 beta on `ios/testflight-partner-home-20261024`, not the public app.

## Changes

- Replaced the blue need-help card with the approved red/rose artwork and a silent Grok loop, under 1 MB. Car and character remain visible; native text is translated independently.
- The entire card opens the existing request flow, including the illustration. A requester with an active mission resumes it. The white action area remains clearly identifiable; small-height/large-text fallback keeps a solid rose action.
- Retained no-scroll layout, 44-point minimum action height, reduced-motion/error poster, muted autoplay, background/focus/modal pausing and hidden video controls.
- Added the new media separately; existing production scenes, partner banner, helper card and rewards remain unchanged.
- Configured isolated iOS **2.0.4 (31)**; OTA stays disabled. No App Store submission/release, Android operation, backend migration or Vercel deployment.

## Validation before native build

- TypeScript and targeted ESLint: passed.
- Vitest: **49 files / 304 tests passed**, including production-config isolation and rejection of Android TestFlight builds.
- Expo iOS export: passed; both final video and poster are bundled.
- Actual home components rendered through a local React Native Web harness: Arabic, English and Hebrew at 390 × 844 and 320 × 568; no document overflow. Checked whole-card navigation in all six renders, active mission resume, existing partner preview review/edit/simulated submission and rewards navigation.
- Browser playback of the actual MP4: 1344 × 672, muted, looping, no controls. Inspected representative video frames and rendered Arabic/English/Hebrew screens. FFprobe confirms one H.264 video stream and no audio.
- React review: one accessible press target without nested buttons; no new effect or state lifecycle; assets use static imports; playback uses the existing native lifecycle safeguards.

The rendering harness mocks native providers/player and does not replace physical iPhone testing. Safe-area behavior, native playback, VoiceOver and device appearance still need the owner's TestFlight check. The existing partner form remains a memory-only preview and sends no real application.

## Delivery

Completed **2026-10-26 (Asia/Jerusalem)**. Apple confirms **2.0.4 (31)** is **VALID / IN_BETA_TESTING**, available in the existing internal **Test** group. Arabic (`ar-SA`), English (`en-US`) and Hebrew (`he`) test notes were saved. No external group/invitation or Beta App Review was submitted.

- Source: [`5b471c98db12763c1ef50952fb708b2995c920c1`](https://github.com/abdallhmurar/AKHOO/commit/5b471c98db12763c1ef50952fb708b2995c920c1).
- Native build: [GitHub Actions run 40237249188](https://github.com/abdallhmurar/AKHOO/actions/runs/40237249188), **success**; artifact `12616195788`, `akhoo-testflight-31-ipa`.
- Signed IPA: `app.akhoo.help`, version 2.0.4, build 31, `partnerHomeBeta: true`, `EXUpdatesEnabled: false`. Embedded Grok video, poster and existing partner media matched source SHA-256 hashes. Rose scene/theme identifiers and existing backend URL are present in the signed bundle.
- IPA SHA-256: `0D7438D687EDA1BF696BBB14C644F74403F1E15A42801F8929339B0FF425CE4E`.
- Apple upload/build ID: `e01db523-d49b-499f-9871-b93e7cd86306`. All 19 upload parts completed once; Apple upload finished without errors/warnings and build processing completed.
- Post-upload App Store comparison: **all version states, release types and build associations unchanged** from the baseline. Public 2.0.2 remains live; 2.0.3/build 29 remains pending manual developer release. Android, OTA, backend and Vercel were not changed.

[Artwork provenance and generation prompts](../assets/help-rose/README.md), [final video](../assets/help-rose/help-rose-loop.mp4), [fallback poster](../assets/help-rose/help-rose-poster.jpg). Delivery evidence and credentials stay in the ignored local `credentials/` folder; no IPA, keys or private account data are committed.

Open TestFlight, select AKHOO and update to **2.0.4 (31)**. On the iPhone, check the full-card press, active-request resume, video loop, Reduce Motion, dark mode and the three languages. No physical-device pass is claimed by this report.
