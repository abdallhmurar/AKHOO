import { supabase } from '../lib/supabase'
import { throwIfError } from '../services/errors'
import type { VolunteerProfile } from '../types'

export const helperRepository = {
  async getProfile(userId: string): Promise<VolunteerProfile | null> {
    const { data, error } = await supabase.from('volunteer_profiles').select('*').eq('user_id', userId).maybeSingle()
    throwIfError(error, { domain: 'helpers', operation: 'get-profile' })
    return data as VolunteerProfile | null
  },

  async heartbeat(userId: string, location?: { latitude: number; longitude: number }) {
    const changes: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (location) Object.assign(changes, location)
    const { error } = await supabase.from('volunteer_profiles').update(changes).eq('user_id', userId)
    throwIfError(error, { domain: 'helpers', operation: 'heartbeat', silent: true })
  }
}
