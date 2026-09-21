import { createClient } from 'jsr:@supabase/supabase-js@2'
import { sendPushMessages, truncateForPush } from '../_shared/push.ts'
import { readAll } from '../_shared/pagination.ts'

// Database webhook (support_messages insert, from_admin only): tells the user
// their support request got a reply. Authenticated by x-webhook-secret only.
Deno.serve(async req => {
  const secret = req.headers.get('x-webhook-secret')
  if (!secret || secret !== Deno.env.get('NOTIFY_WEBHOOK_SECRET')) {
    return new Response('Unauthorized', { status: 401 })
  }

  const input = await req.json().catch(() => null)
  if (typeof input?.message_id !== 'string') return new Response('missing message_id', { status: 400 })

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  const { data: message } = await supabase.from('support_messages')
    .select('id, conversation_id, from_admin, body').eq('id', input.message_id).single()
  if (!message || !message.from_admin) return new Response('ok: nothing to send')

  const { data: conversation } = await supabase.from('support_conversations')
    .select('id, user_id').eq('id', message.conversation_id).single()
  if (!conversation) return new Response('ok: conversation not found')

  const devices = await readAll<{ token: string }>((from, to) => supabase.rpc('get_push_recipients', { p_user_ids: [conversation.user_id] }).order('token').range(from, to))
  // An image-only reply has no text; a camera emoji reads the same in every language.
  const body = message.body ? truncateForPush(message.body) : '📷'
  const results = await sendPushMessages((devices ?? []).map((device: { token: string }) => ({
    to: device.token, title: 'AKHOO', body, sound: 'default',
    data: { supportConversationId: conversation.id }
  })))
  const invalid = results.filter(r => r.error === 'DeviceNotRegistered').map(r => r.token)
  if (invalid.length) await supabase.from('push_devices').delete().in('token', invalid)
  return new Response(JSON.stringify({ acceptedCount: results.filter(r => r.status === 'sent').length }))
})
