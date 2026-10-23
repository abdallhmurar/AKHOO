import { createClient } from 'jsr:@supabase/supabase-js@2'
import { sendPushMessages } from '../_shared/push.ts'
import { readAll } from '../_shared/pagination.ts'
import { nearbyVolunteers } from '../_shared/nearby.ts'
import { deliver, usersAllowed } from '../_shared/notifications.ts'

const serviceLabels: Record<string, string> = {
  battery: 'بطارية',
  tire: 'بنشر',
  fuel: 'وقود',
  locked_car: 'سيارة مقفلة',
  other: 'مساعدة'
}

// Called by the database when a request is created, and by notify-event when a volunteer released a request
// (body.reopened), so the nearby volunteers hear about it again.
Deno.serve(async req => {
  const secret = req.headers.get('x-webhook-secret')
  if (!secret || secret !== Deno.env.get('NOTIFY_WEBHOOK_SECRET')) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { request_id, reopened } = await req.json()
  if (!request_id) return new Response('missing request_id', { status: 400 })

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  const { data: request } = await supabase
    .from('help_requests')
    .select('id, requester_id, service_type, latitude, longitude, status')
    .eq('id', request_id)
    .single()

  if (!request || request.status !== 'open') return new Response('ok: request not found')

  // Anyone who already released this request cannot take it again, so they are not asked again either.
  const { data: released } = await supabase.from('help_request_releases').select('volunteer_id').eq('request_id', request_id)
  const { candidateCount, nearby } = await nearbyVolunteers(supabase, request, ((released ?? []) as { volunteer_id: string }[]).map(r => r.volunteer_id))
  // This function always returns 200/"ok" once it runs at all (webhook auth
  // succeeded, the trigger fired) regardless of whether any candidate was
  // actually found or any push actually sent - that response alone can't
  // distinguish "nothing to notify" from "something failed silently". Log
  // the counts so a real invocation's actual outcome is visible.
  console.log(`[notify-new-request] request ${request_id}: ${candidateCount} available volunteer(s) seen in the last 24h, ${nearby.length} within 20km after excluding the requester`)

  // Volunteers who switched "requests" notifications off in their settings are skipped.
  const wanted = await usersAllowed(supabase, 'requests', nearby)
  const devices = await readAll<{ user_id: string; token: string }>((from, to) => supabase.rpc('get_request_push_recipients', { p_user_ids: wanted, p_peer_id: request.requester_id }).order('token').range(from, to))
  const results = await sendPushMessages((devices ?? []).map((device: { token: string }) => ({
    to: device.token, title: 'طلب مساعدة قريب منك',
    body: serviceLabels[request.service_type] ?? 'مساعدة', sound: 'default',
    data: { requestId: request.id }
  })))
  const invalid = results.filter(r => r.error === 'DeviceNotRegistered').map(r => r.token)
  if (invalid.length) await supabase.from('push_devices').delete().in('token', invalid)

  // Reassure the requester how many volunteers were reached (not when the request was only reopened).
  const sentTokens = new Set(results.filter(r => r.status === 'sent').map(r => r.token))
  const reachedUsers = new Set((devices ?? []).filter(d => sentTokens.has(d.token)).map(d => d.user_id))
  if (!reopened && reachedUsers.size > 0) {
    await deliver(supabase, { event: 'request_sent', category: 'mission', userIds: [request.requester_id], dedupe: `request_sent:${request.id}`, vars: { n: reachedUsers.size } })
      .catch(() => {})
  }
  return new Response(JSON.stringify({ candidateCount, nearbyCount: nearby.length, acceptedCount: results.filter(r => r.status === 'sent').length, failedCount: results.filter(r => r.status !== 'sent').length }))
})
