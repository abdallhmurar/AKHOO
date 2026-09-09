import AsyncStorage from '@react-native-async-storage/async-storage'

const STORAGE_KEY = 'sanad_notifications_enabled'

export async function getNotificationsEnabled(): Promise<boolean> {
  const stored = await AsyncStorage.getItem(STORAGE_KEY)
  return stored !== 'false'
}

export async function setNotificationsEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false')
}
