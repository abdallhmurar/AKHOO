import { supabase } from '../lib/supabase'
import { throwIfError } from '../services/errors'
import type { MissionRating, SafetyReport, UserBlock } from './domainTypes'

export const safetyRepository = {
  async blocks(userId: string): Promise<UserBlock[]> {
    const { data, error } = await supabase.from('blocks').select('*').eq('blocker_id', userId).order('created_at', { ascending: false })
    throwIfError(error, { domain: 'safety', operation: 'list-blocks' })
    return (data ?? []) as UserBlock[]
  },

  async unblock(blockedUserId: string) {
    const { error } = await supabase.from('blocks').delete().eq('blocked_user_id', blockedUserId)
    throwIfError(error, { domain: 'safety', operation: 'unblock' })
  },
  async rate(input: { missionId: string; subjectId: string; score: number; comment?: string; tags?: string[] }): Promise<MissionRating> {
    const { data, error } = await supabase.rpc('submit_mission_rating', {
      p_mission_id: input.missionId,
      p_subject_id: input.subjectId,
      p_score: input.score,
      p_comment: input.comment?.trim() || null,
      p_tags: input.tags ?? []
    })
    throwIfError(error, { domain: 'safety', operation: 'rate' })
    return (Array.isArray(data) ? data[0] : data) as MissionRating
  },

  async report(input: { missionId?: string | null; reportedUserId?: string | null; category: string; details?: string }): Promise<SafetyReport> {
    const { data, error } = await supabase.rpc('submit_safety_report', {
      p_mission_id: input.missionId ?? null,
      p_reported_user_id: input.reportedUserId ?? null,
      p_category: input.category,
      p_details: input.details?.trim() || null
    })
    throwIfError(error, { domain: 'safety', operation: 'report' })
    return (Array.isArray(data) ? data[0] : data) as SafetyReport
  },

  async block(blockedUserId: string, reason?: string): Promise<UserBlock> {
    const { data, error } = await supabase.rpc('block_user', { p_blocked_user_id: blockedUserId, p_reason: reason?.trim() || null })
    throwIfError(error, { domain: 'safety', operation: 'block' })
    return (Array.isArray(data) ? data[0] : data) as UserBlock
  },

  async dispute(missionId: string, details?: string) {
    const { error } = await supabase.rpc('dispute_mission', { p_mission_id: missionId, p_details: details?.trim() || null })
    throwIfError(error, { domain: 'safety', operation: 'dispute' })
  }
}
