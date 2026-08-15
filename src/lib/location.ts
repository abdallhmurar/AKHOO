import * as Location from 'expo-location'
import * as TaskManager from 'expo-task-manager'
import { supabase } from './supabase'

const BACKGROUND_LOCATION_TASK = 'sanad-background-location'

let backgroundUserId: string | null = null

TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  if (error || !data || !backgroundUserId) return
  const { locations } = data as { locations: Location.LocationObject[] }
  const last = locations[locations.length - 1]
  if (!last) return
  await supabase.from('volunteer_profiles').upsert({
    user_id: backgroundUserId,
    is_available: true,
    latitude: last.coords.latitude,
    longitude: last.coords.longitude,
    updated_at: new Date().toISOString()
  })
})

export async function startBackgroundLocationUpdates(userId: string) {
  backgroundUserId = userId
  const permission = await Location.requestBackgroundPermissionsAsync()
  if (permission.status !== 'granted') return false

  const alreadyStarted = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK).catch(() => false)
  if (alreadyStarted) return true

  await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
    accuracy: Location.Accuracy.Balanced,
    timeInterval: 30000,
    distanceInterval: 100,
    showsBackgroundLocationIndicator: true,
    foregroundService: {
      notificationTitle: 'سَنَد - أنت متاح كمتطوع',
      notificationBody: 'موقعك يتحدث حتى تشوف طلبات المساعدة القريبة، حتى لو التطبيق بالخلفية.'
    }
  })
  return true
}

export async function stopBackgroundLocationUpdates() {
  backgroundUserId = null
  const alreadyStarted = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK).catch(() => false)
  if (alreadyStarted) {
    await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK)
  }
}

export async function getCurrentCoords() {
  const permission = await Location.requestForegroundPermissionsAsync()
  if (permission.status !== 'granted') {
    throw new Error('لازم تسمح للتطبيق باستخدام الموقع حتى نقدر نكمل.')
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
