import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import ar from '../locales/ar.json'
import he from '../locales/he.json'
import en from '../locales/en.json'

export type AppLanguage = 'ar' | 'he' | 'en'
const SUPPORTED_LANGUAGES: AppLanguage[] = ['ar', 'he', 'en']
const STORAGE_KEY = 'sanad_language'

export function detectDeviceLanguage(): AppLanguage {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale.toLowerCase()
    const match = SUPPORTED_LANGUAGES.find(lang => locale.startsWith(lang))
    return match ?? 'ar'
  } catch {
    return 'ar'
  }
}

function applyWebDocumentDirection(language: AppLanguage) {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return
  document.documentElement.dir = language === 'en' ? 'ltr' : 'rtl'
  document.documentElement.lang = language
}

export async function getPreferredAppLanguage(): Promise<AppLanguage> {
  const stored = await AsyncStorage.getItem(STORAGE_KEY)
  return (stored && SUPPORTED_LANGUAGES.includes(stored as AppLanguage))
    ? (stored as AppLanguage)
    : detectDeviceLanguage()
}

export async function initI18n() {
  const initialLanguage = await getPreferredAppLanguage()

  await i18next.use(initReactI18next).init({
    resources: { ar: { translation: ar }, he: { translation: he }, en: { translation: en } },
    lng: initialLanguage,
    fallbackLng: 'ar',
    interpolation: { escapeValue: false }
  })

  applyWebDocumentDirection(initialLanguage)
}

export async function setAppLanguage(language: AppLanguage) {
  await i18next.changeLanguage(language)
  await AsyncStorage.setItem(STORAGE_KEY, language)
  applyWebDocumentDirection(language)
}

export { i18next }
