import { useTranslation } from 'react-i18next'
import type { TextStyle, ViewStyle } from 'react-native'

const RTL_LANGUAGES = new Set(['ar', 'he'])

export function useIsRTL() {
  const { i18n } = useTranslation()
  return RTL_LANGUAGES.has(i18n.language)
}

export function dirStyles(isRTL: boolean): {
  row: ViewStyle
  textStart: TextStyle
  textEnd: TextStyle
  alignStart: ViewStyle
  alignEnd: ViewStyle
} {
  return {
    row: { flexDirection: isRTL ? 'row-reverse' : 'row' },
    textStart: { textAlign: isRTL ? 'right' : 'left' },
    textEnd: { textAlign: isRTL ? 'left' : 'right' },
    alignStart: { alignItems: isRTL ? 'flex-end' : 'flex-start' },
    alignEnd: { alignItems: isRTL ? 'flex-start' : 'flex-end' }
  }
}
