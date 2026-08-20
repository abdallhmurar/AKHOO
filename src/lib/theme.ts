export const colors = {
  bg: '#F7F3EA',
  surface: '#FFFFFF',
  surfaceMuted: '#FBF9F4',
  surfaceElevated: '#FFFFFF',

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
  infoSoft: '#E9F1F6',

  shadow: '#20342A1A',

  // legacy aliases so screens not yet migrated to the new system keep compiling
  card: '#FFFFFF',
  blue: '#315E48',
  blueDark: '#274C3A',
  blueSoft: '#EAF0EA',
  green: '#2F9D70',
  greenSoft: '#E4F5EC',
  red: '#D95C5C',
  redSoft: '#FBEAEA'
}

// Semantic aliases (section 5 of the design brief) - point at the same
// physical colors above rather than duplicating values, so the palette
// still has one source of truth.
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
  // Map pin identity - the one place these colors are defined; SanadMap.
  // native/web read from here instead of hardcoding hex per-marker.
  mapUser: colors.forest,
  mapRequest: colors.sand,
  mapRequestSelected: colors.forest
}

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 }

export const radius = { sm: 10, md: 16, lg: 24, sheet: 32, pill: 999 }

// Three elevation tiers instead of one flat "shadow.soft" everywhere -
// restraint through variation (design brief section 47): most surfaces use
// soft or nothing, elevated is for cards that should read as "above" the
// page (e.g. the request bottom sheet), floating is reserved for the rare
// floating control (map recenter button) so it doesn't get diluted by
// overuse.
export const shadow = {
  soft: {
    shadowColor: colors.shadow,
    shadowOpacity: 1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3
  },
  elevated: {
    shadowColor: colors.shadow,
    shadowOpacity: 1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6
  },
  floating: {
    shadowColor: colors.shadow,
    shadowOpacity: 1,
    shadowRadius: 20,
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

// Typography scale (design brief section 6). Existing names (display,
// title, section, body, bodyMedium, caption) are kept unchanged so nothing
// that already reads them breaks - new names fill the gaps the brief asks
// for (hero, h1-h3, bodyLarge, small, button, numeric).
export const type = {
  display: { fontFamily: font.extraBold, fontSize: 34, lineHeight: 42 },
  hero: { fontFamily: font.extraBold, fontSize: 30, lineHeight: 38 },
  title: { fontFamily: font.extraBold, fontSize: 26, lineHeight: 33 },
  h1: { fontFamily: font.extraBold, fontSize: 26, lineHeight: 33 },
  h2: { fontFamily: font.extraBold, fontSize: 21, lineHeight: 28 },
  h3: { fontFamily: font.bold, fontSize: 17, lineHeight: 24 },
  section: { fontFamily: font.bold, fontSize: 19, lineHeight: 26 },
  bodyLarge: { fontFamily: font.regular, fontSize: 17, lineHeight: 26 },
  body: { fontFamily: font.regular, fontSize: 15, lineHeight: 23 },
  bodyMedium: { fontFamily: font.medium, fontSize: 15, lineHeight: 23 },
  small: { fontFamily: font.regular, fontSize: 13, lineHeight: 19 },
  caption: { fontFamily: font.regular, fontSize: 12.5, lineHeight: 18 },
  button: { fontFamily: font.bold, fontSize: 15.5, lineHeight: 20 },
  numeric: { fontFamily: font.extraBold, fontSize: 30, lineHeight: 36 }
}

// Motion presets (design brief section 10). Kept on top of React Native's
// built-in Animated API rather than adding react-native-reanimated - the
// installed dev-client build doesn't include it yet, and every effect these
// presets are used for (press feedback, fades, translateY, spring scale)
// runs on the native thread already via useNativeDriver, which is the
// actual performance requirement (section 41), not the library itself.
// Revisit when a round needs gesture-driven interpolation (drag-to-dismiss
// sheets) that Animated genuinely can't do well - that's worth its own
// EAS rebuild, not one bundled in silently here.
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
