import AsyncStorage from '@react-native-async-storage/async-storage'
import Constants from 'expo-constants'
import { Platform } from 'react-native'

// A native capability flag: never enable this through an OTA to an Android
// binary which lacks the background permission and foreground location service.
export const supportsNearbyBackgroundAlerts = () => Platform.OS !== 'web' && Constants.expoConfig?.extra?.nearbyBackgroundAlerts === true
const key = (userId: string) => `akhoo_nearby_alerts_consent:${userId}`
export async function getNearbyAlertConsent(userId: string): Promise<boolean | null> {
  const value = await AsyncStorage.getItem(key(userId))
  return value === null ? null : value === 'true'
}
export async function setNearbyAlertConsent(userId: string, enabled: boolean) {
  await AsyncStorage.setItem(key(userId), String(enabled))
}
export async function getNearbyOptOutPending(userId: string) {
  return await AsyncStorage.getItem(`akhoo_nearby_opt_out_pending:${userId}`) === 'true'
}
export async function setNearbyOptOutPending(userId: string, pending: boolean) {
  await AsyncStorage.setItem(`akhoo_nearby_opt_out_pending:${userId}`, String(pending))
}
