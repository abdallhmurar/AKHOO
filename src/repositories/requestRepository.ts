import { filterNearbyRequests } from '../lib/nearbyRequests'
import { supabase } from '../lib/supabase'
import { throwIfError } from '../services/errors'
import type { HelpRequest } from '../types'

export const requestRepository = {
  async listForRequester(userId: string, limit = 50): Promise<HelpRequest[]> {
    const { data, error } = await supabase.from('help_requests').select('*').eq('requester_id', userId).order('created_at', { ascending: false }).limit(limit)
    throwIfError(error, { domain: 'requests', operation: 'list-requester' })
    return (data ?? []) as HelpRequest[]
  },

  async get(requestId: string): Promise<HelpRequest | null> {
    const { data, error } = await supabase.from('help_requests').select('*').eq('id', requestId).maybeSingle()
    throwIfError(error, { domain: 'requests', operation: 'get' })
    return data as HelpRequest | null
  },

  async listForHelper(userId: string, limit = 50): Promise<HelpRequest[]> {
    const { data, error } = await supabase.from('help_requests').select('*').eq('volunteer_id', userId).order('created_at', { ascending: false }).limit(limit)
    throwIfError(error, { domain: 'requests', operation: 'list-helper' })
    return (data ?? []) as HelpRequest[]
  },

  async listNearby(userId: string, at: { latitude: number; longitude: number }, radiusKm = 20) {
    const { data, error } = await supabase.from('help_requests').select('*').eq('status', 'open').order('created_at', { ascending: false }).limit(100)
    throwIfError(error, { domain: 'requests', operation: 'list-nearby' })
    return filterNearbyRequests((data ?? []) as HelpRequest[], userId, at, radiusKm)
  }
}
