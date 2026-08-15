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
    .select('id, service_type, latitude, longitude')
    .eq('id', request_id)
    .single()

  if (!request) return new Response('ok')

  const { data: volunteers } = await supabase
    .from('volunteer_profiles')
    .select('latitude, longitude, push_token')
    .eq('is_available', true)
    .not('push_token', 'is', null)

  const nearby = (volunteers ?? []).filter(v => {
    if (v.latitude == null || v.longitude == null) return false
    return distanceKm(request.latitude, request.longitude, v.latitude, v.longitude) <= 20
  })

  const messages = nearby.map(v => ({
    to: v.push_token,
    title: 'طلب مساعدة قريب منك 🆘',
    body: `في حدا قريب محتاج مساعدة: ${serviceLabels[request.service_type] ?? 'مساعدة'}`,
    sound: 'default'
  }))

  if (messages.length > 0) {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messages)
    })
  }

  return new Response('ok')
})
