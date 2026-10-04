const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const SCOPE = 'https://www.googleapis.com/auth/cloud-translation'

function base64url(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

// Server-only. Cache the short-lived, translation-scoped token; never expose
// a private key or access token in an endpoint response or an error message.
export function createGoogleTranslationAuth(serviceAccountJSON: string, request: typeof fetch = fetch, now = Date.now) {
  let cached: { token: string; expiresAt: number } | undefined
  let pending: Promise<string> | undefined

  async function refresh(): Promise<string> {
    try {
      const account = JSON.parse(serviceAccountJSON)
      if (account.type !== 'service_account' || typeof account.client_email !== 'string' || !account.client_email.endsWith('.iam.gserviceaccount.com') || typeof account.private_key !== 'string') throw new Error()
      const issuedAt = Math.floor(now() / 1000)
      const encode = (value: unknown) => base64url(new TextEncoder().encode(JSON.stringify(value)))
      const unsigned = `${encode({ alg: 'RS256', typ: 'JWT' })}.${encode({ iss: account.client_email, scope: SCOPE, aud: TOKEN_URL, iat: issuedAt, exp: issuedAt + 3600 })}`
      const pem = account.private_key.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, '')
      const key = await crypto.subtle.importKey('pkcs8', Uint8Array.from(atob(pem), char => char.charCodeAt(0)), { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign'])
      const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(unsigned))
      const response = await request(TOKEN_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${unsigned}.${base64url(new Uint8Array(signature))}` }),
        signal: AbortSignal.timeout(15000)
      })
      if (!response.ok) throw new Error()
      const result = await response.json()
      if (typeof result.access_token !== 'string' || !result.access_token || typeof result.expires_in !== 'number' || result.expires_in < 120) throw new Error()
      cached = { token: result.access_token, expiresAt: now() + Math.min(result.expires_in, 3600) * 1000 }
      return cached.token
    } catch { throw new Error('Google translation authentication unavailable') }
  }

  return async (): Promise<string> => {
    if (cached && now() < cached.expiresAt - 60000) return cached.token
    if (!pending) pending = refresh().finally(() => { pending = undefined })
    return pending
  }
}
