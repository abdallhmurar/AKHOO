// Push notifications need a native device (and a dev-client/standalone
// build) - there's nothing to register on the web preview, and
// expo-notifications doesn't fully support web bundling anyway.
// The web preview has no notification sounds to report.
export const DEVICE_SOUND_PACK = 0

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  return null
}
export function subscribeToNotificationNavigation(_listener: (data: Record<string, unknown>) => void) {
  return () => {}
}
