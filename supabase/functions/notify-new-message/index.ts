import { createClient } from 'jsr:@supabase/supabase-js@2'
import { sendPushMessages } from '../_shared/push.ts'
import { readAll } from '../_shared/pagination.ts'

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

  const devices = await readAll<{ token: string }>((from, to) => supabase.rpc('get_request_push_recipients', { p_user_ids: [recipientId], p_peer_id: message.sender_id }).order('token').range(from, to))
  // Keep message text and identities off the lock screen.
  const results = await sendPushMessages((devices ?? []).map((device: { token: string }) => ({
    to: device.token, title: 'AKHOO', body: 'رسالة جديدة في محادثة المهمة', sound: 'default',
    data: { requestId: message.request_id, missionChat: true }
  })))
  const invalid = results.filter(r => r.error === 'DeviceNotRegistered').map(r => r.token)
  if (invalid.length) await supabase.from('push_devices').delete().in('token', invalid)
  return new Response(JSON.stringify({ acceptedCount: results.filter(r => r.status === 'sent').length }))
})
