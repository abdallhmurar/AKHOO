import { supabase } from '../lib/supabase'
import { isMissingDatabaseObject, throwIfError } from '../services/errors'
import type { SupportedLanguage } from './domainTypes'

export const deviceRepository = {
  async register(input: { userId: string; token: string; platform: string; locale: SupportedLanguage; enabled: boolean }) {
    const { error } = await supabase.from('devices').upsert({
      user_id: input.userId,
      expo_push_token: input.token,
      platform: input.platform,
      locale: input.locale,
      notifications_enabled: input.enabled,
      last_seen_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, { onConflict: 'expo_push_token' })
    if (error && isMissingDatabaseObject(error)) return
    throwIfError(error, { domain: 'devices', operation: 'register' })
  }
}
