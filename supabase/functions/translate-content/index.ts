import { createClient } from 'jsr:@supabase/supabase-js@2'
import { json, preflight } from '../_shared/http.ts'
import { translateArabic, translationFields } from '../_shared/translation.ts'

Deno.serve(async req => {
  const early = preflight(req)
  if (early) return early
  const authorization = req.headers.get('Authorization')
  if (!authorization) return json({ error: 'Unauthorized' }, 401)
  const caller = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authorization } } })
  const { data: admin, error } = await caller.rpc('is_admin')
  if (error || !admin) return json({ error: 'Unauthorized' }, 403)
  const key = Deno.env.get('GOOGLE_TRANSLATE_API_KEY')
  let fields: Record<string, string>
  try {
    const body = await req.text()
    if (body.length > 100000) return json({ error: 'Request too large' }, 413)
    const input = JSON.parse(body)
    if (input?.action === 'status') return json({ configured: !!key })
    fields = translationFields(input)
  } catch { return json({ error: 'Invalid translation request' }, 400) }
  if (!key) return json({ status: 'not_configured', translations: {} })
  try {
    return json({ status: 'translated', translations: await translateArabic(fields, key) })
  } catch {
    // Do not log message text, API keys or provider responses.
    return json({ error: 'Translation unavailable; please try again.' }, 502)
  }
})
