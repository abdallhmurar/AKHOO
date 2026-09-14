import { supabase } from '../lib/supabase'
import { throwIfError } from '../services/errors'
import type { VolunteerPointTransaction } from '../types'

export const rewardRepository = {
  async points(userId: string) {
    const [{ data, error }, { data: balanceData, error: balanceError }] = await Promise.all([
      supabase.from('volunteer_point_transactions').select('*').eq('volunteer_id', userId).order('created_at', { ascending: false }),
      supabase.rpc('get_points_balance', { p_user_id: userId })
    ])
    throwIfError(error, { domain: 'rewards', operation: 'points' })
    throwIfError(balanceError, { domain: 'rewards', operation: 'points-balance' })
    const transactions = (data ?? []) as VolunteerPointTransaction[]
    // Real spendable balance (earned minus currently-held/spent offer
    // redemptions - see get_points_balance in 0022_offer_redemptions.sql),
    // not just the sum of earned transactions.
    return { balance: (balanceData as number | null) ?? 0, transactions }
  }
}
