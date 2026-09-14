import { createClient } from 'jsr:@supabase/supabase-js@2'

// Unlike notify-new-message/notify-new-request (DB-webhook triggered, so
// they authenticate with a shared x-webhook-secret), this function is
// called directly by an admin's own browser session via
// supabase.functions.invoke - so it verifies the caller's real JWT is a
// real admin, the same way every admin RPC's own is_admin() check does,
// rather than trusting a header. broadcast_notifications itself has no
// client insert policy (only admin_create_broadcast_notification writes
// it), so by the time this runs, notification_id is already known-legit -
// this check exists so a non-admin holding a valid session token can't
// invoke the function directly and cause a send.
Deno.serve(async req => {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return new Response('Unauthorized', { status: 401 })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const asCaller = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } })

  const { data: isAdmin } = await asCaller.rpc('is_admin')
  if (!isAdmin) return new Response('Unauthorized', { status: 401 })

  const { notification_id } = await req.json()
  if (!notification_id) return new Response('missing notification_id', { status: 400 })

  const supabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  const { data: notification } = await supabase
    .from('broadcast_notifications')
    .select('id, title, body, target_audience, sent_at')
    .eq('id', notification_id)
    .single()
  if (!notification) return new Response('ok: notification not found')
  if (notification.sent_at) return new Response(JSON.stringify({ sentCount: 0, note: 'already sent' }))

  let recipients: { push_token: string }[] = []
  if (notification.target_audience === 'volunteers') {
    const { data } = await supabase.from('volunteer_profiles').select('push_token').not('push_token', 'is', null)
    recipients = (data ?? []) as { push_token: string }[]
  } else {
    const { data } = await supabase.from('profiles').select('push_token').not('push_token', 'is', null)
    recipients = (data ?? []) as { push_token: string }[]
  }

  const tokens = [...new Set(recipients.map(r => r.push_token).filter(Boolean))]

  let sentCount = 0
  const errors: string[] = []
  // Expo's push API accepts up to 100 messages per request.
  for (let i = 0; i < tokens.length; i += 100) {
    const batch = tokens.slice(i, i + 100).map(token => ({
      to: token,
      title: notification.title,
      body: notification.body,
      sound: 'default',
      data: { broadcastNotificationId: notification.id }
    }))
    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batch)
      })
      const text = await response.text()
      if (!response.ok) {
        console.error('[send-broadcast-notification] Expo push API returned', response.status, text)
        errors.push(`batch ${i}: ${response.status}`)
      } else {
        sentCount += batch.length
      }
    } catch (err) {
      console.error('[send-broadcast-notification] push send failed:', err)
      errors.push(`batch ${i}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  await supabase.from('broadcast_notifications').update({ sent_count: sentCount, sent_at: new Date().toISOString() }).eq('id', notification.id)

  return new Response(JSON.stringify({ sentCount, totalTokens: tokens.length, errors }))
})
