// Ported from ../../../src/lib/theme.ts (the mobile app's single source of
// truth for the SANAD palette) - exposed as plain JS values for places that
// need a real color string rather than a Tailwind class (Recharts series
// colors, StatusBadge/ActivityStar inline styles, MapLibre marker colors).
// The same values are also mirrored into tailwind.config.ts's `sanad.*`
// scale - keep both in sync if the palette ever changes.

export const colors = {
  bg: '#F7F3EA',
  surface: '#FFFFFF',
  surfaceMuted: '#FBF9F4',
  forest: '#315E48',
  forestPressed: '#274C3A',
  sage: '#6F927D',
  sageSoft: '#EAF0EA',
  sand: '#D4B06A',
  sandSoft: '#F5EBD6',
  text: '#20342A',
  muted: '#6E7C74',
  border: '#E2E5E1',
  success: '#2F9D70',
  successSoft: '#E4F5EC',
  warning: '#D99B37',
  warningSoft: '#FBF0DD',
  danger: '#D95C5C',
  dangerSoft: '#FBEAEA',
  info: '#4C7A9C',
  infoSoft: '#E9F1F6'
} as const

export const chartPalette = [colors.forest, colors.sand, colors.info, colors.warning, colors.sage, colors.danger]
