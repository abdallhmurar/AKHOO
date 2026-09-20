import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase } from '../lib/supabase'
import { registerForPushNotificationsAsync } from '../lib/notifications'
import { getNotificationsEnabled } from '../lib/notificationPreference'
import { throwIfError } from './errors'

const TOKEN_KEY = 'akhoo_device_push_token'
// Serialize registration/disable/logout so a slow OS permission response
// cannot re-register a device after the user disabled notifications.
let queue: Promise<void> = Promise.resolve()
function serial(work: () => Promise<void>) {
  const next = queue.catch(() => {}).then(work)
  queue = next
  return next
}
export function syncPushRegistration(userId: string) {
  return serial(async () => {
    const enabled = await getNotificationsEnabled()
    const previous = await AsyncStorage.getItem(TOKEN_KEY)
    const token = enabled ? await registerForPushNotificationsAsync() : previous
    // Permissions may have been refused or revoked outside the app.
    if (!token) {
      if (previous) {
        const { error } = await supabase.rpc('unregister_push_device', { p_token: previous })
        throwIfError(error, { domain: 'profile', operation: 'disable-push' })
      }
      return
    }
    const { data } = await supabase.auth.getSession()
    if (data.session?.user.id !== userId) return
    if (previous && previous !== token) {
      const { error } = await supabase.rpc('unregister_push_device', { p_token: previous })
      throwIfError(error, { domain: 'profile', operation: 'replace-push-token' })
    }
    const { error } = await supabase.rpc('register_push_device', { p_token: token, p_enabled: enabled })
    throwIfError(error, { domain: 'profile', operation: 'register-push' })
    await AsyncStorage.setItem(TOKEN_KEY, token)
  })
}
export function unregisterCurrentDevice() {
  return serial(async () => {
    const token = await AsyncStorage.getItem(TOKEN_KEY)
    if (!token) return
    const { error } = await supabase.rpc('unregister_push_device', { p_token: token })
    throwIfError(error, { domain: 'profile', operation: 'unregister-push' })
    await AsyncStorage.removeItem(TOKEN_KEY)
  })
}
