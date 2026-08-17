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

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 }

export const radius = { sm: 10, md: 16, lg: 24, sheet: 32, pill: 999 }

export const shadow = {
  soft: {
    shadowColor: colors.shadow,
    shadowOpacity: 1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3
  }
}

export const font = {
  regular: 'Tajawal_400Regular',
  medium: 'Tajawal_500Medium',
  bold: 'Tajawal_700Bold',
  extraBold: 'Tajawal_800ExtraBold'
}

export const type = {
  display: { fontFamily: font.extraBold, fontSize: 34, lineHeight: 42 },
  title: { fontFamily: font.extraBold, fontSize: 26, lineHeight: 33 },
  section: { fontFamily: font.bold, fontSize: 19, lineHeight: 26 },
  body: { fontFamily: font.regular, fontSize: 15, lineHeight: 23 },
  bodyMedium: { fontFamily: font.medium, fontSize: 15, lineHeight: 23 },
  caption: { fontFamily: font.regular, fontSize: 12.5, lineHeight: 18 }
}
