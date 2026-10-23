import { describe, expect, it, vi } from 'vitest'
import { DEFAULT_PREFS, allowedUsers, deliver, isToggleable } from '../../supabase/functions/_shared/notifications'
import { nearbyVolunteers } from '../../supabase/functions/_shared/nearby'

// A scripted stand-in for the Supabase client: every query method returns the same builder, awaiting it yields
// the scripted result, and notification_log behaves like the real once-only table.
function fakeDb(script: { prefs?: Record<string, unknown>[]; devices?: { user_id: string; token: string; language: string | null }[]; logged?: Set<string> }) {
  const logged = script.logged ?? new Set<string>()
  const deleted: string[][] = []
  const rpcCalls: unknown[] = []
  const builder = (result: () => unknown): any => new Proxy({}, {
    get: (_t, prop) => prop === 'then' ? (ok: (v: unknown) => unknown, err: (e: unknown) => unknown) => Promise.resolve(result()).then(ok, err) : () => builder(result)
  })
  const db = {
    from(table: string) {
      if (table === 'notification_preferences') return builder(() => ({ data: script.prefs ?? [], error: null }))
      if (table === 'notification_log') return { upsert: (rows: { user_id: string; dedupe_key: string }[]) => builder(() => {
        const fresh = rows.filter(row => !logged.has(`${row.user_id}|${row.dedupe_key}`))
        fresh.forEach(row => logged.add(`${row.user_id}|${row.dedupe_key}`))
        return { data: fresh.map(row => ({ user_id: row.user_id })), error: null }
      }) }
      if (table === 'push_devices') return { select: () => builder(() => ({ data: script.devices ?? [], error: null })), delete: () => ({ in: async (_c: string, tokens: string[]) => { deleted.push(tokens); return { error: null } } }) }
      return builder(() => ({ data: [], error: null }))
    },
    rpc(name: string, args: { p_user_ids: string[] }) {
      rpcCalls.push({ name, args })
      return builder(() => ({ data: (script.devices ?? []).filter(device => args.p_user_ids.includes(device.user_id)), error: null }))
    }
  }
  return { db, logged, deleted, rpcCalls }
}
const sendAll = vi.fn(async (messages: { to: string }[]) => messages.map(message => ({ token: message.to, status: 'sent' as const, error: null })))

describe('notification preferences', () => {
  it('only the optional categories can be switched off', () => {
    for (const category of ['requests', 'mission', 'rewards', 'reminders', 'offers', 'announcements'] as const) expect(isToggleable(category)).toBe(true)
    for (const category of ['support', 'account', 'partner', 'admin'] as const) expect(isToggleable(category)).toBe(false)
  })
  it('promotional categories are off until the user opts in, essential ones are on', () => {
    expect(DEFAULT_PREFS).toEqual({ requests: true, mission: true, rewards: true, reminders: false, offers: false, announcements: true })
  })
  it('uses the default for users who never opened the settings and the stored choice for the others', () => {
    const rows = [{ user_id: 'b', rewards: false }, { user_id: 'c', reminders: true }]
    expect(allowedUsers('rewards', ['a', 'b', 'c'], rows)).toEqual(['a', 'c'])
    expect(allowedUsers('reminders', ['a', 'b', 'c'], rows)).toEqual(['c'])
    expect(allowedUsers('account', ['a', 'b'], rows)).toEqual(['a', 'b'])
  })
})

describe('deliver', () => {
  const devices = [
    { user_id: 'u1', token: 'ExponentPushToken[a]', language: 'en' },
    { user_id: 'u1', token: 'ExponentPushToken[b]', language: 'he' },
    { user_id: 'u2', token: 'ExponentPushToken[c]', language: null }
  ]
  it('sends each device the text in its own language, with the event in the data', async () => {
    const { db } = fakeDb({ devices })
    sendAll.mockClear()
    const result = await deliver(db, { event: 'helper_arrived', category: 'mission', userIds: ['u1', 'u2', 'u1'], data: { requestId: 'r1', missionChat: true } }, sendAll as never)
    const sent = sendAll.mock.calls[0]![0] as { to: string; title: string; data: Record<string, unknown>; sound: string }[]
    expect(sent.map(message => message.title)).toEqual(['Your volunteer has arrived', 'המתנדב הגיע', 'المتطوع وصل'])
    expect(sent[0]).toMatchObject({ sound: 'default', data: { requestId: 'r1', missionChat: true, event: 'helper_arrived' } })
    expect(result).toMatchObject({ attempted: 3, sent: 3 })
    expect(result.reachedUsers.sort()).toEqual(['u1', 'u2'])
  })
  it('skips users who switched the category off', async () => {
    const { db } = fakeDb({ devices, prefs: [{ user_id: 'u1', rewards: false }] })
    sendAll.mockClear()
    await deliver(db, { event: 'level_up', category: 'rewards', userIds: ['u1', 'u2'], vars: { level: 'x' } }, sendAll as never)
    expect((sendAll.mock.calls[0]![0] as { to: string }[]).map(message => message.to)).toEqual(['ExponentPushToken[c]'])
  })
  it('never sends the same notification twice to a user, even if the webhook is retried', async () => {
    const { db, logged } = fakeDb({ devices })
    sendAll.mockClear()
    const out = { event: 'no_volunteer' as const, category: 'mission' as const, userIds: ['u2'], dedupe: 'no_volunteer:r1' }
    expect((await deliver(db, out, sendAll as never)).sent).toBe(1)
    expect((await deliver(db, out, sendAll as never)).attempted).toBe(0)
    expect(sendAll).toHaveBeenCalledTimes(1)
    expect([...logged]).toEqual(['u2|no_volunteer:r1'])
  })
  it('fills language-specific variables per device', async () => {
    const { db } = fakeDb({ devices })
    sendAll.mockClear()
    await deliver(db, { event: 'request_still_open', category: 'requests', userIds: ['u1'], vars: lang => ({ service: lang === 'he' ? 'מצבר' : 'Battery' }) }, sendAll as never)
    expect((sendAll.mock.calls[0]![0] as unknown as { body: string }[]).map(message => message.body)).toEqual(['Battery. Can you help?', 'מצבר. אפשר לעזור?'])
  })
  it('uses the push-device table directly when a suspended user must still be told', async () => {
    const { db, rpcCalls } = fakeDb({ devices })
    sendAll.mockClear()
    await deliver(db, { event: 'account_banned', category: 'account', userIds: ['u2'], includeBanned: true }, sendAll as never)
    expect(rpcCalls).toEqual([])
    expect(sendAll).toHaveBeenCalledTimes(1)
  })
  it('removes tokens Expo reports as unregistered', async () => {
    const { db, deleted } = fakeDb({ devices })
    const send = vi.fn(async (messages: { to: string }[]) => messages.map(message => ({ token: message.to, status: message.to.includes('[b]') ? 'failed' as const : 'sent' as const, error: message.to.includes('[b]') ? 'DeviceNotRegistered' : null })))
    const result = await deliver(db, { event: 'helper_arrived', category: 'mission', userIds: ['u1'] }, send as never)
    expect(deleted).toEqual([['ExponentPushToken[b]']])
    expect(result.sent).toBe(1)
  })
  it('does nothing for an empty audience', async () => {
    const { db } = fakeDb({ devices })
    sendAll.mockClear()
    expect((await deliver(db, { event: 'helper_arrived', category: 'mission', userIds: [] }, sendAll as never)).attempted).toBe(0)
    expect(sendAll).not.toHaveBeenCalled()
  })
})

describe('nearbyVolunteers', () => {
  const now = Date.parse('2026-10-23T12:00:00Z')
  const rows = [
    { user_id: 'near', latitude: 31.78, longitude: 35.22 },
    { user_id: 'far', latitude: 32.5, longitude: 35.5 },
    { user_id: 'requester', latitude: 31.78, longitude: 35.22 },
    { user_id: 'released', latitude: 31.78, longitude: 35.22 },
    { user_id: 'nolocation', latitude: null, longitude: null }
  ]
  const db = { from: () => ({ select: () => ({ eq: () => ({ gt: () => ({ order: () => ({ range: async () => ({ data: rows, error: null }) }) }) }) }) }) }
  it('keeps volunteers within 20 km and drops the requester, those who released it and those without a location', async () => {
    const result = await nearbyVolunteers(db, { id: 'r', requester_id: 'requester', latitude: 31.78, longitude: 35.22 }, ['released'], now)
    expect(result.nearby).toEqual(['near'])
    expect(result.candidateCount).toBe(5)
  })
})
