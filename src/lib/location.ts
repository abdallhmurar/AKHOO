import * as Location from 'expo-location'
import * as TaskManager from 'expo-task-manager'
import { supabase } from './supabase'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'
import { CURRENT_MARKET_CODE } from './market'
import { getNearbyAlertConsent, supportsNearbyBackgroundAlerts } from './nearbyAlertPreference'
import { getNotificationsEnabled } from './notificationPreference'
import { hasNotificationPermission } from './notifications'

const BACKGROUND_LOCATION_TASK = 'sanad-background-location'

const BACKGROUND_USER_KEY = 'akhoo_background_location_user'
let locationQueue: Promise<unknown> = Promise.resolve()
function serializeLocation<T>(work: () => Promise<T>) {
  const next = locationQueue.catch(() => {}).then(work)
  locationQueue = next.catch(() => {})
  return next
}

TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  if (error || !data) return
  const { locations } = data as { locations: Location.LocationObject[] }
  const last = locations[locations.length - 1]
  if (!last) return
  // A transient network/DB failure here must not take down the background
  // task - a dropped update is recoverable on
  // the next tick as long as the task itself keeps running.
  try {
    const backgroundUserId = await AsyncStorage.getItem(BACKGROUND_USER_KEY)
    const { data: auth } = await supabase.auth.getSession()
    if (!backgroundUserId) { await stopBackgroundLocationUpdates(null); return }
    if (auth.session?.user.id !== backgroundUserId) { await stopBackgroundLocationUpdates(backgroundUserId); return }
    if (supportsNearbyBackgroundAlerts() && (await getNearbyAlertConsent(backgroundUserId) !== true || !await getNotificationsEnabled() || !await hasNotificationPermission())) {
      await stopBackgroundLocationUpdates(backgroundUserId)
      return
    }
    // Do not make an old queued fix look current when background execution resumes.
    if (!Number.isFinite(last.timestamp) || last.timestamp < Date.now() - 24 * 60 * 60 * 1000 || last.timestamp > Date.now() + 60_000) return
    // is_available is deliberately left out - it's now fully automatic
    // (0020_auto_volunteer_availability.sql), driven by whether the user has
    // an active request of their own. Forcing it true on every location
    // ping would fight that trigger the moment they request help for
    // themselves while this background task is still running.
    const { error: upsertError } = await supabase.from('volunteer_profiles').upsert({
      user_id: backgroundUserId,
      latitude: last.coords.latitude,
      longitude: last.coords.longitude,
      updated_at: new Date(last.timestamp).toISOString()
    })
    if (upsertError && __DEV__) console.warn('[background-location] upsert failed, will retry on next update')
  } catch {
    if (__DEV__) console.warn('[background-location] upsert threw, will retry on next update')
  }
})

export async function startBackgroundLocationUpdates(userId: string, notification: { title: string; body: string }, requestPermission = true) {
  // Existing Android binaries lack these permissions and the location service.
  // Only an explicitly configured new native build can start Android tracking.
  if (Platform.OS === 'web' || (Platform.OS === 'android' && !supportsNearbyBackgroundAlerts())) return false
  // In the new native build, the disclosure must be accepted before either
  // the helper screen or the global lifecycle may request background access.
  if (supportsNearbyBackgroundAlerts() && await getNearbyAlertConsent(userId) !== true) return false
  const permission = requestPermission ? await Location.requestBackgroundPermissionsAsync() : await Location.getBackgroundPermissionsAsync()
  if (permission.status !== 'granted') return false
  return serializeLocation(async () => {
    const { data: auth } = await supabase.auth.getSession()
    if (auth.session?.user.id !== userId) return false
    // The user may disable this feature or log out while the OS prompt is open.
    if (supportsNearbyBackgroundAlerts() && await getNearbyAlertConsent(userId) !== true) return false
    await AsyncStorage.setItem(BACKGROUND_USER_KEY, userId)

    const alreadyStarted = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK).catch(() => false)
    if (alreadyStarted) return true

    await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 120000,
      distanceInterval: 250,
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: notification.title,
        notificationBody: notification.body,
        killServiceOnDestroy: false
      }
    })
    return true
  })
}

export async function stopBackgroundLocationUpdates(expectedUserId?: string | null) {
  return serializeLocation(async () => {
    if (expectedUserId !== undefined && await AsyncStorage.getItem(BACKGROUND_USER_KEY) !== expectedUserId) return
    await AsyncStorage.removeItem(BACKGROUND_USER_KEY)
    if (Platform.OS === 'web') return
    const alreadyStarted = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK).catch(() => false)
    if (alreadyStarted) {
      await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK)
    }
  })
}

export async function getCurrentCoords() {
  const permission = await Location.requestForegroundPermissionsAsync()
  if (permission.status !== 'granted') {
    throw new Error('LOCATION_PERMISSION_DENIED')
  }

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced
  })

  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude
  }
}

export function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (value: number) => (value * Math.PI) / 180
  const earth = 6371
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return earth * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export type PilotZone = { center_lat: number; center_lng: number; radius_km: number }

export async function getActivePilotZones(): Promise<PilotZone[]> {
  const { data } = await supabase.from('pilot_zones').select('center_lat, center_lng, radius_km').eq('market', CURRENT_MARKET_CODE).eq('active', true)
  return (data ?? []) as PilotZone[]
}

export function isWithinAnyZone(lat: number, lng: number, zones: PilotZone[]) {
  return zones.some(zone => distanceKm(lat, lng, zone.center_lat, zone.center_lng) <= zone.radius_km)
}
