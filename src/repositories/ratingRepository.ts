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
  },

  // The helper's own rating of their experience on a mission (0038) -
  // separate from the row above, which is the requester rating the helper.
  async getHelperFeedbackForRequest(requestId: string): Promise<number | null> {
    const { data, error } = await supabase.from('mission_helper_feedback').select('stars').eq('request_id', requestId).maybeSingle()
    throwIfError(error, { domain: 'rating', operation: 'get-helper-feedback' })
    return (data as { stars: number } | null)?.stars ?? null
  },

  async submitHelperFeedback(requestId: string, helperId: string, stars: number) {
    const { error } = await supabase.from('mission_helper_feedback').insert({ request_id: requestId, helper_id: helperId, stars })
    throwIfError(error, { domain: 'rating', operation: 'submit-helper-feedback' })
  }
}
