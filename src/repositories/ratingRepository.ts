import { supabase } from '../lib/supabase'
import { throwIfError } from '../services/errors'

export const ratingRepository = {
  async getForRequest(requestId: string): Promise<number | null> {
    const { data, error } = await supabase.from('mission_ratings').select('stars').eq('request_id', requestId).maybeSingle()
    throwIfError(error, { domain: 'rating', operation: 'get' })
    return (data as { stars: number } | null)?.stars ?? null
  },

  async submit(requestId: string, requesterId: string, helperId: string, stars: number) {
    const { error } = await supabase.from('mission_ratings').insert({ request_id: requestId, requester_id: requesterId, helper_id: helperId, stars })
    throwIfError(error, { domain: 'rating', operation: 'submit' })
  }
}
