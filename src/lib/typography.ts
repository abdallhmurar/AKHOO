import { useTranslation } from 'react-i18next'
import { Platform } from 'react-native'
import type { TextStyle } from 'react-native'

export type FontWeightName = 'regular' | 'medium' | 'semibold' | 'bold' | 'extraBold'

export const fontFamilies = {
  ar: {
    regular: 'NotoSansArabic_400Regular',
    medium: 'NotoSansArabic_500Medium',
    semibold: 'NotoSansArabic_600SemiBold',
    bold: 'NotoSansArabic_700Bold',
    extraBold: 'NotoSansArabic_800ExtraBold'
  },
  he: {
    regular: 'NotoSansHebrew_400Regular',
    medium: 'NotoSansHebrew_500Medium',
    semibold: 'NotoSansHebrew_600SemiBold',
    bold: 'NotoSansHebrew_700Bold',
    extraBold: 'NotoSansHebrew_800ExtraBold'
  },
  en: {
    regular: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    semibold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold',
    extraBold: 'Inter_800ExtraBold'
  }
} as const

export type TypographyLanguage = keyof typeof fontFamilies

export function normalizeTypographyLanguage(value?: string): TypographyLanguage {
  return value?.startsWith('he') ? 'he' : value?.startsWith('en') ? 'en' : 'ar'
}

export function getFontFamily(language: string | undefined, weight: FontWeightName = 'regular') {
  if (Platform.OS !== 'web' && normalizeTypographyLanguage(language) === 'ar') {
    return { regular: 'Tajawal_400Regular', medium: 'Tajawal_500Medium', semibold: 'Tajawal_700Bold', bold: 'Tajawal_700Bold', extraBold: 'Tajawal_800ExtraBold' }[weight]
  }
  return fontFamilies[normalizeTypographyLanguage(language)][weight]
}

export function useAppFont(weight: FontWeightName = 'regular') {
  const { i18n } = useTranslation()
  return getFontFamily(i18n.language, weight)
}

export function createTypography(language: string | undefined) {
  const isArabic = normalizeTypographyLanguage(language) === 'ar'
  const isRTL = isArabic || normalizeTypographyLanguage(language) === 'he'
  const family = (weight: FontWeightName) => getFontFamily(language, weight)
  const text = (weight: FontWeightName, fontSize: number, lineHeight: number, extra?: TextStyle): TextStyle => {
    const style: TextStyle = { fontFamily: family(weight), fontSize, lineHeight, ...extra }
    if (Platform.OS !== 'web') style.writingDirection = isRTL ? 'rtl' : 'ltr'
    if (isArabic) {
      // Arabic is a connected script: don't apply Latin tracking to its glyphs.
      delete style.letterSpacing
      style.writingDirection = 'rtl'
      // Tajawal avoids Noto Arabic's very tall native line boxes. Keep enough
      // room for connected glyphs/diacritics, and let Dynamic Type scale both.
      if (Platform.OS !== 'web') style.lineHeight = Math.ceil(fontSize * 1.55)
    }
    return style
  }
  return {
    // Every size here is one notch smaller than before (on top of the
    // generous line-height-to-font-size ratio already fixed for
    // NotoSansArabic/NotoSansHebrew's taller glyphs) per explicit request:
    // shrink all text and numbers a step, not just widen their line boxes.
    display: text('extraBold', 32, 42, { letterSpacing: -0.7 }),
    hero: text('extraBold', 27, 36, { letterSpacing: -0.45 }),
    h1: text('bold', 23, 32, { letterSpacing: -0.25 }),
    h2: text('bold', 20, 27),
    h3: text('bold', 16, 22),
    title: text('semibold', 15, 22),
    body: text('regular', 14, 21),
    bodyMedium: text('medium', 14, 21),
    small: text('regular', 12, 18),
    smallMedium: text('medium', 12, 18),
    caption: text('medium', 11, 16),
    eyebrow: text('bold', 10, 15, { letterSpacing: 0.7 }),
    button: text('bold', 14, 19),
    numeric: text('extraBold', 28, 38, { letterSpacing: -0.7 })
  } as const
}

export function useAppTypography() {
  const { i18n } = useTranslation()
  return createTypography(i18n.language)
}
