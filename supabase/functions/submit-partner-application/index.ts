import { createClient } from 'jsr:@supabase/supabase-js@2'
import { json, preflight } from '../_shared/http.ts'
import { applicationEmail, parsePartnerApplication, type PartnerApplicationRow } from '../_shared/partnerApplication.ts'

// Public endpoint behind the partner form of the web, iPhone and Android apps. It validates the input, limits abuse
// (two applications per phone number a day, sixty an hour overall), stores the row with the service role and tells the
// team by email. The email is best effort: the stored row is what counts, so a mail problem never fails the request.
const PER_PHONE_PER_DAY = 2
const PER_HOUR_TOTAL = 60
const DAY = 24 * 60 * 60 * 1000
const HOUR = 60 * 60 * 1000

async function notify(row: PartnerApplicationRow) {
  const key = Deno.env.get('RESEND_API_KEY')
  if (!key) return
  const to = Deno.env.get('PARTNER_NOTIFY_EMAIL') ?? 'support@akhoo.app'
  const mail = applicationEmail(row)
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'AKHOO <support@akhoo.app>', to: [to], subject: mail.subject, text: mail.text })
    })
    if (!response.ok) console.error('[submit-partner-application] notification email rejected', response.status)
  } catch {
    console.error('[submit-partner-application] notification email failed')
  }
}

Deno.serve(async req => {
  const early = preflight(req)
  if (early) return early
  try {
    const parsed = parsePartnerApplication(await req.json().catch(() => null))
    if (!parsed.ok) return json({ error: 'Invalid application', code: 'invalid', field: parsed.field }, 400)
    const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const since = (ms: number) => new Date(Date.now() - ms).toISOString()
    const [samePhone, lastHour] = await Promise.all([
      db.from('partner_applications').select('id', { count: 'exact', head: true }).eq('phone', parsed.value.phone).gte('created_at', since(DAY)),
      db.from('partner_applications').select('id', { count: 'exact', head: true }).gte('created_at', since(HOUR))
    ])
    if (samePhone.error || lastHour.error) throw samePhone.error ?? lastHour.error
    if ((samePhone.count ?? 0) >= PER_PHONE_PER_DAY || (lastHour.count ?? 0) >= PER_HOUR_TOTAL) {
      return json({ error: 'Too many applications', code: 'rate_limited' }, 429)
    }
    const { error } = await db.from('partner_applications').insert(parsed.value)
    if (error) throw error
    await notify(parsed.value)
    return json({ ok: true })
  } catch {
    console.error('[submit-partner-application] could not store the application')
    return json({ error: 'Could not send the application. Please try again.', code: 'failed' }, 500)
  }
})
