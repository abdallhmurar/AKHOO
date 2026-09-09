import AsyncStorage from '@react-native-async-storage/async-storage'

const STORAGE_KEY = 'sanad_dark_mode_enabled'

export async function getDarkModeEnabled(): Promise<boolean> {
  const stored = await AsyncStorage.getItem(STORAGE_KEY)
  return stored === 'true'
}

export async function setDarkModeEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false')
}
