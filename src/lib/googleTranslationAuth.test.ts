import { generateKeyPairSync, verify } from 'node:crypto'
import { describe, expect, it, vi } from 'vitest'
import { createGoogleTranslationAuth } from '../../supabase/functions/_shared/googleTranslationAuth'
import { translateArabic } from '../../supabase/functions/_shared/translation'

describe('Google translation authentication', () => {
  it('signs scoped tokens, shares concurrent refreshes and renews before expiry', async () => {
    const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
    const account = JSON.stringify({ type: 'service_account', client_email: 'test@example.iam.gserviceaccount.com', private_key: privateKey.export({ type: 'pkcs8', format: 'pem' }) })
    let time = 1800000000000
    const request = vi.fn(async (url: string | URL | Request, options?: RequestInit) => {
      expect(url).toBe('https://oauth2.googleapis.com/token')
      const jwt = new URLSearchParams(String(options?.body)).get('assertion')!
      const parts = jwt.split('.')
      expect(verify('RSA-SHA256', Buffer.from(parts.slice(0, 2).join('.')), publicKey, Buffer.from(parts[2]!, 'base64url'))).toBe(true)
      expect(JSON.parse(Buffer.from(parts[1]!, 'base64url').toString())).toMatchObject({ scope: 'https://www.googleapis.com/auth/cloud-translation', aud: String(url), iat: time / 1000, exp: time / 1000 + 3600 })
      return Response.json({ access_token: 'test-token', expires_in: 3600 })
    })
    const token = createGoogleTranslationAuth(account, request, () => time)
    expect(await Promise.all([token(), token()])).toEqual(['test-token', 'test-token'])
    await token()
    expect(request).toHaveBeenCalledTimes(1)
    time += 3540000
    await token()
    expect(request).toHaveBeenCalledTimes(2)
  })
  it('sanitizes credential errors', async () => {
    await expect(createGoogleTranslationAuth('private-invalid-json')()).rejects.toThrow('Google translation authentication unavailable')
  })
  it('uses the bearer token without an API key in provider requests', async () => {
    const request = vi.fn(async (_url: string | URL | Request, options?: RequestInit) => {
      expect(new Headers(options?.headers).get('Authorization')).toBe('Bearer test-token')
      expect(new Headers(options?.headers).has('X-Goog-Api-Key')).toBe(false)
      return Response.json({ data: { translations: [{ translatedText: 'Welcome' }] } })
    })
    await translateArabic({ body: 'مرحبا' }, { accessToken: 'test-token' }, request)
    expect(request).toHaveBeenCalledTimes(2)
  })
})
