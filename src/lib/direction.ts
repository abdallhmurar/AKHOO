import { useTranslation } from 'react-i18next'
import { Platform } from 'react-native'
import type { TextStyle, ViewStyle } from 'react-native'

const RTL_LANGUAGES = new Set(['ar', 'he'])

export function isRTLLanguage(language: string) {
  return RTL_LANGUAGES.has(language.slice(0, 2))
}

export function useIsRTL() {
  const { i18n } = useTranslation()
  return isRTLLanguage(i18n.language)
}

export function dirStyles(isRTL: boolean): {
  row: ViewStyle
  textStart: TextStyle
  textEnd: TextStyle
  alignStart: ViewStyle
  alignEnd: ViewStyle
} {
  // On web, src/lib/i18n.ts sets document.documentElement.dir to 'rtl'/
  // 'ltr' - CSS flexbox's `row` axis is direction-aware per spec, so the
  // browser already visually mirrors a plain `row` once that ambient
  // direction is 'rtl'. Applying row-reverse on top of that (confirmed via
  // computed styles: flex-direction: row-reverse + direction: rtl together
  // cancel out) silently renders every RTL row back in LTR visual order on
  // web only - e.g. the bottom tab bar's items land in the same left-to-
  // right order as English. Native has no such ambient mirroring (this app
  // intentionally never touches I18nManager), so row-reverse is still the
  // only way to get correct RTL ordering there.
  const mirrorRow = isRTL && Platform.OS !== 'web'
  return {
    row: { flexDirection: mirrorRow ? 'row-reverse' : 'row' },
    textStart: { textAlign: isRTL ? 'right' : 'left' },
    textEnd: { textAlign: isRTL ? 'left' : 'right' },
    alignStart: { alignItems: isRTL ? 'flex-end' : 'flex-start' },
    alignEnd: { alignItems: isRTL ? 'flex-start' : 'flex-end' }
  }
}
