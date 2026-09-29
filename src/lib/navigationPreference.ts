import { useCallback, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useFocusEffect } from 'expo-router'
import type { NavigationApp } from './contactLinks'

const STORAGE_KEY = 'sanad_navigation_app'

// Waze is the default for anyone who hasn't picked yet - it's the more
// widely used driving app in this app's market. Google Maps stays one tap
// away in Account > Navigation App for whoever prefers it.
export async function getNavigationApp(): Promise<NavigationApp> {
  const stored = await AsyncStorage.getItem(STORAGE_KEY)
  return stored === 'google' ? 'google' : 'waze'
}

export async function setNavigationApp(app: NavigationApp): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, app)
}

// Re-reads on focus, not just on mount - a long-lived screen like the
// active mission tracker can stay mounted underneath Settings while the
// user switches the app there, so a plain mount-only read would go stale
// until the screen remounts. Same convention as chatReadTracker's
// focus-driven refresh for the chat unread badge.
export function useNavigationApp(): NavigationApp {
  const [app, setApp] = useState<NavigationApp>('waze')
  useFocusEffect(useCallback(() => {
    getNavigationApp().then(setApp)
  }, []))
  return app
}
