import { createClient } from 'jsr:@supabase/supabase-js@2'
import { json, preflight } from '../_shared/http.ts'
import { translateText, userTextRequest } from '../_shared/translation.ts'
import { createGoogleTranslationAuth } from '../_shared/googleTranslationAuth.ts'

const account = Deno.env.get('GOOGLE_TRANSLATE_SERVICE_ACCOUNT')
const getAccessToken = account ? createGoogleTranslationAuth(account) : undefined

// Signed-in users translate one piece of text written by another user, only
// when they tap "Translate". Nothing is stored and the text is never logged.
Deno.serve(async req => {
  const early = preflight(req)
  if (early) return early
  const authorization = req.headers.get('Authorization')
  if (!authorization?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401)
  const caller = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authorization } } })
  const { data: user, error: authError } = await caller.auth.getUser(authorization.slice(7))
  if (authError || !user.user) return json({ error: 'Unauthorized' }, 401)
  let request: ReturnType<typeof userTextRequest>
  try {
    const body = await req.text()
    if (body.length > 10000) return json({ error: 'Request too large' }, 413)
    request = userTextRequest(JSON.parse(body))
  } catch { return json({ error: 'Invalid translation request' }, 400) }
  const key = Deno.env.get('GOOGLE_TRANSLATE_API_KEY')
  if (!key && !getAccessToken) return json({ status: 'not_configured' })
  // Per-user hourly limit, checked before any provider call.
  const { data: allowed, error: quotaError } = await caller.rpc('consume_translation_quota')
  if (quotaError) return json({ error: 'Translation unavailable; please try again.' }, 502)
  if (!allowed) return json({ status: 'limited' }, 429)
  try {
    const result = await translateText(request.text, request.target, key || { accessToken: await getAccessToken!() })
    if (result.detected === request.target) return json({ status: 'same' })
    return json({ status: 'translated', text: result.text })
  } catch {
    // Do not log message text, API keys or provider responses.
    return json({ error: 'Translation unavailable; please try again.' }, 502)
  }
})
