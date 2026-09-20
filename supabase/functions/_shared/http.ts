export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Cache-Control': 'no-store'
}
export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}
export function preflight(req: Request) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)
  return null
}
// getUser must verify this exact JWT BEFORE inspecting these claims. A token
// refresh changes iat, but must not count as a fresh sign-in for deletion.
export function hasRecentAuthentication(verifiedToken: string, now = Date.now()) {
  try {
    const payload = verifiedToken.split('.')[1]!
    const claims = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
    return Array.isArray(claims.amr) && claims.amr.some((entry: { method?: string; timestamp?: number }) => {
      const age = now / 1000 - Number(entry.timestamp)
      return ['password', 'oauth', 'otp', 'totp'].includes(entry.method ?? '') && age >= -30 && age <= 600
    })
  } catch { return false }
}
