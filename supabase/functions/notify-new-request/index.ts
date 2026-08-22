import { createClient } from 'jsr:@supabase/supabase-js@2'

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
    .select('id, requester_id, service_type, latitude, longitude')
    .eq('id', request_id)
    .single()

  if (!request) return new Response('ok: request not found')

  // Mirrors the 20-minute staleness bound the RLS "request read relevant"
  // policy already applies (0007_volunteer_staleness.sql) - without it a
  // volunteer whose app was killed/uninstalled without ever toggling
  // availability off stays "available" forever and keeps getting a push
  // attempted against a token that will never be delivered.
  const { data: volunteers } = await supabase
    .from('volunteer_profiles')
    .select('user_id, latitude, longitude, push_token')
    .eq('is_available', true)
    .not('push_token', 'is', null)
    .gt('updated_at', new Date(Date.now() - 20 * 60 * 1000).toISOString())

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
  console.log(`[notify-new-request] request ${request_id}: ${candidateCount} available+tokened+fresh volunteer(s), ${nearby.length} within 20km after excluding the requester`)

  const messages = nearby.map(v => ({
    to: v.push_token,
    title: 'طلب مساعدة قريب منك 🆘',
    body: `في حدا قريب محتاج مساعدة: ${serviceLabels[request.service_type] ?? 'مساعدة'}`,
    sound: 'default'
  }))

  let pushResult = 'no candidates'
  if (messages.length > 0) {
    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messages)
      })
      const responseBody = await response.text()
      if (!response.ok) {
        console.error('[notify-new-request] Expo push API returned', response.status, responseBody)
        pushResult = `expo api error ${response.status}: ${responseBody.slice(0, 300)}`
      } else {
        console.log(`[notify-new-request] Expo push API accepted ${messages.length} message(s):`, responseBody)
        // Truncated, not the full Expo response - just enough to see
        // "ok"/"error" per-ticket without the response body growing
        // unbounded for a large recipient batch.
        pushResult = `sent to ${messages.length}: ${responseBody.slice(0, 300)}`
      }
    } catch (err) {
      console.error('[notify-new-request] push send failed:', err)
      pushResult = `push send threw: ${err instanceof Error ? err.message : String(err)}`
    }
  }

  // The response body itself carries the outcome (not just Edge Function
  // logs) so it's queryable straight from net._http_response via SQL -
  // no dashboard/CLI log access needed to see what a real invocation did.
  return new Response(JSON.stringify({ candidateCount, nearbyCount: nearby.length, pushResult }))
})
