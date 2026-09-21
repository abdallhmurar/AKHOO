import { Stack, useRouter } from 'expo-router'
import { useEffect } from 'react'
import { subscribeToNotificationNavigation } from '../src/lib/notifications'
import { notificationRoute } from '../src/lib/notificationRoute'
import { AppProviders, LaunchScreen, useAuth, useLanguageDirection } from '../src/providers'
import { AnnouncementHost } from '../src/features/announcements/AnnouncementHost'

export const unstable_settings = { initialRouteName: 'index' }

function RootNavigator() {
  const { session, loading, isRestricted } = useAuth()
  const { ready, isRTL } = useLanguageDirection()
  const router = useRouter()
  const userId = session?.user.id
  useEffect(() => {
    if (!ready || loading || !userId || isRestricted) return
    return subscribeToNotificationNavigation(data => {
      const route = notificationRoute(data)
      if (route) router.push(route)
    })
  }, [ready, loading, userId, isRestricted, router])
  if (!ready || loading) return <LaunchScreen />
  const allowed = !!session && !isRestricted
  return (
    <>
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
        <Stack.Screen name="announcements" />
        <Stack.Screen name="support-chat" />
      </Stack.Protected>
    </Stack>
    {allowed ? <AnnouncementHost /> : null}
    </>
  )
}

export default function RootLayout() {
  return <AppProviders><RootNavigator /></AppProviders>
}
