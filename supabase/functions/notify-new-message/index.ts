import { createClient } from 'jsr:@supabase/supabase-js@2'

Deno.serve(async req => {
  const secret = req.headers.get('x-webhook-secret')
  if (!secret || secret !== Deno.env.get('NOTIFY_WEBHOOK_SECRET')) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { message_id } = await req.json()
  if (!message_id) return new Response('missing message_id', { status: 400 })

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  const { data: message } = await supabase
    .from('messages')
    .select('id, request_id, sender_id, body, media_type')
    .eq('id', message_id)
    .single()
  if (!message) return new Response('ok: message not found')

  const { data: request } = await supabase
    .from('help_requests')
    .select('requester_id, volunteer_id')
    .eq('id', message.request_id)
    .single()
  if (!request) return new Response('ok: request not found')

  const recipientId = message.sender_id === request.requester_id ? request.volunteer_id : request.requester_id
  if (!recipientId) return new Response('ok: no matched recipient yet')

  const [{ data: sender }, { data: recipient }] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', message.sender_id).single(),
    supabase.from('profiles').select('push_token').eq('id', recipientId).single()
  ])

  if (!recipient?.push_token) {
    return new Response(JSON.stringify({ recipientId, pushResult: 'recipient has no push token' }))
  }

  const body = message.media_type === 'image'
    ? 'أرسل لك صورة 📷'
    : message.media_type === 'video'
      ? 'أرسل لك فيديو 🎥'
      : (message.body ?? 'رسالة جديدة')

  let pushResult = 'not sent'
  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([{
        to: recipient.push_token,
        title: `${sender?.full_name || 'رسالة جديدة'} 💬`,
        body,
        sound: 'default',
        data: { requestId: message.request_id, missionChat: true }
      }])
    })
    const responseText = await response.text()
    if (!response.ok) {
      console.error('[notify-new-message] Expo push API returned', response.status, responseText)
      pushResult = `expo api error ${response.status}: ${responseText.slice(0, 300)}`
    } else {
      console.log('[notify-new-message] Expo push API accepted:', responseText)
      pushResult = `sent: ${responseText.slice(0, 300)}`
    }
  } catch (err) {
    console.error('[notify-new-message] push send failed:', err)
    pushResult = `push send threw: ${err instanceof Error ? err.message : String(err)}`
  }

  return new Response(JSON.stringify({ recipientId, pushResult }))
})
