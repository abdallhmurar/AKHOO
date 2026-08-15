// Push notifications need a native device (and a dev-client/standalone
// build) - there's nothing to register on the web preview, and
// expo-notifications doesn't fully support web bundling anyway.
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  return null
}
