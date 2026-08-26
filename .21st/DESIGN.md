# SANAD V2 — Civic Signal design context

## Product

Jerusalem-first civic assistance mobile platform. Arabic is primary; Arabic and Hebrew are RTL, while English is LTR. The interface must feel like dependable civic infrastructure with human warmth—not an emergency alarm and not a marketplace reskin.

## Brand anchors

- Navy `#0B1F33`: authority, navigation, live mission and fixed brand surfaces
- Signal Blue `#1768E5`: “I Need Help,” primary action, active progress
- Community Teal `#147D62`: “I Can Help,” trust, arrival, success
- Emergency Coral `#C93D34`: immediate-risk and destructive actions only
- Reward Gold `#D99B22`: SANAD+, points and rewards
- Fog `#F3F6FA`: default light canvas

Semantic tokens and fixed-surface contrast tokens are defined in `src/lib/theme.ts`; product UI must reference those tokens rather than literal colors.

## Typography and direction

- Arabic: Noto Sans Arabic
- Hebrew: Noto Sans Hebrew
- English: Inter
- Logical alignment and mirrored directional icons are required; do not hardcode physical left/right meaning.

## Layout

- Comfortable mobile density; target reference viewport 390×844.
- Spacing scale: 4, 8, 12, 16, 20, 24, 32, 40, 48.
- Control radius 14, card radius 18–24, sheet radius 28, pills fully rounded.
- Shadows are reserved for floating navigation, map controls, sheets and clear elevation—not decoration.

## Required patterns

- Give “I Need Help” and “I Can Help” equal visual weight.
- Screen emergencies before a request is published.
- Use maps and bottom-sheet-like surfaces for matching and live mission state.
- Keep status progression explicit, immutable and easy to scan.
- Keep exact identity/location/media private until a mission is matched.
- Every component supports RTL, accessibility, loading, disabled, error and empty states.

## Avoid

- V1 layout reuse or color-only restyling
- emergency coral as a general brand color
- decorative gradients, glass effects and visual noise
- unlabeled icon-only controls
- raw Supabase errors or direct Supabase calls in screens
- fixed English accessibility labels
