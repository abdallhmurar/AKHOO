import { describe, expect, it, vi } from 'vitest'
import { loadEdgeFunction } from '../../test/edgeFunction'
import { hasRecentAuthentication } from '../../supabase/functions/_shared/http'
import { sendPushMessages } from '../../supabase/functions/_shared/push'

function token(timestamp: number, method = 'oauth') {
  return `header.${Buffer.from(JSON.stringify({ iat: Date.now() / 1000, amr: [{ timestamp, method }] })).toString('base64url')}.signature`
}
function request(body: unknown = { confirm: true }, timestamp = Date.now() / 1000) {
  return new Request('https://test.invalid/delete-account', { method: 'POST', headers: { Authorization: `Bearer ${token(timestamp)}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
}
describe('browser Edge access', () => {
  it.each(['delete-account','send-broadcast-notification','geocode','notify-new-message','notify-new-request'])('%s rejects unauthenticated POST before accessing services', async name => {
    const client = vi.fn(() => { throw new Error('Must not access database') })
    const response = await loadEdgeFunction(name, client)(new Request('https://test.invalid', { method: 'POST', body: '{}' }))
    expect(response.status).toBe(401)
    expect(client).not.toHaveBeenCalled()
  })
  for (const name of ['delete-account', 'send-broadcast-notification', 'geocode']) {
    it(`${name} accepts OPTIONS without touching auth or data`, async () => {
      const client = vi.fn(() => { throw new Error('Must not access database') })
      const response = await loadEdgeFunction(name, client)(new Request('https://test.invalid', { method: 'OPTIONS' }))
      expect(response.status).toBe(204)
      expect(response.headers.get('access-control-allow-headers')).toContain('authorization')
      expect(response.headers.get('access-control-allow-origin')).toBe('*')
      expect(client).not.toHaveBeenCalled()
    })
  }
})
describe('account deletion', () => {
  it('requires a fresh authentication method, not a refreshed access token', () => {
    expect(hasRecentAuthentication(token(Date.now()/1000 - 3600))).toBe(false)
    expect(hasRecentAuthentication(token(Date.now()/1000))).toBe(true)
    expect(hasRecentAuthentication(token(Date.now()/1000, 'token_refresh'))).toBe(false)
  })
  it('removes files before deleting only the authenticated identity', async () => {
    const operations: string[] = []
    const rpc = vi.fn().mockResolvedValueOnce({ data: [{ bucket_id: 'mission-chat', name: 'caller/request/photo.jpg' }] }).mockResolvedValueOnce({ data: [] })
    const remove = vi.fn(async () => { operations.push('remove'); return { error: null } })
    const deleteUser = vi.fn(async () => { operations.push('delete'); return { error: null } })
    const client = { rpc, storage: { from: () => ({ remove }) }, auth: { getUser: async () => ({ data: { user: { id: 'caller' } }, error: null }), admin: { deleteUser } } }
    const response = await loadEdgeFunction('delete-account', () => client)(request({ confirm: true, user_id: 'victim' }))
    expect(response.status).toBe(200)
    expect(operations).toEqual(['remove','delete'])
    expect(rpc).toHaveBeenCalledWith('account_storage_objects', { p_user_id: 'caller' })
    expect(deleteUser).toHaveBeenCalledWith('caller')
  })
  it('keeps the account when storage cleanup fails', async () => {
    const deleteUser = vi.fn()
    const client = { rpc: async () => ({ data: [{ bucket_id: 'avatars', name: 'caller/avatar.jpg' }] }), storage: { from: () => ({ remove: async () => ({ error: new Error('offline') }) }) }, auth: { getUser: async () => ({ data: { user: { id: 'caller' } } }), admin: { deleteUser } } }
    expect((await loadEdgeFunction('delete-account', () => client)(request())).status).toBe(500)
    expect(deleteUser).not.toHaveBeenCalled()
  })
  it('does not clean up for unverified, stale, or unconfirmed calls', async () => {
    const rpc = vi.fn()
    const client = { rpc, auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'caller' } } }) } }
    const handler = loadEdgeFunction('delete-account', () => client)
    expect((await handler(request({}, Date.now()/1000 - 3600))).status).toBe(403)
    expect((await handler(request({}))).status).toBe(400)
    client.auth.getUser.mockResolvedValue({ data: { user: null } } as never)
    expect((await handler(request())).status).toBe(401)
    expect(rpc).not.toHaveBeenCalled()
  })
})
describe('Expo delivery results', () => {
  it('splits 205 devices into legal batches and does not count ticket errors as accepted', async () => {
    const sizes: number[] = []
    const send = vi.fn(async (_url: unknown, init?: RequestInit) => {
      const messages = JSON.parse(String(init?.body)) as unknown[]
      sizes.push(messages.length)
      return new Response(JSON.stringify({ data: messages.map((_, i) => i === 0 ? { status: 'error', details: { error: 'DeviceNotRegistered' } } : { status: 'ok' }) }))
    }) as unknown as typeof fetch
    const results = await sendPushMessages(Array.from({ length: 205 }, (_, i) => ({ to: String(i), title: 'test', body: 'test' })), send)
    expect(sizes).toEqual([100,100,5])
    expect(results.filter(r => r.status === 'sent')).toHaveLength(202)
    expect(results.filter(r => r.error === 'DeviceNotRegistered')).toHaveLength(3)
  })
  it('keeps ambiguous network outcomes distinct from safely retryable rejections', async () => {
    const messages = [{ to: 'test', title: 'test', body: 'test' }]
    expect((await sendPushMessages(messages, vi.fn().mockRejectedValue(new Error('timeout'))))[0]?.status).toBe('unknown')
    expect((await sendPushMessages(messages, vi.fn().mockResolvedValue(new Response('', { status: 429 }))))[0]?.status).toBe('failed')
  })
})
