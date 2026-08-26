import AsyncStorage from '@react-native-async-storage/async-storage'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { PropsWithChildren } from 'react'
import { I18nextProvider } from 'react-i18next'
import { i18next, initI18n, setAppLanguage, type AppLanguage } from '../lib/i18n'

const SELECTION_KEY = 'sanad_v2_language_selected'

type LanguageDirectionContextValue = {
  language: AppLanguage
  isRTL: boolean
  direction: 'rtl' | 'ltr'
  hasSelectedLanguage: boolean
  ready: boolean
  setLanguage: (language: AppLanguage, confirmSelection?: boolean) => Promise<void>
  completeLanguageSelection: () => Promise<void>
}

const LanguageDirectionContext = createContext<LanguageDirectionContextValue | null>(null)

export function LanguageDirectionProvider({ children }: PropsWithChildren) {
  const [ready, setReady] = useState(false)
  const [language, setLanguageState] = useState<AppLanguage>('ar')
  const [hasSelectedLanguage, setHasSelectedLanguage] = useState(false)

  useEffect(() => {
    let active = true
    Promise.all([
      i18next.isInitialized ? Promise.resolve() : initI18n(),
      AsyncStorage.getItem(SELECTION_KEY)
    ]).then(([, selected]) => {
      if (!active) return
      setLanguageState((i18next.language?.slice(0, 2) as AppLanguage) ?? 'ar')
      setHasSelectedLanguage(selected === 'true')
      setReady(true)
    }).catch(() => {
      if (active) setReady(true)
    })
    const onLanguageChanged = (next: string) => setLanguageState((next.slice(0, 2) as AppLanguage) ?? 'ar')
    i18next.on('languageChanged', onLanguageChanged)
    return () => { active = false; i18next.off('languageChanged', onLanguageChanged) }
  }, [])

  const setLanguage = useCallback(async (next: AppLanguage, confirmSelection = false) => {
    await setAppLanguage(next)
    setLanguageState(next)
    if (confirmSelection) {
      await AsyncStorage.setItem(SELECTION_KEY, 'true')
      setHasSelectedLanguage(true)
    }
  }, [])

  const completeLanguageSelection = useCallback(async () => {
    await AsyncStorage.setItem(SELECTION_KEY, 'true')
    setHasSelectedLanguage(true)
  }, [])

  const value = useMemo<LanguageDirectionContextValue>(() => ({
    language,
    isRTL: language !== 'en',
    direction: language === 'en' ? 'ltr' : 'rtl',
    hasSelectedLanguage,
    ready,
    setLanguage,
    completeLanguageSelection
  }), [language, hasSelectedLanguage, ready, setLanguage, completeLanguageSelection])

  return <I18nextProvider i18n={i18next}><LanguageDirectionContext.Provider value={value}>{children}</LanguageDirectionContext.Provider></I18nextProvider>
}

export function useLanguageDirection() {
  const context = useContext(LanguageDirectionContext)
  if (!context) throw new Error('useLanguageDirection must be used inside LanguageDirectionProvider')
  return context
}
