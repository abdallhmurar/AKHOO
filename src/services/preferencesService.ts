import AsyncStorage from '@react-native-async-storage/async-storage'

export type LocalPreferences = {
  notifications: boolean
  missionUpdates: boolean
  communityUpdates: boolean
  offers: boolean
  reduceMotion: boolean
  highContrast: boolean
  largerText: boolean
}

const KEY = 'sanad_v2_local_preferences'
export const defaultPreferences: LocalPreferences = {
  notifications: true,
  missionUpdates: true,
  communityUpdates: true,
  offers: false,
  reduceMotion: false,
  highContrast: false,
  largerText: false
}

export const preferencesService = {
  async get(): Promise<LocalPreferences> {
    const value = await AsyncStorage.getItem(KEY)
    if (!value) return defaultPreferences
    try { return { ...defaultPreferences, ...JSON.parse(value) } } catch { return defaultPreferences }
  },
  async save(preferences: LocalPreferences) {
    await AsyncStorage.setItem(KEY, JSON.stringify(preferences))
  }
}
