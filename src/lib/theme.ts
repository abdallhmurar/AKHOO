import { useColorScheme } from 'react-native'

/** SANAD V2 — Civic Signal immutable brand anchors. */
export const civicColors = {
  navy: '#0B1F33',
  signalBlue: '#1768E5',
  communityTeal: '#147D62',
  emergencyCoral: '#C93D34',
  rewardGold: '#D99B22',
  fog: '#F3F6FA'
} as const

export const palette = {
  ...civicColors,
  white: '#FFFFFF',
  black: '#000000',
  navy900: '#071522',
  navy800: '#102A43',
  navy700: '#173650',
  slate700: '#3D5064',
  slate600: '#52657A',
  slate500: '#65768A',
  slate400: '#8796A8',
  slate300: '#AAB7C5',
  slate200: '#C7D2DE',
  slate150: '#D9E2EC',
  slate100: '#E8EEF5',
  bluePressed: '#1157C4',
  blueSoft: '#E7F0FF',
  blueSoftDark: '#143A67',
  tealPressed: '#0F674F',
  tealSoft: '#E3F3EE',
  tealSoftDark: '#103D35',
  coralPressed: '#A9332C',
  coralSoft: '#FBE9E7',
  coralSoftDark: '#4A292C',
  goldPressed: '#B77D13',
  goldSoft: '#FFF3D6',
  goldSoftDark: '#4C3A19',
  /** Contrast tokens for the fixed Civic Signal navy/teal brand surfaces. */
  onCivic: '#FFFFFF',
  onCivicMuted: '#C7D4E1',
  onCivicSubtle: '#91A5B8',
  onCivicFaint: '#AFC1D1',
  onCommunityMuted: '#D4EBE4',
  onCommunitySubtle: '#D9F3EA',
  civicBorder: '#284966',
  civicBorderStrong: '#315D83',
  civicRadarOuter: '#1F4566',
  civicRadarMiddle: '#285878',
  civicRadarInner: '#3475A1',
  civicSignalSoft: '#6CA3F1',
  civicAccentText: '#9CC1F4',
  civicAccentStrong: '#8EB8F1',
  civicOutline: '#55708A',
  whiteAlpha04: '#FFFFFF0A',
  whiteAlpha08: '#FFFFFF14',
  whiteAlpha12: '#FFFFFF20',
  whiteAlpha60: '#FFFFFF99'
} as const

export const lightThemeColors = {
  background: civicColors.fog,
  surface: palette.white,
  surfaceElevated: palette.white,
  surfaceMuted: palette.slate100,
  surfaceStrong: '#DDE6EF',
  textPrimary: civicColors.navy,
  textSecondary: palette.slate700,
  textMuted: palette.slate500,
  textInverse: palette.white,
  border: palette.slate150,
  borderStrong: '#B8C6D5',
  primary: civicColors.signalBlue,
  primaryPressed: palette.bluePressed,
  primarySoft: palette.blueSoft,
  onPrimary: palette.white,
  community: civicColors.communityTeal,
  communityPressed: palette.tealPressed,
  communitySoft: palette.tealSoft,
  onCommunity: palette.white,
  emergency: civicColors.emergencyCoral,
  emergencyPressed: palette.coralPressed,
  emergencySoft: palette.coralSoft,
  onEmergency: palette.white,
  reward: civicColors.rewardGold,
  rewardPressed: palette.goldPressed,
  rewardSoft: palette.goldSoft,
  onReward: civicColors.navy,
  success: civicColors.communityTeal,
  successSoft: palette.tealSoft,
  warning: civicColors.rewardGold,
  warningSoft: palette.goldSoft,
  danger: civicColors.emergencyCoral,
  dangerSoft: palette.coralSoft,
  info: civicColors.signalBlue,
  infoSoft: palette.blueSoft,
  disabledBackground: '#E1E7EE',
  disabledContent: palette.slate400,
  focus: '#5A98F2',
  overlay: '#0715228A',
  shadow: '#07152224',
  skeleton: '#DEE6EE',
  skeletonHighlight: '#EEF3F8',
  mapUser: civicColors.signalBlue,
  mapRequest: civicColors.emergencyCoral,
  mapRequestSelected: civicColors.communityTeal
} as const

export const darkThemeColors = {
  background: palette.navy900,
  surface: civicColors.navy,
  surfaceElevated: palette.navy800,
  surfaceMuted: palette.navy700,
  surfaceStrong: '#20425E',
  textPrimary: '#F7FAFC',
  textSecondary: '#CBD6E2',
  textMuted: '#9AAABC',
  textInverse: civicColors.navy,
  border: '#29445D',
  borderStrong: '#41617D',
  primary: '#4D91F0',
  primaryPressed: '#74A9F3',
  primarySoft: palette.blueSoftDark,
  onPrimary: civicColors.navy,
  community: '#42AD8C',
  communityPressed: '#6CC0A7',
  communitySoft: palette.tealSoftDark,
  onCommunity: civicColors.navy,
  emergency: '#E66E66',
  emergencyPressed: '#EF928C',
  emergencySoft: palette.coralSoftDark,
  onEmergency: civicColors.navy,
  reward: '#E8B44E',
  rewardPressed: '#F0C875',
  rewardSoft: palette.goldSoftDark,
  onReward: civicColors.navy,
  success: '#42AD8C',
  successSoft: palette.tealSoftDark,
  warning: '#E8B44E',
  warningSoft: palette.goldSoftDark,
  danger: '#E66E66',
  dangerSoft: palette.coralSoftDark,
  info: '#68A2F2',
  infoSoft: palette.blueSoftDark,
  disabledBackground: '#1E354B',
  disabledContent: '#71869A',
  focus: '#82B3F5',
  overlay: '#02070CBF',
  shadow: '#00000080',
  skeleton: '#1D3952',
  skeletonHighlight: '#294A66',
  mapUser: '#68A2F2',
  mapRequest: '#E66E66',
  mapRequestSelected: '#42AD8C'
} as const

export type SanadThemeMode = 'light' | 'dark'
export type SanadThemeColors = { [Key in keyof typeof lightThemeColors]: string }

export const space = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
  giant: 48
} as const

export const radius = {
  none: 0,
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  sheet: 28,
  pill: 999
} as const

export const shadow = {
  none: {},
  soft: {
    shadowColor: lightThemeColors.shadow,
    shadowOpacity: 1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2
  },
  elevated: {
    shadowColor: lightThemeColors.shadow,
    shadowOpacity: 1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6
  },
  floating: {
    shadowColor: lightThemeColors.shadow,
    shadowOpacity: 1,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10
  }
} as const

export const motion = { instant: 0, fast: 150, normal: 220, slow: 360 } as const

export const spring = {
  soft: { useNativeDriver: true, speed: 14, bounciness: 6 },
  snappy: { useNativeDriver: true, speed: 40, bounciness: 4 },
  sheet: { useNativeDriver: true, speed: 16, bounciness: 4 }
} as const

export function getSanadTheme(mode: SanadThemeMode = 'light') {
  const themeColors: SanadThemeColors = mode === 'dark' ? darkThemeColors : lightThemeColors
  return { mode, isDark: mode === 'dark', colors: themeColors, space, radius, shadow, motion, spring }
}

export type SanadTheme = ReturnType<typeof getSanadTheme>

export function useSanadTheme(): SanadTheme {
  const scheme = useColorScheme()
  return getSanadTheme(scheme === 'dark' ? 'dark' : 'light')
}

/** Legacy aliases retained while V1 screens move to the V2 primitives. */
export const colors = {
  bg: lightThemeColors.background,
  surface: lightThemeColors.surface,
  surfaceMuted: lightThemeColors.surfaceMuted,
  surfaceElevated: lightThemeColors.surfaceElevated,
  forest: civicColors.communityTeal,
  forestPressed: palette.tealPressed,
  sage: palette.slate600,
  sageSoft: lightThemeColors.communitySoft,
  sand: civicColors.rewardGold,
  sandSoft: lightThemeColors.rewardSoft,
  text: civicColors.navy,
  muted: lightThemeColors.textMuted,
  border: lightThemeColors.border,
  ink: civicColors.navy,
  inkElevated: palette.navy800,
  inkBorder: palette.navy700,
  inkText: palette.white,
  inkMuted: '#B7C5D3',
  success: lightThemeColors.success,
  successSoft: lightThemeColors.successSoft,
  warning: lightThemeColors.warning,
  warningSoft: lightThemeColors.warningSoft,
  danger: lightThemeColors.danger,
  dangerSoft: lightThemeColors.dangerSoft,
  info: lightThemeColors.info,
  infoSoft: lightThemeColors.infoSoft,
  shadow: lightThemeColors.shadow,
  card: lightThemeColors.surface,
  blue: civicColors.signalBlue,
  blueDark: palette.bluePressed,
  blueSoft: lightThemeColors.primarySoft,
  green: civicColors.communityTeal,
  greenSoft: lightThemeColors.communitySoft,
  red: civicColors.emergencyCoral,
  redSoft: lightThemeColors.emergencySoft
} as const

export const semantic = {
  background: colors.bg,
  surface: colors.surface,
  surfaceElevated: colors.surfaceElevated,
  surfaceMuted: colors.surfaceMuted,
  textPrimary: colors.text,
  textSecondary: colors.sage,
  textMuted: colors.muted,
  border: colors.border,
  brand: civicColors.signalBlue,
  brandStrong: palette.bluePressed,
  community: civicColors.communityTeal,
  accent: colors.sand,
  success: colors.success,
  warning: colors.warning,
  danger: colors.danger,
  info: colors.info,
  mapUser: lightThemeColors.mapUser,
  mapRequest: lightThemeColors.mapRequest,
  mapRequestSelected: lightThemeColors.mapRequestSelected
} as const

// Legacy typography remains available until each old screen migrates.
export const font = {
  regular: 'Tajawal_400Regular',
  medium: 'Tajawal_500Medium',
  bold: 'Tajawal_700Bold',
  extraBold: 'Tajawal_800ExtraBold'
} as const

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
} as const
