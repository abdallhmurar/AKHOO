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

Build 31 reserved and source prepared. Native build, IPA inspection, Apple processing and internal-group verification pending. Do not treat this section as a delivery confirmation until updated with their results.
