import { realtimeSubscription } from '../lib/realtimeSubscription'
import { supabase } from '../lib/supabase'
import { isMissingDatabaseObject, normalizeAppError, throwIfError } from '../services/errors'
import type { HelpRequest } from '../types'
import type { Mission, MissionStatus } from './domainTypes'



const ACTIVE_MISSION_STATUSES: MissionStatus[] = ['matching', 'assigned', 'on_the_way', 'arrived', 'in_progress', 'awaiting_confirmation']
const ACTIVE_LEGACY_STATUSES = ['open', 'accepted', 'on_the_way', 'arrived', 'awaiting_confirmation']

function legacyToMission(request: HelpRequest): Mission {
  const status: MissionStatus = request.status === 'open' ? 'matching' : request.status === 'accepted' ? 'assigned' : request.status
  return {
    id: request.id,
    request_id: request.id,
    requester_id: request.requester_id,
    helper_id: request.volunteer_id,
    status,
    accepted_at: request.accepted_at,
    started_at: null,
    arrived_at: request.status === 'arrived' || request.status === 'awaiting_confirmation' || request.status === 'completed' ? request.accepted_at : null,
    completed_at: request.completed_at,
    cancelled_at: null,
    created_at: request.created_at,
    updated_at: request.completed_at ?? request.accepted_at ?? request.created_at,
    request,
    source: 'legacy'
  }
}

async function attachRequest(row: Omit<Mission, 'request' | 'source'>): Promise<Mission> {
  const { data, error } = await supabase.from('help_requests').select('*').eq('id', row.request_id).maybeSingle()
  throwIfError(error, { domain: 'missions', operation: 'get-request' })
  return { ...row, request: data as HelpRequest | null, source: 'v2' }
}

async function getLegacyActive(userId: string): Promise<Mission | null> {
  const requester = await supabase.from('help_requests').select('*').eq('requester_id', userId).in('status', ACTIVE_LEGACY_STATUSES).order('created_at', { ascending: false }).limit(1).maybeSingle()
  throwIfError(requester.error, { domain: 'missions', operation: 'get-active-legacy-requester', silent: true })
  if (requester.data) return legacyToMission(requester.data as HelpRequest)
  const helper = await supabase.from('help_requests').select('*').eq('volunteer_id', userId).in('status', ACTIVE_LEGACY_STATUSES).order('created_at', { ascending: false }).limit(1).maybeSingle()
  throwIfError(helper.error, { domain: 'missions', operation: 'get-active-legacy-helper', silent: true })
  return helper.data ? legacyToMission(helper.data as HelpRequest) : null
}

export const missionRepository = {
  async getActive(userId: string): Promise<Mission | null> {
    const { data, error } = await supabase.from('missions').select('*').or(`requester_id.eq.${userId},helper_id.eq.${userId}`).in('status', ACTIVE_MISSION_STATUSES).order('created_at', { ascending: false }).limit(1).maybeSingle()
    if (error) {
      if (isMissingDatabaseObject(error)) return getLegacyActive(userId)
      throw normalizeAppError(error, { domain: 'missions', operation: 'get-active' })
    }
    return data ? attachRequest(data as Omit<Mission, 'request' | 'source'>) : null
  },

  async get(missionId: string): Promise<Mission | null> {
    const result = await supabase.from('missions').select('*').eq('id', missionId).maybeSingle()
    if (result.error) {
      if (isMissingDatabaseObject(result.error)) {
        const legacy = await supabase.from('help_requests').select('*').eq('id', missionId).maybeSingle()
        throwIfError(legacy.error, { domain: 'missions', operation: 'get-legacy' })
        return legacy.data ? legacyToMission(legacy.data as HelpRequest) : null
      }
      throw normalizeAppError(result.error, { domain: 'missions', operation: 'get' })
    }
    return result.data ? attachRequest(result.data as Omit<Mission, 'request' | 'source'>) : null
  },

  async accept(missionId: string): Promise<Mission> {
    const result = await supabase.rpc('accept_mission', { p_mission_id: missionId })
    if (result.error && isMissingDatabaseObject(result.error)) {
      const legacy = await supabase.rpc('accept_help_request', { p_request_id: missionId })
      throwIfError(legacy.error, { domain: 'missions', operation: 'accept-legacy' })
      const request = (Array.isArray(legacy.data) ? legacy.data[0] : legacy.data) as HelpRequest | null
      if (!request) throw normalizeAppError('This request has already been accepted.', { domain: 'missions', operation: 'accept-legacy' })
      return legacyToMission(request)
    }
    throwIfError(result.error, { domain: 'missions', operation: 'accept' })
    const row = (Array.isArray(result.data) ? result.data[0] : result.data) as Omit<Mission, 'request' | 'source'>
    return attachRequest(row)
  },

  async advance(missionId: string, status: MissionStatus) {
    const result = await supabase.rpc('advance_mission', { p_mission_id: missionId, p_status: status })
    if (result.error && isMissingDatabaseObject(result.error)) {
      const legacyStatus = status === 'in_progress' ? 'arrived' : status
      const legacy = await supabase.rpc('update_help_request_status', { p_request_id: missionId, p_status: legacyStatus })
      throwIfError(legacy.error, { domain: 'missions', operation: 'advance-legacy' })
      return
    }
    throwIfError(result.error, { domain: 'missions', operation: 'advance' })
  },

  async confirmCompletion(missionId: string, confirmed: boolean) {
    const result = await supabase.rpc('confirm_mission_completion', { p_mission_id: missionId, p_confirmed: confirmed })
    if (result.error && isMissingDatabaseObject(result.error)) {
      const legacy = await supabase.rpc('confirm_help_request_completion', { p_request_id: missionId, p_confirmed: confirmed })
      throwIfError(legacy.error, { domain: 'missions', operation: 'confirm-legacy' })
      return
    }
    throwIfError(result.error, { domain: 'missions', operation: 'confirm' })
  },

  async cancel(missionId: string, reason?: string) {
    const result = await supabase.rpc('cancel_mission', { p_mission_id: missionId, p_reason: reason ?? null })
    if (result.error && isMissingDatabaseObject(result.error)) {
      const legacy = await supabase.rpc('cancel_help_request', { p_request_id: missionId })
      throwIfError(legacy.error, { domain: 'missions', operation: 'cancel-legacy' })
      return
    }
    throwIfError(result.error, { domain: 'missions', operation: 'cancel' })
  },

  subscribe(missionId: string, listener: () => void, source: Mission['source'] = 'legacy') {
    return realtimeSubscription(`mission:${missionId}`, channel => channel
      .on('postgres_changes', { event: '*', schema: 'public', table: source === 'v2' ? 'missions' : 'help_requests', filter: `id=eq.${missionId}` }, listener)
    )
  },

  subscribeToOpenRequests(listener: () => void) {
    return realtimeSubscription('v2-open-requests', channel => channel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'help_requests' }, listener)
    )
  }
}
