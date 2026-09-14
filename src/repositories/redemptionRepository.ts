import { supabase } from '../lib/supabase'
import { throwIfError } from '../services/errors'
import type { OfferRedemption } from '../types'

export const redemptionRepository = {
  async create(offerId: string): Promise<OfferRedemption> {
    const { data, error } = await supabase.rpc('create_offer_redemption', { p_offer_id: offerId })
    throwIfError(error, { domain: 'redemptions', operation: 'create' })
    return data as OfferRedemption
  },

  async cancel(id: string): Promise<void> {
    const { error } = await supabase.rpc('cancel_offer_redemption', { p_id: id })
    throwIfError(error, { domain: 'redemptions', operation: 'cancel' })
  },

  async mine(userId: string): Promise<OfferRedemption[]> {
    const { data, error } = await supabase.from('offer_redemptions').select('*').eq('user_id', userId).order('created_at', { ascending: false })
    throwIfError(error, { domain: 'redemptions', operation: 'mine' })
    return (data ?? []) as OfferRedemption[]
  }
}
