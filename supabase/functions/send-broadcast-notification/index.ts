import { createClient } from 'jsr:@supabase/supabase-js@2'
import { json, preflight } from '../_shared/http.ts'
import { sendPushBatch } from '../_shared/push.ts'
import { readAll } from '../_shared/pagination.ts'

Deno.serve(async req => {
  const early = preflight(req)
  if (early) return early
  try {
    const authorization = req.headers.get('Authorization')
    if (!authorization) return json({ error: 'Unauthorized' }, 401)
    const caller = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authorization } }
    })
    const { data: isAdmin, error: authError } = await caller.rpc('is_admin')
    if (authError || !isAdmin) return json({ error: 'Unauthorized' }, 403)
    const input = await req.json().catch(() => null)
    if (typeof input?.notification_id !== 'string') return json({ error: 'Missing notification_id' }, 400)
    const id = input.notification_id
    const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: notification, error: readError } = await db.from('broadcast_notifications')
      .select('id,title,body,target_audience,sent_at,sent_count').eq('id', id).single()
    if (readError || !notification) return json({ error: 'Notification not found' }, 404)
    if (notification.sent_at) return json({ sentCount: notification.sent_count, complete: true })
    const { data: claimed, error: claimError } = await db.rpc('claim_broadcast_send', { p_id: id })
    if (claimError) throw claimError
    if (!claimed) return json({ error: 'Notification is already being sent' }, 409)
    try {
      const recipients = await readAll<{ token: string }>((from, to) => db.rpc('get_push_recipients', { p_volunteers_only: notification.target_audience === 'volunteers' }).order('token').range(from, to))
      const previous = await readAll<{ token: string; status: string; error: string | null }>((from, to) => db.from('broadcast_push_results').select('token,status,error').eq('notification_id', id).order('token').range(from, to))
      const skip = new Set((previous ?? []).filter(r => r.status !== 'failed' || r.error === 'DeviceNotRegistered').map(r => r.token))
      const tokens = [...new Set<string>((recipients ?? []).map((r: { token: string }) => r.token))].filter(t => !skip.has(t))
      for (let offset = 0; offset < tokens.length; offset += 100) {
        const batch = tokens.slice(offset, offset + 100)
        // Persist intent before contacting Expo, so a crash never silently
        // retries a batch whose delivery status cannot be established.
        const { error: intentError } = await db.from('broadcast_push_results').upsert(batch.map(token => ({ notification_id: id, token, status: 'sending', updated_at: new Date().toISOString() })))
        if (intentError) throw intentError
        const results = await sendPushBatch(batch.map(to => ({ to, title: notification.title, body: notification.body, sound: 'default', data: { broadcastNotificationId: id } })))
        const { error: resultError } = await db.from('broadcast_push_results').upsert(results.map(r => ({ notification_id: id, ...r, updated_at: new Date().toISOString() })))
        if (resultError) throw resultError
        const invalid = results.filter(r => r.error === 'DeviceNotRegistered').map(r => r.token)
        if (invalid.length) await db.from('push_devices').delete().in('token', invalid)
      }
      const outcomes = await readAll<{ status: string; error: string | null }>((from, to) => db.from('broadcast_push_results').select('status,error').eq('notification_id', id).order('token').range(from, to))
      const sentCount = (outcomes ?? []).filter(r => r.status === 'sent').length
      const unresolvedCount = (outcomes ?? []).filter(r => r.status !== 'sent' && r.error !== 'DeviceNotRegistered').length
      const complete = unresolvedCount === 0
      const { error: updateError } = await db.from('broadcast_notifications').update({
        sent_count: sentCount, sent_at: complete ? new Date().toISOString() : null,
        delivery_status: complete ? 'sent' : sentCount ? 'partial' : 'failed', sending_started_at: null
      }).eq('id', id)
      if (updateError) throw updateError
      return json({ sentCount, unresolvedCount, complete })
    } catch (error) {
      await db.from('broadcast_notifications').update({ delivery_status: 'failed', sending_started_at: null }).eq('id', id)
      throw error
    }
  } catch {
    console.error('[send-broadcast-notification] delivery did not finish')
    return json({ error: 'Notification delivery did not finish; inspect status before retrying.' }, 500)
  }
})
