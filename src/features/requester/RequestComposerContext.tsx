import AsyncStorage from '@react-native-async-storage/async-storage'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { PropsWithChildren } from 'react'
import type { AssistanceCategoryId, EmergencyScreening } from '../../domain/v2'
import type { RequestUrgency } from '../../repositories/domainTypes'

const STORAGE_KEY = 'sanad_v2_request_draft'

export type RequestDraftState = {
  screening: EmergencyScreening
  categoryId: AssistanceCategoryId | null
  scenarioId: string | null
  details: string
  urgency: RequestUrgency
  mediaUri: string | null
  mediaPath: string | null
  latitude: number | null
  longitude: number | null
  locationLabel: string
}

const initialState: RequestDraftState = {
  screening: { immediateDanger: false, medicalEmergency: false, fireOrViolence: false, childOrVulnerablePersonAtRisk: false },
  categoryId: null,
  scenarioId: null,
  details: '',
  urgency: 'standard',
  mediaUri: null,
  mediaPath: null,
  latitude: null,
  longitude: null,
  locationLabel: ''
}

type RequestComposerValue = {
  draft: RequestDraftState
  hydrated: boolean
  update: (patch: Partial<RequestDraftState>) => void
  updateScreening: (key: keyof EmergencyScreening, value: boolean) => void
  reset: () => Promise<void>
}

const RequestComposerContext = createContext<RequestComposerValue | null>(null)

export function RequestComposerProvider({ children }: PropsWithChildren) {
  const [draft, setDraft] = useState(initialState)
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(value => {
      if (value) {
        try { setDraft({ ...initialState, ...JSON.parse(value) }) } catch { /* discard malformed draft */ }
      }
    }).finally(() => setHydrated(true))
  }, [])
  useEffect(() => {
    if (hydrated) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(draft)).catch(() => {})
  }, [draft, hydrated])
  const update = useCallback((patch: Partial<RequestDraftState>) => setDraft(current => ({ ...current, ...patch })), [])
  const updateScreening = useCallback((key: keyof EmergencyScreening, value: boolean) => setDraft(current => ({ ...current, screening: { ...current.screening, [key]: value } })), [])
  const reset = useCallback(async () => { setDraft(initialState); await AsyncStorage.removeItem(STORAGE_KEY) }, [])
  const value = useMemo(() => ({ draft, hydrated, update, updateScreening, reset }), [draft, hydrated, update, updateScreening, reset])
  return <RequestComposerContext.Provider value={value}>{children}</RequestComposerContext.Provider>
}

export function useRequestComposer() {
  const context = useContext(RequestComposerContext)
  if (!context) throw new Error('useRequestComposer must be used inside RequestComposerProvider')
  return context
}
