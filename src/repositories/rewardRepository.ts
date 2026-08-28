import { supabase } from '../lib/supabase'
import { throwIfError } from '../services/errors'
import type { VolunteerPointTransaction } from '../types'

export const rewardRepository = {
  async points(userId: string) {
    const { data, error } = await supabase.from('volunteer_point_transactions').select('*').eq('volunteer_id', userId).order('created_at', { ascending: false })
    throwIfError(error, { domain: 'rewards', operation: 'points' })
    const transactions = (data ?? []) as VolunteerPointTransaction[]
    return { balance: transactions.reduce((total, row) => total + row.points, 0), transactions }
  }
}
