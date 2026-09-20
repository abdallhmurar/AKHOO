import { createClient } from 'jsr:@supabase/supabase-js@2'
import { hasRecentAuthentication, json, preflight } from '../_shared/http.ts'

Deno.serve(async req => {
  const early = preflight(req)
  if (early) return early
  try {
    const authorization = req.headers.get('Authorization')
    if (!authorization?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401)
    const token = authorization.slice(7)
    const caller = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authorization } }
    })
    const { data, error } = await caller.auth.getUser(token)
    if (error || !data.user) return json({ error: 'Unauthorized' }, 401)
    if (!hasRecentAuthentication(token)) return json({ error: 'Recent sign-in required', code: 'reauthentication_required' }, 403)
    const input = await req.json().catch(() => null)
    if (input?.confirm !== true) return json({ error: 'Explicit confirmation required' }, 400)
    // The target identity comes only from the verified session, never the body.
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    for (let page = 0; page < 1000; page++) {
      const { data: objects, error: listError } = await admin.rpc('account_storage_objects', { p_user_id: data.user.id })
      if (listError) throw listError
      if (!objects?.length) break
      const buckets = new Map<string, string[]>()
      for (const object of objects as { bucket_id: string; name: string }[]) {
        buckets.set(object.bucket_id, [...(buckets.get(object.bucket_id) ?? []), object.name])
      }
      for (const [bucket, names] of buckets) {
        const { error: removeError } = await admin.storage.from(bucket).remove(names)
        if (removeError) throw removeError
      }
      if (page === 999) throw new Error('Storage cleanup limit reached')
    }
    const { error: deleteError } = await admin.auth.admin.deleteUser(data.user.id)
    if (deleteError) throw deleteError
    return json({ success: true })
  } catch {
    console.error('[delete-account] cleanup or deletion failed; retry is safe')
    return json({ error: 'Account deletion failed. Please retry or contact support.' }, 500)
  }
})
