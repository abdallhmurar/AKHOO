import * as Location from 'expo-location'
import { supabase } from '../lib/supabase'
import { getNotificationsEnabled } from '../lib/notificationPreference'
import { getNearbyAlertConsent, setNearbyAlertConsent, supportsNearbyBackgroundAlerts, getNearbyOptOutPending, setNearbyOptOutPending } from '../lib/nearbyAlertPreference'
import { startBackgroundLocationUpdates, stopBackgroundLocationUpdates } from '../lib/location'
import { buildAvailableUpsertPayload } from '../lib/volunteerAvailability'
import { syncPushRegistration } from './pushRegistration'
import { hasNotificationPermission } from '../lib/notifications'

export type NearbyAlertState = 'off' | 'on' | 'permission'
type Notification = { title: string; body: string }
let queue: Promise<unknown> = Promise.resolve()
const versions = new Map<string, number>()
function serial<T>(work: () => Promise<T>) {
  const next = queue.catch(() => {}).then(work)
  queue = next.catch(() => {})
  return next
}
async function current(userId: string) {
  const { data } = await supabase.auth.getSession()
  return data.session?.user.id === userId
}
async function savePosition(userId: string, active: () => boolean = () => true) {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    const fix = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('LOCATION_TIMEOUT')), 25_000) })
    ])
    if (!active() || !await current(userId)) throw new Error('ACCOUNT_CHANGED')
    const { error } = await supabase.from('volunteer_profiles').upsert(buildAvailableUpsertPayload(userId, fix.coords, null))
    if (error) throw error
  } finally { clearTimeout(timer) }
}
async function setRequestPreference(enabled: boolean) {
  const { error } = await supabase.rpc('set_my_notification_preferences', { p_prefs: { requests: enabled } })
  if (error) throw error
}

// Called only after the visible disclosure is accepted. A general account can
// enroll from Home or Account without ever mounting the helper screen.
export function enableNearbyAlerts(userId: string, notification: Notification) {
  const version = (versions.get(userId) ?? 0) + 1
  versions.set(userId, version)
  const active = () => versions.get(userId) === version
  return serial(async (): Promise<NearbyAlertState> => {
    if (!supportsNearbyBackgroundAlerts() || !active() || !await current(userId)) return 'off'
    if (!await getNotificationsEnabled() || !await syncPushRegistration(userId)) return 'permission'
    const foreground = await Location.requestForegroundPermissionsAsync()
    if (foreground.status !== 'granted' || !active() || !await current(userId)) return 'permission'
    await setNearbyAlertConsent(userId, true)
    try {
      // Starting this service is a direct continuation of the user's action.
      if (!await startBackgroundLocationUpdates(userId, notification)) {
        await setNearbyAlertConsent(userId, false)
        return 'permission'
      }
      await savePosition(userId, active)
      if (!active() || !await current(userId)) throw new Error('ACCOUNT_CHANGED')
      await setRequestPreference(true)
      await setNearbyOptOutPending(userId, false)
      return 'on'
    } catch (error) {
      await setNearbyAlertConsent(userId, false)
      await stopBackgroundLocationUpdates(userId).catch(() => {})
      throw error
    }
  })
}
export function disableNearbyAlerts(userId: string) {
  versions.set(userId, (versions.get(userId) ?? 0) + 1)
  // Revoke the local consent immediately; a headless task cannot keep uploading
  // while a slower enable operation or network request finishes.
  const revoke = Promise.all([setNearbyAlertConsent(userId, false), setNearbyOptOutPending(userId, true)])
  // The serialized queue may still be waiting for an OS permission dialog.
  void revoke.catch(() => {})
  return serial(async (): Promise<NearbyAlertState> => {
    await revoke
    await setNearbyAlertConsent(userId, false)
    if (await current(userId)) {
      await stopBackgroundLocationUpdates(userId)
      await setRequestPreference(false)
      await setNearbyOptOutPending(userId, false)
    }
    return 'off'
  })
}
export function refreshNearbyAlerts(userId: string, notification: Notification) {
  const version = versions.get(userId)
  const active = () => versions.get(userId) === version
  return serial(async (): Promise<NearbyAlertState> => {
    if (!supportsNearbyBackgroundAlerts() || !active() || !await current(userId)) return 'off'
    const consent = await getNearbyAlertConsent(userId)
    if (consent !== true) {
      // GPS stops locally even offline. Retry a failed server opt-out on the
      // next foreground/resume tick so alerts do not silently stay enabled.
      if (await getNearbyOptOutPending(userId) && active() && await current(userId)) {
        await stopBackgroundLocationUpdates(userId)
        await setRequestPreference(false)
        await setNearbyOptOutPending(userId, false)
      }
      return 'off'
    }
    const [foreground, background, enabled, pushAllowed] = await Promise.all([
      Location.getForegroundPermissionsAsync(), Location.getBackgroundPermissionsAsync(), getNotificationsEnabled(), hasNotificationPermission()
    ])
    if (!active() || !await current(userId)) return 'off'
    if (!enabled || !pushAllowed || foreground.status !== 'granted' || background.status !== 'granted') {
      await stopBackgroundLocationUpdates(userId)
      return 'permission'
    }
    // Refreshing/restarting never prompts for permissions. Resume runs in the
    // foreground; the OS task owns updates while the UI is not open.
    if (!await startBackgroundLocationUpdates(userId, notification, false)) return 'permission'
    await savePosition(userId, active)
    return 'on'
  })
}
