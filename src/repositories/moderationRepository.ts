import { supabase } from '../lib/supabase'
import { throwIfError } from '../services/errors'

export const moderationRepository = {
  async reportRequest(requestId: string, reporterId: string, reason: string, details: string) {
    const { error } = await supabase.from('reports').insert({ reporter_id: reporterId, target_type: 'request', target_id: requestId, reason: reason.trim(), details: details.trim() || null })
    throwIfError(error, { domain: 'moderation', operation: 'report' })
  },
  async isBlocked(otherId: string) {
    const { data, error } = await supabase.rpc('is_blocked_with', { p_other: otherId })
    throwIfError(error, { domain: 'moderation', operation: 'read-block' })
    return data === true
  },
  async block(blockerId: string, blockedId: string) {
    const { error } = await supabase.from('user_blocks').upsert({ blocker_id: blockerId, blocked_id: blockedId }, { onConflict: 'blocker_id,blocked_id', ignoreDuplicates: true })
    throwIfError(error, { domain: 'moderation', operation: 'block' })
  },
  async unblock(blockerId: string, blockedId: string) {
    const { error } = await supabase.from('user_blocks').delete().eq('blocker_id', blockerId).eq('blocked_id', blockedId)
    throwIfError(error, { domain: 'moderation', operation: 'unblock' })
  }
}
