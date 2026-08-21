import { useTranslation } from 'react-i18next'
import type { AppLanguage } from './i18n'

const RTL_LANGUAGES: AppLanguage[] = ['ar', 'he']

export function isRTLLanguage(language: string) {
  return RTL_LANGUAGES.includes(language as AppLanguage)
}

// Most direction-awareness in this app comes for free from `dir` on
// <html> plus Tailwind logical utilities (ps-*/pe-*/ms-*/me-*/text-start/
// text-end) - see admin/src/lib/i18n.ts's header comment for why
// flex-row-reverse is never used here. This hook exists for the few
// genuinely JS-level cases: picking a chevron/arrow icon's direction, or
// configuring a canvas/SVG library (Recharts, MapLibre) that doesn't read
// CSS `dir` on its own.
export function useIsRTL() {
  const { i18n } = useTranslation()
  return isRTLLanguage(i18n.language)
}
