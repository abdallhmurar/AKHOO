import { useTranslation } from 'react-i18next'
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
  return fontFamilies[normalizeTypographyLanguage(language)][weight]
}

export function useAppFont(weight: FontWeightName = 'regular') {
  const { i18n } = useTranslation()
  return getFontFamily(i18n.language, weight)
}

export function createTypography(language: string | undefined) {
  const family = (weight: FontWeightName) => getFontFamily(language, weight)
  const text = (weight: FontWeightName, fontSize: number, lineHeight: number, extra?: TextStyle): TextStyle => ({
    fontFamily: family(weight), fontSize, lineHeight, ...extra
  })
  return {
    display: text('extraBold', 36, 44, { letterSpacing: -0.7 }),
    hero: text('extraBold', 30, 38, { letterSpacing: -0.45 }),
    h1: text('bold', 26, 34, { letterSpacing: -0.25 }),
    h2: text('bold', 22, 29),
    h3: text('bold', 18, 25),
    title: text('semibold', 16, 23),
    body: text('regular', 15, 23),
    bodyMedium: text('medium', 15, 23),
    small: text('regular', 13, 19),
    smallMedium: text('medium', 13, 19),
    caption: text('medium', 12, 17),
    eyebrow: text('bold', 11, 16, { letterSpacing: 0.7 }),
    button: text('bold', 15, 20),
    numeric: text('extraBold', 32, 38, { letterSpacing: -0.7 })
  } as const
}

export function useAppTypography() {
  const { i18n } = useTranslation()
  return createTypography(i18n.language)
}
