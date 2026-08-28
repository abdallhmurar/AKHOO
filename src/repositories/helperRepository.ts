import { supabase } from '../lib/supabase'
import { throwIfError } from '../services/errors'
import type { VolunteerProfile } from '../types'

export const helperRepository = {
  async getProfile(userId: string): Promise<VolunteerProfile | null> {
    const { data, error } = await supabase.from('volunteer_profiles').select('*').eq('user_id', userId).maybeSingle()
    throwIfError(error, { domain: 'helpers', operation: 'get-profile' })
    return data as VolunteerProfile | null
  },

  async setAvailability(userId: string, available: boolean, location?: { latitude: number; longitude: number }, pushToken?: string | null) {
    const payload: Record<string, unknown> = {
      user_id: userId,
      is_available: available,
      updated_at: new Date().toISOString()
    }
    if (location) {
      payload.latitude = location.latitude
      payload.longitude = location.longitude
    }
    if (pushToken) payload.push_token = pushToken
    const { error } = await supabase.from('volunteer_profiles').upsert(payload)
    throwIfError(error, { domain: 'helpers', operation: 'set-availability' })
  },

  async heartbeat(userId: string, location?: { latitude: number; longitude: number }) {
    const changes: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (location) Object.assign(changes, location)
    const { error } = await supabase.from('volunteer_profiles').update(changes).eq('user_id', userId)
    throwIfError(error, { domain: 'helpers', operation: 'heartbeat', silent: true })
  }
}
