import AsyncStorage from '@react-native-async-storage/async-storage'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { PropsWithChildren } from 'react'
import type { SupportedLanguage } from '../../repositories/domainTypes'

const KEY = 'sanad_v2_helper_setup_draft'
type SetupState = { categoryIds: string[]; languages: SupportedLanguage[] }
const initial: SetupState = { categoryIds: [], languages: [] }
type SetupContextValue = { setup: SetupState; setCategories: (ids: string[]) => void; setLanguages: (languages: SupportedLanguage[]) => void; reset: () => Promise<void> }
const SetupContext = createContext<SetupContextValue | null>(null)

export function HelperSetupProvider({ children }: PropsWithChildren) {
  const [setup, setSetup] = useState(initial)
  const [ready, setReady] = useState(false)
  useEffect(() => { AsyncStorage.getItem(KEY).then(value => { if (value) { try { setSetup({ ...initial, ...JSON.parse(value) }) } catch {} } }).finally(() => setReady(true)) }, [])
  useEffect(() => { if (ready) AsyncStorage.setItem(KEY, JSON.stringify(setup)).catch(() => {}) }, [setup, ready])
  const value = useMemo<SetupContextValue>(() => ({ setup, setCategories: categoryIds => setSetup(current => ({ ...current, categoryIds })), setLanguages: languages => setSetup(current => ({ ...current, languages })), reset: async () => { setSetup(initial); await AsyncStorage.removeItem(KEY) } }), [setup])
  return <SetupContext.Provider value={value}>{children}</SetupContext.Provider>
}

export function useHelperSetup() {
  const context = useContext(SetupContext)
  if (!context) throw new Error('useHelperSetup must be used inside HelperSetupProvider')
  return context
}
