import { createClient } from 'jsr:@supabase/supabase-js@2'
import { json, preflight } from '../_shared/http.ts'

Deno.serve(async req => {
  const early = preflight(req)
  if (early) return early
  try {
    const authorization = req.headers.get('Authorization')
    if (!authorization) return json({ error: 'Unauthorized' }, 401)
    const caller = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authorization } } })
    const { data: user, error: authError } = await caller.auth.getUser()
    if (authError || !user.user) return json({ error: 'Unauthorized' }, 401)
    const { data: banned, error: bannedError } = await caller.rpc('is_banned')
    if (bannedError || banned) return json({ error: 'Not authorized' }, 403)
    const input = await req.json().catch(() => null)
    const params = new URLSearchParams({ format: 'json', limit: '5' })
    let route: string
    if (typeof input?.query === 'string' && input.query.trim().length >= 3 && input.query.length <= 200) {
      route = 'search'
      params.set('q', input.query.trim())
    } else if (typeof input?.latitude === 'number' && typeof input?.longitude === 'number' && Number.isFinite(input.latitude) && Number.isFinite(input.longitude) && Math.abs(input.latitude) <= 90 && Math.abs(input.longitude) <= 180) {
      route = 'reverse'
      params.set('lat', input.latitude.toFixed(5)); params.set('lon', input.longitude.toFixed(5))
    } else return json({ error: 'Invalid search' }, 400)
    // A server-side setting allows changing provider without a mobile update.
    const base = Deno.env.get('GEOCODING_BASE_URL') ?? 'https://nominatim.openstreetmap.org'
    const key = `${base}/${route}?${params}`
    const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: cached, error: cacheError } = await db.rpc('lookup_geocode_cache', { p_key: key })
    if (cacheError) throw cacheError
    if (cached !== null) return json(cached)
    const { data: slot, error: slotError } = await db.rpc('claim_geocode_slot')
    if (slotError) throw slotError
    if (!slot) return json({ error: 'Please wait a moment before searching again' }, 429)
    const response = await fetch(key, { headers: { Accept: 'application/json', 'User-Agent': 'AKHOO/2.0 (community assistance; support: +972509956046)' }, signal: AbortSignal.timeout(8000) })
    if (!response.ok) return json({ error: 'Address search temporarily unavailable' }, 503)
    const result = await response.json()
    const { error: saveError } = await db.rpc('save_geocode_cache', { p_key: key, p_result: result })
    if (saveError) throw saveError
    return json(result)
  } catch { return json({ error: 'Address search temporarily unavailable' }, 503) }
})
