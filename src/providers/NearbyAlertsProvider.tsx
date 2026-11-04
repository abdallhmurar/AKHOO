import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react'
import { Alert, AppState, Linking } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useAuth } from './AuthProvider'
import { getNearbyAlertConsent, setNearbyAlertConsent, supportsNearbyBackgroundAlerts } from '../lib/nearbyAlertPreference'
import { getNearbyAlertCopy } from '../lib/nearbyAlertCopy'
import { disableNearbyAlerts, enableNearbyAlerts, refreshNearbyAlerts, type NearbyAlertState } from '../services/nearbyAlerts'
import { syncPushRegistration } from '../services/pushRegistration'
import { stopBackgroundLocationUpdates } from '../lib/location'

type Value = { supported: boolean; state: NearbyAlertState; busy: boolean; enable: () => void; disable: () => Promise<void>; refresh: () => void }
const Context = createContext<Value | null>(null)

export function NearbyAlertsProvider({ children }: PropsWithChildren) {
  const { session, status } = useAuth()
  const { i18n } = useTranslation()
  const userId = status === 'signed-in' ? session?.user.id : undefined
  const identity = useRef(userId)
  identity.current = userId
  const copy = getNearbyAlertCopy(i18n.language)
  const supported = supportsNearbyBackgroundAlerts()
  const [state, setState] = useState<NearbyAlertState>('off')
  const [busy, setBusy] = useState(false)
  const pending = useRef<string | null>(null)
  const notice = useMemo(() => ({ title: copy.backgroundTitle, body: copy.backgroundBody }), [copy])
  const refresh = useCallback(() => {
    if (!supported || !userId || pending.current === userId || AppState.currentState !== 'active') return
    void refreshNearbyAlerts(userId, notice).then(next => { if (identity.current === userId) setState(next) }).catch(() => {})
  }, [supported, userId, notice])
  const enable = useCallback(() => {
    if (!supported || !userId || pending.current === userId) return
    pending.current = userId
    const finish = () => { if (pending.current === userId) pending.current = null; if (identity.current === userId) setBusy(false) }
    Alert.alert(copy.title, copy.disclosure, [
      { text: copy.later, style: 'cancel', onPress: () => {
        if (identity.current === userId) void setNearbyAlertConsent(userId, false).catch(() => {})
        finish()
      } },
      { text: copy.enable, onPress: () => {
        if (identity.current !== userId) { finish(); return }
        setBusy(true)
        void enableNearbyAlerts(userId, notice).then(next => {
          if (identity.current !== userId) return
          setState(next)
          if (next === 'permission') Alert.alert(copy.setting, copy.permission, [
            { text: copy.cancel, style: 'cancel' },
            { text: copy.settings, onPress: () => { void Linking.openSettings().catch(() => {}) } }
          ])
        }).catch(() => {
          if (identity.current === userId) Alert.alert(copy.setting, copy.failure)
        }).finally(finish)
      } }
    ], { cancelable: false })
  }, [supported, userId, copy, notice])
  const disable = useCallback(async () => {
    if (!userId || pending.current === userId) return
    setBusy(true)
    pending.current = userId
    try {
      const next = await disableNearbyAlerts(userId)
      if (identity.current === userId) setState(next)
    } catch {
      if (identity.current === userId) { setState('off'); Alert.alert(copy.setting, copy.disableFailure) }
    } finally { if (pending.current === userId) pending.current = null; if (identity.current === userId) setBusy(false) }
  }, [userId, copy])
  useEffect(() => {
    // Also cover expired sessions, account switches and account restriction,
    // not just an explicit tap on Sign out. Do not stop a new account's task.
    if (!supported || !userId) return
    return () => { void stopBackgroundLocationUpdates(userId).catch(() => {}) }
  }, [supported, userId])
  useEffect(() => {
    setState('off')
    setBusy(false)
    if (!supported || !userId) return
    let active = true
    void getNearbyAlertConsent(userId).then(async consent => {
      if (!active) return
      if (consent === null) {
        // Let the existing notification-permission flow finish before showing
        // the separate location disclosure; never stack OS permission dialogs.
        await syncPushRegistration(userId)
        if (active && AppState.currentState === 'active') enable()
      } else refresh()
    }).catch(() => {})
    const subscription = AppState.addEventListener('change', next => { if (next === 'active') refresh() })
    const interval = setInterval(refresh, 5 * 60 * 1000)
    return () => { active = false; subscription.remove(); clearInterval(interval) }
  }, [supported, userId, enable, refresh])
  const value = useMemo(() => ({ supported, state, busy, enable, disable, refresh }), [supported, state, busy, enable, disable, refresh])
  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function useNearbyAlerts() {
  const value = useContext(Context)
  if (!value) throw new Error('NearbyAlertsProvider is required')
  return value
}
