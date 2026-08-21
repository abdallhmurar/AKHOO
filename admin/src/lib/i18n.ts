// Mirrors ../../../src/lib/i18n.ts's pattern (same three languages, same
// detectDeviceLanguage()/RTL approach via document.documentElement.dir) but
// persists via localStorage directly instead of AsyncStorage - this is a
// pure web app, no React Native. Uses a distinct storage key
// ('sanad_admin_language') from the mobile web build's 'sanad_language' so
// the two apps' language prefs never collide in the same browser profile.
//
// RTL note: the double-reversal bug documented in the mobile app's
// direction.ts was specifically RN's flexDirection:'row-reverse' stacked on
// top of the browser's own ambient `dir=rtl` mirroring of a plain 'row' -
// that literal shape can't occur here (no flexDirection style objects, no
// I18nManager). The same root cause (stacking two independent RTL-mirroring
// mechanisms) is avoided as a hard convention throughout this app instead:
// never use `flex-row-reverse` / `rtl:flex-row-reverse` anywhere, rely on
// `dir` on <html> plus Tailwind's logical utilities (ps-*/pe-*/ms-*/me-*/
// text-start/text-end/start-*/end-*) for all mirroring.
import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import ar from '../locales/ar.json'
import he from '../locales/he.json'
import en from '../locales/en.json'

export type AppLanguage = 'ar' | 'he' | 'en'
const SUPPORTED_LANGUAGES: AppLanguage[] = ['ar', 'he', 'en']
const STORAGE_KEY = 'sanad_admin_language'

function detectDeviceLanguage(): AppLanguage {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale.toLowerCase()
    const match = SUPPORTED_LANGUAGES.find(lang => locale.startsWith(lang))
    return match ?? 'ar'
  } catch {
    return 'ar'
  }
}

function applyDocumentDirection(language: AppLanguage) {
  document.documentElement.dir = language === 'en' ? 'ltr' : 'rtl'
  document.documentElement.lang = language
}

export function initI18n() {
  const stored = localStorage.getItem(STORAGE_KEY)
  const initialLanguage: AppLanguage = stored && SUPPORTED_LANGUAGES.includes(stored as AppLanguage)
    ? (stored as AppLanguage)
    : detectDeviceLanguage()

  i18next.use(initReactI18next).init({
    resources: { ar: { translation: ar }, he: { translation: he }, en: { translation: en } },
    lng: initialLanguage,
    fallbackLng: 'ar',
    interpolation: { escapeValue: false }
  })

  applyDocumentDirection(initialLanguage)
}

export function setAppLanguage(language: AppLanguage) {
  i18next.changeLanguage(language)
  localStorage.setItem(STORAGE_KEY, language)
  applyDocumentDirection(language)
}

export { i18next }
