import { supabase } from '../lib/supabase'
import { isMissingDatabaseObject, throwIfError } from '../services/errors'
import type { VolunteerPointTransaction } from '../types'
import type { Reward, RewardRedemption } from './domainTypes'

export const rewardRepository = {
  async catalog(market = 'IL'): Promise<Reward[]> {
    const { data, error } = await supabase.from('rewards').select('*').eq('market', market).eq('is_active', true).order('points_cost')
    if (error && isMissingDatabaseObject(error)) return []
    throwIfError(error, { domain: 'rewards', operation: 'catalog' })
    return (data ?? []) as Reward[]
  },

  async points(userId: string) {
    const [{ data, error }, redemptionResult] = await Promise.all([
      supabase.from('volunteer_point_transactions').select('*').eq('volunteer_id', userId).order('created_at', { ascending: false }),
      supabase.from('redemptions').select('points_spent,status').eq('user_id', userId)
    ])
    throwIfError(error, { domain: 'rewards', operation: 'points' })
    const transactions = (data ?? []) as VolunteerPointTransaction[]
    const spent = redemptionResult.error && isMissingDatabaseObject(redemptionResult.error)
      ? 0
      : (redemptionResult.data ?? []).filter(row => !['cancelled', 'expired'].includes(row.status)).reduce((total, row) => total + Number(row.points_spent), 0)
    if (redemptionResult.error && !isMissingDatabaseObject(redemptionResult.error)) throwIfError(redemptionResult.error, { domain: 'rewards', operation: 'points-spent' })
    return { balance: transactions.reduce((total, row) => total + row.points, 0) - spent, transactions }
  },

  async redemptions(userId: string): Promise<RewardRedemption[]> {
    const { data, error } = await supabase.from('redemptions').select('*').eq('user_id', userId).order('created_at', { ascending: false })
    if (error && isMissingDatabaseObject(error)) return []
    throwIfError(error, { domain: 'rewards', operation: 'redemptions' })
    return (data ?? []) as RewardRedemption[]
  },

  async redeem(rewardId: string): Promise<RewardRedemption> {
    const { data, error } = await supabase.rpc('redeem_reward', { p_reward_id: rewardId })
    throwIfError(error, { domain: 'rewards', operation: 'redeem' })
    return (Array.isArray(data) ? data[0] : data) as RewardRedemption
  }
}
