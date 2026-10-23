import { createClient } from 'jsr:@supabase/supabase-js@2'
import { achievementFor, adminUserIds, deliver, partnerUserIds } from '../_shared/notifications.ts'
import { asLang, levelNames, serviceLabels, type EventKey } from '../_shared/notificationCopy.ts'
import { nearbyVolunteers } from '../_shared/nearby.ts'
import { readAll } from '../_shared/pagination.ts'

// One entry point for every notification event emitted by the database (see 0051_notification_events.sql):
// triggers call emit_notification(event, payload), pg_cron calls it with event "tick" every two minutes.
// The shared pipeline in _shared/notifications.ts then applies preferences, once-only keys, languages and
// sends. This function always answers 200 once it ran, with a short outcome, so net._http_response shows what happened.

// deno-lint-ignore no-explicit-any
type Db = any
type Payload = Record<string, unknown>
type RequestRow = { id: string; requester_id: string; volunteer_id: string | null; service_type: string; status: string; latitude: number; longitude: number; created_at: string }

const MINUTE = 60 * 1000
const NO_VOLUNTEER_AFTER = 10 * MINUTE
const STILL_OPEN_FROM = 5 * MINUTE
const STILL_OPEN_UNTIL = 20 * MINUTE
const GIVE_UP_AFTER = 3 * 60 * MINUTE
const RATING_REMINDER_FROM = 60 * MINUTE
const RATING_REMINDER_UNTIL = 24 * 60 * MINUTE
const LOG_KEEP_DAYS = 90

// Opens the mission chat: the one place every app version already knows how to open for a request.
const missionData = (requestId: string) => ({ requestId, missionChat: true })
const str = (value: unknown) => (typeof value === 'string' ? value : '')

async function getRequest(db: Db, id: string): Promise<RequestRow | null> {
  const { data } = await db.from('help_requests')
    .select('id, requester_id, volunteer_id, service_type, status, latitude, longitude, created_at').eq('id', id).single()
  return data ?? null
}

const toRequester = (event: EventKey) => async (db: Db, p: Payload) => {
  const request = await getRequest(db, str(p.request_id))
  if (!request) return 'request not found'
  return deliver(db, { event, category: 'mission', userIds: [request.requester_id], dedupe: `${event}:${request.id}:${str(p.stamp)}`, data: missionData(request.id) })
}

const handlers: Record<string, (db: Db, p: Payload, env: { url: string; secret: string; fetch: typeof fetch }) => Promise<unknown>> = {
  request_accepted: toRequester('request_accepted'),
  helper_on_the_way: toRequester('helper_on_the_way'),
  helper_arrived: toRequester('helper_arrived'),
  completion_requested: toRequester('completion_requested'),

  async completion_rejected(db, p) {
    const request = await getRequest(db, str(p.request_id))
    if (!request?.volunteer_id) return 'no volunteer'
    return deliver(db, { event: 'completion_rejected', category: 'mission', userIds: [request.volunteer_id], dedupe: `completion_rejected:${request.id}:${str(p.stamp)}`, data: missionData(request.id) })
  },

  async request_completed(db, p) {
    const request = await getRequest(db, str(p.request_id))
    if (!request?.volunteer_id) return 'no volunteer'
    const volunteerId = request.volunteer_id
    const { data: tx } = await db.from('volunteer_point_transactions').select('points').eq('request_id', request.id).eq('volunteer_id', volunteerId).limit(1)
    const points = Number(tx?.[0]?.points ?? 10)
    const { count } = await db.from('help_requests').select('id', { count: 'exact', head: true }).eq('volunteer_id', volunteerId).eq('status', 'completed')
    const completed = Number(count ?? 0)
    const done = await deliver(db, { event: 'request_completed', category: 'mission', userIds: [volunteerId], dedupe: `request_completed:${request.id}`, vars: { points }, data: missionData(request.id) })
    const achievement = achievementFor(completed)
    if (!achievement) return done
    if (achievement.event === 'level_up') {
      await deliver(db, { event: 'level_up', category: 'rewards', userIds: [volunteerId], dedupe: `level_up:${volunteerId}:${achievement.level}`, vars: lang => ({ level: levelNames[achievement.level][lang] }) })
    } else if (achievement.event === 'first_help') {
      await deliver(db, { event: 'first_help', category: 'rewards', userIds: [volunteerId], dedupe: `first_help:${volunteerId}` })
    } else {
      await deliver(db, { event: 'milestone', category: 'rewards', userIds: [volunteerId], dedupe: `milestone:${volunteerId}:${achievement.n}`, vars: { n: achievement.n } })
    }
    return { done, achievement }
  },

  async helper_released(db, p, env) {
    const request = await getRequest(db, str(p.request_id))
    if (!request) return 'request not found'
    const told = await deliver(db, { event: 'helper_released', category: 'mission', userIds: [request.requester_id], dedupe: `helper_released:${request.id}:${str(p.stamp)}` })
    // The request is open again: let the nearby volunteers know (it skips the one who released and does not repeat "request sent").
    const again = await env.fetch(`${env.url}/functions/v1/notify-new-request`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-webhook-secret': env.secret }, body: JSON.stringify({ request_id: request.id, reopened: true })
    })
    return { told, renotified: again.status }
  },

  async mission_cancelled(db, p) {
    const request = await getRequest(db, str(p.request_id))
    if (!request) return 'request not found'
    const people = [request.requester_id, str(p.volunteer_id)].filter(Boolean)
    return deliver(db, { event: 'mission_cancelled', category: 'mission', userIds: people, dedupe: `mission_cancelled:${request.id}:${str(p.stamp)}` })
  },

  async redemption_created(db, p) {
    const { data } = await db.from('offer_redemptions').select('id, user_id').eq('id', str(p.redemption_id)).single()
    if (!data) return 'redemption not found'
    return deliver(db, { event: 'redemption_created', category: 'rewards', userIds: [data.user_id], dedupe: `redemption_created:${data.id}` })
  },

  async redemption_redeemed(db, p) {
    const { data } = await db.from('offer_redemptions').select('id, user_id, partner_id').eq('id', str(p.redemption_id)).single()
    if (!data) return 'redemption not found'
    const user = await deliver(db, { event: 'redemption_redeemed', category: 'rewards', userIds: [data.user_id], dedupe: `redemption_redeemed:${data.id}` })
    const partner = await deliver(db, { event: 'redemption_redeemed_partner', category: 'partner', userIds: await partnerUserIds(db, data.partner_id), dedupe: `redemption_redeemed_partner:${data.id}` })
    return { user, partner }
  },

  async offer_reviewed(db, p) {
    const { data } = await db.from('partner_offers').select('id, partner_id').eq('id', str(p.offer_id)).single()
    if (!data) return 'offer not found'
    const approved = p.decision === 'approved'
    return deliver(db, { event: approved ? 'offer_approved' : 'offer_rejected', category: 'partner', userIds: await partnerUserIds(db, data.partner_id), dedupe: `offer_reviewed:${data.id}:${approved ? 'approved' : 'rejected'}` })
  },

  async offer_pending(db, p) {
    return deliver(db, { event: 'admin_offer_pending', category: 'admin', userIds: await adminUserIds(db), dedupe: `offer_pending:${str(p.offer_id)}` })
  },

  async support_user_message(db, p) {
    // One alert per conversation per ten minutes, however many messages the user sends.
    const bucket = Math.floor(Date.now() / (10 * MINUTE))
    return deliver(db, { event: 'admin_support_message', category: 'admin', userIds: await adminUserIds(db), dedupe: `support_message:${str(p.conversation_id)}:${bucket}` })
  },

  async support_resolved(db, p) {
    const { data } = await db.from('support_conversations').select('id, user_id').eq('id', str(p.conversation_id)).single()
    if (!data) return 'conversation not found'
    return deliver(db, { event: 'support_resolved', category: 'support', userIds: [data.user_id], dedupe: `support_resolved:${data.id}:${str(p.stamp)}`, data: { supportConversationId: data.id } })
  },

  async report_created(db, p) {
    return deliver(db, { event: 'admin_report', category: 'admin', userIds: await adminUserIds(db), dedupe: `report_created:${str(p.report_id)}` })
  },

  async report_reviewed(db, p) {
    const { data } = await db.from('reports').select('id, reporter_id').eq('id', str(p.report_id)).single()
    if (!data) return 'report not found'
    return deliver(db, { event: 'report_reviewed', category: 'support', userIds: [data.reporter_id], dedupe: `report_reviewed:${data.id}` })
  },

  async account_banned(db, p) {
    return deliver(db, { event: 'account_banned', category: 'account', userIds: [str(p.user_id)], dedupe: `account_banned:${str(p.user_id)}:${str(p.stamp)}`, includeBanned: true })
  },

  async account_unbanned(db, p) {
    return deliver(db, { event: 'account_unbanned', category: 'account', userIds: [str(p.user_id)], dedupe: `account_unbanned:${str(p.user_id)}:${str(p.stamp)}` })
  },

  async volunteer_verified(db, p) {
    return deliver(db, { event: 'volunteer_verified', category: 'account', userIds: [str(p.user_id)], dedupe: `volunteer_verified:${str(p.user_id)}` })
  },

  async new_device(db, p) {
    // Once a day at most, so reinstalling a few times does not turn into a stream of warnings.
    return deliver(db, { event: 'new_device', category: 'account', userIds: [str(p.user_id)], dedupe: `new_device:${str(p.user_id)}:${new Date().toISOString().slice(0, 10)}` })
  },

  async tick(db) {
    const now = Date.now()
    const ago = (ms: number) => new Date(now - ms).toISOString()
    const ahead = (ms: number) => new Date(now + ms).toISOString()
    const outcome: Record<string, number> = {}

    // 1. Requests nobody has taken for ten minutes (not right after a volunteer released one).
    const open = await readAll<RequestRow>((from, to) => db.from('help_requests')
      .select('id, requester_id, volunteer_id, service_type, status, latitude, longitude, created_at')
      .eq('status', 'open').is('volunteer_id', null).lt('created_at', ago(NO_VOLUNTEER_AFTER)).gt('created_at', ago(GIVE_UP_AFTER))
      .order('created_at').range(from, to))
    if (open.length) {
      const { data: released } = await db.from('help_request_releases').select('request_id, volunteer_id').in('request_id', open.map(r => r.id)).gt('released_at', ago(NO_VOLUNTEER_AFTER))
      const justReleased = new Set(((released ?? []) as { request_id: string }[]).map(r => r.request_id))
      for (const request of open.filter(r => !justReleased.has(r.id))) {
        const told = await deliver(db, { event: 'no_volunteer', category: 'mission', userIds: [request.requester_id], dedupe: `no_volunteer:${request.id}` })
        outcome.no_volunteer = (outcome.no_volunteer ?? 0) + told.sent
      }
    }

    // 2. Requests still open after five minutes: one nudge to the volunteers close to it.
    const stillOpen = await readAll<RequestRow>((from, to) => db.from('help_requests')
      .select('id, requester_id, volunteer_id, service_type, status, latitude, longitude, created_at')
      .eq('status', 'open').is('volunteer_id', null).lt('created_at', ago(STILL_OPEN_FROM)).gt('created_at', ago(STILL_OPEN_UNTIL))
      .order('created_at').range(from, to))
    for (const request of stillOpen) {
      const { data: released } = await db.from('help_request_releases').select('volunteer_id').eq('request_id', request.id)
      const { nearby } = await nearbyVolunteers(db, request, ((released ?? []) as { volunteer_id: string }[]).map(r => r.volunteer_id))
      if (!nearby.length) continue
      const told = await deliver(db, {
        event: 'request_still_open', category: 'requests', userIds: nearby, dedupe: `still_open:${request.id}`,
        vars: lang => ({ service: (serviceLabels[request.service_type] ?? serviceLabels.other)[asLang(lang)] }), data: { requestId: request.id }
      })
      outcome.still_open = (outcome.still_open ?? 0) + told.sent
    }

    // 3. Offer codes that lapse within the hour.
    const expiring = await readAll<{ id: string; user_id: string }>((from, to) => db.from('offer_redemptions')
      .select('id, user_id').eq('status', 'pending').gt('expires_at', new Date(now).toISOString()).lt('expires_at', ahead(60 * MINUTE)).order('id').range(from, to))
    for (const redemption of expiring) {
      const told = await deliver(db, { event: 'redemption_expiring', category: 'rewards', userIds: [redemption.user_id], dedupe: `redemption_expiring:${redemption.id}` })
      outcome.redemption_expiring = (outcome.redemption_expiring ?? 0) + told.sent
    }

    // 4. Rating reminders (opt-in): an hour after a completed mission that was never rated.
    const completed = await readAll<{ id: string; requester_id: string }>((from, to) => db.from('help_requests')
      .select('id, requester_id').eq('status', 'completed').lt('completed_at', ago(RATING_REMINDER_FROM)).gt('completed_at', ago(RATING_REMINDER_UNTIL)).order('id').range(from, to))
    if (completed.length) {
      const { data: rated } = await db.from('mission_ratings').select('request_id').in('request_id', completed.map(r => r.id))
      const ratedIds = new Set(((rated ?? []) as { request_id: string }[]).map(r => r.request_id))
      for (const request of completed.filter(r => !ratedIds.has(r.id))) {
        const told = await deliver(db, { event: 'rating_reminder', category: 'reminders', userIds: [request.requester_id], dedupe: `rating_reminder:${request.id}` })
        outcome.rating_reminder = (outcome.rating_reminder ?? 0) + told.sent
      }
    }

    await db.from('notification_log').delete().lt('created_at', new Date(now - LOG_KEEP_DAYS * 24 * 60 * MINUTE).toISOString())
    return outcome
  }
}

Deno.serve(async req => {
  const secret = req.headers.get('x-webhook-secret')
  if (!secret || secret !== Deno.env.get('NOTIFY_WEBHOOK_SECRET')) {
    return new Response('Unauthorized', { status: 401 })
  }
  const input = await req.json().catch(() => null)
  const event = typeof input?.event === 'string' ? input.event : ''
  const handler = handlers[event]
  if (!handler) return new Response(JSON.stringify({ error: 'unknown event' }), { status: 400, headers: { 'Content-Type': 'application/json' } })

  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  try {
    const result = await handler(db, input, { url: Deno.env.get('SUPABASE_URL')!, secret, fetch })
    return new Response(JSON.stringify({ event, result }), { headers: { 'Content-Type': 'application/json' } })
  } catch (error) {
    console.error(`[notify-event] ${event} failed`, error instanceof Error ? error.message : String(error))
    return new Response(JSON.stringify({ event, error: 'failed' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
})
