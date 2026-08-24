// SANAD Visual Reset (Step 3, round 3) - design tokens rebuilt from the MCP
// reference board (Design Inspiration + 21st MCP; see published reference
// board artifact). Same key names as before so every consumer keeps
// compiling untouched - the reset happens in the VALUES, which is also why
// changing this one file measurably changes almost every screen at once.
export const colors = {
  bg: '#F4EFE2',
  surface: '#FFFFFF',
  surfaceMuted: '#EFEADA',
  surfaceElevated: '#FFFFFF',

  // Deeper, cooler forest than the original brief - reads as a considered
  // brand color instead of "generic app green," and gives more contrast
  // against the warmer paper background below.
  forest: '#254A39',
  forestPressed: '#193226',
  sage: '#66806F',
  sageSoft: '#E4EAE1',

  // Sand moves from a soft decorative tint to a genuine second brand color -
  // it now carries all reward/premium/points meaning (SANAD+, Activity
  // Star, offer badges) so those moments read as a distinct tier rather
  // than "forest green, but the card is slightly different."
  sand: '#B4863A',
  sandSoft: '#EFE1C3',

  // Primary text - a warm near-black instead of the previous mid-contrast
  // green-grey, for a more editorial, premium type color.
  text: '#161F19',
  muted: '#69766C',
  border: '#DFD9C8',

  // Reserved dark "ink" surface - used ONLY for SANAD+/premium and the
  // Active-Request status capsule, never as a general card background. This
  // is the deliberate contrast surface the reference board's loyalty/
  // membership research called for (Elite Plan Card, Loyalify).
  ink: '#141C16',
  inkElevated: '#1D2A20',
  inkBorder: '#2B3A2E',
  inkText: '#F3EEDF',
  inkMuted: '#AEBBAF',

  success: '#2E9468',
  successSoft: '#E1F1E8',
  warning: '#BD8433',
  warningSoft: '#F4E9D4',
  danger: '#BD5A50',
  dangerSoft: '#F5E6E3',
  info: '#4A7591',
  infoSoft: '#E5EFF3',

  shadow: '#161F1926',

  // legacy aliases so screens not yet migrated to the new system keep compiling
  card: '#FFFFFF',
  blue: '#254A39',
  blueDark: '#193226',
  blueSoft: '#E4EAE1',
  green: '#2E9468',
  greenSoft: '#E1F1E8',
  red: '#BD5A50',
  redSoft: '#F5E6E3'
}

export const semantic = {
  background: colors.bg,
  surface: colors.surface,
  surfaceElevated: colors.surfaceElevated,
  surfaceMuted: colors.surfaceMuted,
  textPrimary: colors.text,
  textSecondary: colors.sage,
  textMuted: colors.muted,
  border: colors.border,
  brand: colors.forest,
  brandStrong: colors.forestPressed,
  accent: colors.sand,
  success: colors.success,
  warning: colors.warning,
  danger: colors.danger,
  info: colors.info,
  mapUser: colors.forest,
  mapRequest: colors.sand,
  mapRequestSelected: colors.forest
}

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 }

// Radius drops from one dominant "24 everywhere" value to a genuine scale -
// most cards now read closer to 14-18, `xl`/`sheet` are reserved for the
// few surfaces that should visibly dominate (hero cards, sheets), and `xs`
// exists for small chips/badges that previously reused `sm` too loosely.
export const radius = { xs: 6, sm: 10, md: 14, lg: 18, xl: 24, sheet: 28, pill: 999 }

// Elevation is now genuinely restrained: `soft` (the default almost every
// card uses via <Surface elevation="soft">) is nearly flat - a hairline
// lift, relying on the border for definition instead of a visible shadow -
// so cards stop reading as "everything floats." `elevated`/`floating` stay
// strong, reserved for sheets and the handful of real floating controls
// (map buttons, the new floating tab bar).
export const shadow = {
  soft: {
    shadowColor: colors.shadow,
    shadowOpacity: 1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1
  },
  elevated: {
    shadowColor: colors.shadow,
    shadowOpacity: 1,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6
  },
  floating: {
    shadowColor: colors.shadow,
    shadowOpacity: 1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8
  }
}

export const font = {
  regular: 'Tajawal_400Regular',
  medium: 'Tajawal_500Medium',
  bold: 'Tajawal_700Bold',
  extraBold: 'Tajawal_800ExtraBold'
}

// Typography scale, redrawn wider at the top (display/hero) and tighter in
// the body than the previous scale - bigger contrast between "this is the
// headline" and "this is supporting text" reads as more editorial/premium
// per the reference board. `eyebrow` and `statLg` are new: eyebrow replaces
// the ad-hoc textTransform:'uppercase' section labels scattered across
// screens with one real token; statLg is for the one or two numbers per
// screen (points, Active Request ETA-style values) that should anchor the
// whole composition the way the Activity/Account references do.
export const type = {
  display: { fontFamily: font.extraBold, fontSize: 38, lineHeight: 44, letterSpacing: -0.5 },
  hero: { fontFamily: font.extraBold, fontSize: 32, lineHeight: 38, letterSpacing: -0.4 },
  title: { fontFamily: font.extraBold, fontSize: 26, lineHeight: 32 },
  h1: { fontFamily: font.extraBold, fontSize: 24, lineHeight: 30 },
  h2: { fontFamily: font.extraBold, fontSize: 19, lineHeight: 25 },
  h3: { fontFamily: font.bold, fontSize: 16, lineHeight: 22 },
  section: { fontFamily: font.bold, fontSize: 17, lineHeight: 23 },
  eyebrow: { fontFamily: font.bold, fontSize: 11.5, lineHeight: 15, letterSpacing: 1 },
  bodyLarge: { fontFamily: font.regular, fontSize: 16, lineHeight: 24 },
  body: { fontFamily: font.regular, fontSize: 14.5, lineHeight: 21 },
  bodyMedium: { fontFamily: font.medium, fontSize: 14.5, lineHeight: 21 },
  small: { fontFamily: font.regular, fontSize: 12.5, lineHeight: 18 },
  caption: { fontFamily: font.regular, fontSize: 11.5, lineHeight: 16 },
  button: { fontFamily: font.bold, fontSize: 15, lineHeight: 19 },
  numeric: { fontFamily: font.extraBold, fontSize: 32, lineHeight: 36, letterSpacing: -0.5 },
  statLg: { fontFamily: font.extraBold, fontSize: 52, lineHeight: 54, letterSpacing: -1.5 }
}

export const motion = {
  fast: 150,
  normal: 220,
  slow: 360
}

export const spring = {
  soft: { useNativeDriver: true, speed: 14, bounciness: 6 },
  snappy: { useNativeDriver: true, speed: 40, bounciness: 4 },
  sheet: { useNativeDriver: true, speed: 16, bounciness: 4 }
}
