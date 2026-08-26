import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { isMissingDatabaseObject, normalizeAppError, throwIfError } from '../services/errors'
import type { HelpRequest } from '../types'
import type { Mission, MissionEvent, MissionMessage, MissionStatus } from './domainTypes'

// supabase-js reuses one channel object per topic name (SupabaseClient
// caches by topic), so calling `.channel(topic).on(...)` again for a topic
// that's already joined/joining throws ("cannot add postgres_changes
// callbacks... after subscribe()") instead of creating an independent
// second subscription - confirmed live when MissionProvider's app-wide
// mission subscription and a screen-level one raced for the same topic.
// Guarding here (rather than in every caller) makes the primitive safe for
// more than one subscriber, and for React StrictMode's mount/cleanup/
// remount, whose synchronous re-invoke can beat the async removeChannel()
// from the first cleanup.
function subscribeOnce(topic: string, bind: (channel: RealtimeChannel) => RealtimeChannel) {
  const realtimeTopic = `realtime:${topic}`
  const existing = supabase.getChannels().find(channel => channel.topic === realtimeTopic)
  if (existing && (existing.state === 'joined' || existing.state === 'joining')) {
    return () => {}
  }
  const channel = bind(supabase.channel(topic)).subscribe()
  return () => { void supabase.removeChannel(channel) }
}

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

  async events(missionId: string): Promise<MissionEvent[]> {
    const { data, error } = await supabase.from('mission_events').select('*').eq('mission_id', missionId).order('created_at')
    if (error && isMissingDatabaseObject(error)) return []
    throwIfError(error, { domain: 'missions', operation: 'events' })
    return (data ?? []) as MissionEvent[]
  },

  async messages(missionId: string): Promise<MissionMessage[]> {
    const { data, error } = await supabase.from('mission_messages').select('*').eq('mission_id', missionId).order('created_at')
    if (error && isMissingDatabaseObject(error)) return []
    throwIfError(error, { domain: 'missions', operation: 'messages' })
    return (data ?? []) as MissionMessage[]
  },

  async helperLocation(missionId: string): Promise<{ latitude: number; longitude: number; updated_at: string } | null> {
    const { data, error } = await supabase.rpc('get_mission_helper_location', { p_mission_id: missionId })
    if (error && isMissingDatabaseObject(error)) return null
    throwIfError(error, { domain: 'missions', operation: 'helper-location' })
    const value = Array.isArray(data) ? data[0] : data
    if (!value || value.latitude == null || value.longitude == null) return null
    return value as { latitude: number; longitude: number; updated_at: string }
  },

  async sendMessage(missionId: string, body: string): Promise<MissionMessage> {
    const { data, error } = await supabase.rpc('send_mission_message', { p_mission_id: missionId, p_body: body.trim() })
    throwIfError(error, { domain: 'missions', operation: 'send-message' })
    return (Array.isArray(data) ? data[0] : data) as MissionMessage
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

  subscribe(missionId: string, listener: () => void) {
    return subscribeOnce(`mission:${missionId}`, channel => channel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'missions', filter: `id=eq.${missionId}` }, listener)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mission_events', filter: `mission_id=eq.${missionId}` }, listener)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mission_messages', filter: `mission_id=eq.${missionId}` }, listener)
    )
  },

  subscribeToOpenRequests(listener: () => void) {
    return subscribeOnce('v2-open-requests', channel => channel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'help_requests' }, listener)
    )
  }
}
