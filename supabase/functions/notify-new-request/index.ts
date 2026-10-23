import { createClient } from 'jsr:@supabase/supabase-js@2'
import { sendPushMessages } from '../_shared/push.ts'
import { readAll } from '../_shared/pagination.ts'

function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (value: number) => (value * Math.PI) / 180
  const earth = 6371
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return earth * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const PUSH_FRESHNESS_MS = 24 * 60 * 60 * 1000

const serviceLabels: Record<string, string> = {
  battery: 'بطارية',
  tire: 'بنشر',
  fuel: 'وقود',
  locked_car: 'سيارة مقفلة',
  other: 'مساعدة'
}

Deno.serve(async req => {
  const secret = req.headers.get('x-webhook-secret')
  if (!secret || secret !== Deno.env.get('NOTIFY_WEBHOOK_SECRET')) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { request_id } = await req.json()
  if (!request_id) return new Response('missing request_id', { status: 400 })

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  const { data: request } = await supabase
    .from('help_requests')
    .select('id, requester_id, service_type, latitude, longitude, status')
    .eq('id', request_id)
    .single()

  if (!request || request.status !== 'open') return new Response('ok: request not found')

  // Who counts as reachable for a push: a volunteer whose app refreshed their availability in the last
  // 24 hours. This used to mirror the 20-minute bound of the "request read relevant" RLS policy
  // (0007_volunteer_staleness.sql), but a volunteer's availability and position only refresh while the
  // app is open (Android has no background location, see src/lib/location.ts), so with 20 minutes a
  // push could only reach someone who was already looking at the helper screen, which defeats a push.
  // Opening the app from the notification refreshes the volunteer's heartbeat, so the request is
  // readable again by the time they see it. Stale rows beyond a day are still skipped (uninstalled
  // apps that never switched availability off).
  const volunteers = await readAll<{ user_id: string; latitude: number | null; longitude: number | null }>((from, to) => supabase
    .from('volunteer_profiles')
    .select('user_id, latitude, longitude')
    .eq('is_available', true)
    .gt('updated_at', new Date(Date.now() - PUSH_FRESHNESS_MS).toISOString())
    .order('user_id').range(from, to))

  // This function always returns 200/"ok" once it runs at all (webhook auth
  // succeeded, the trigger fired) regardless of whether any candidate was
  // actually found or any push actually sent - that response alone can't
  // distinguish "nothing to notify" from "something failed silently". Log
  // the counts so a real invocation's actual outcome is visible.
  const candidateCount = (volunteers ?? []).length
  const nearby = (volunteers ?? []).filter(v => {
    if (v.latitude == null || v.longitude == null) return false
    if (v.user_id === request.requester_id) return false
    return distanceKm(request.latitude, request.longitude, v.latitude, v.longitude) <= 20
  })
  console.log(`[notify-new-request] request ${request_id}: ${candidateCount} available volunteer(s) seen in the last 24h, ${nearby.length} within 20km after excluding the requester`)

  const devices = await readAll<{ token: string }>((from, to) => supabase.rpc('get_request_push_recipients', { p_user_ids: nearby.map(v => v.user_id), p_peer_id: request.requester_id }).order('token').range(from, to))
  const results = await sendPushMessages((devices ?? []).map((device: { token: string }) => ({
    to: device.token, title: 'طلب مساعدة قريب منك',
    body: serviceLabels[request.service_type] ?? 'مساعدة', sound: 'default',
    data: { requestId: request.id }
  })))
  const invalid = results.filter(r => r.error === 'DeviceNotRegistered').map(r => r.token)
  if (invalid.length) await supabase.from('push_devices').delete().in('token', invalid)
  return new Response(JSON.stringify({ candidateCount, nearbyCount: nearby.length, acceptedCount: results.filter(r => r.status === 'sent').length, failedCount: results.filter(r => r.status !== 'sent').length }))
})
