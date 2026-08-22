import { Platform } from 'react-native'
import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import Constants from 'expo-constants'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false
  })
})

// The caller (VolunteerScreen's toggleAvailability) deliberately never lets
// a push-registration failure block turning availability on - that's
// correct and stays unchanged. What was missing: every failure path here
// returned null silently, so a real device with no token ever reaching
// volunteer_profiles.push_token was indistinguishable from "nothing went
// wrong, there's just nothing to log." These console calls make the actual
// reason visible in the dev-client/Metro log without changing behavior or
// logging anything secret (never the token value itself, only its length).
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn('[push] skipped: not a physical device')
    return null
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.HIGH
    })
  }

  const existing = await Notifications.getPermissionsAsync()
  let status = existing.status
  if (status !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync()
    status = requested.status
  }
  if (status !== 'granted') {
    console.warn('[push] skipped: notification permission not granted (status =', status, ')')
    return null
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId
  if (!projectId) {
    console.warn('[push] skipped: no EAS projectId found in Constants.expoConfig.extra.eas')
    return null
  }

  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId })
    console.log('[push] registered a token, length =', token?.length ?? 0)
    return token
  } catch (error) {
    // The most common real-world cause of a throw here (as opposed to the
    // permission/projectId checks above, which are already ruled out by
    // this point): the EAS project has no Android FCM push credentials
    // uploaded yet (`eas credentials -p android`) - Expo's push token
    // service can't issue a token without them. Logged, not guessed.
    console.warn('[push] getExpoPushTokenAsync failed:', error instanceof Error ? error.message : String(error))
    return null
  }
}
