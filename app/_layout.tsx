import { Stack } from 'expo-router'
import { AppProviders, LaunchScreen, useAuth, useLanguageDirection } from '../src/providers'

export const unstable_settings = { initialRouteName: 'index' }

function RootNavigator() {
  const { session, loading, isRestricted } = useAuth()
  const { ready, isRTL } = useLanguageDirection()
  if (!ready || loading) return <LaunchScreen />
  const allowed = !!session && !isRestricted
  return (
    <Stack screenOptions={{ headerShown: false, animation: isRTL ? 'slide_from_left' : 'slide_from_right' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="restricted" options={{ gestureEnabled: false }} />
      <Stack.Protected guard={allowed}>
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        <Stack.Screen name="(requester)" />
        <Stack.Screen name="(helper)" />
        <Stack.Screen name="mission" />
        <Stack.Screen name="community" />
      </Stack.Protected>
    </Stack>
  )
}

export default function RootLayout() {
  return <AppProviders><RootNavigator /></AppProviders>
}
