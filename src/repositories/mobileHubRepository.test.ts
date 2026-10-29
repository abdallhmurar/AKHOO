import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mobileHubRepository } from './mobileHubRepository'

type Operation = { name: string; args: unknown[] }
type Query = { table: string; operations: Operation[] }
type Result = { data?: unknown[] | null; count?: number; error?: Error | null }
const mock = vi.hoisted(() => ({ queries: [] as Query[], respond: (_query: Query): Result => ({ data: [] }) }))
vi.mock('../lib/supabase', () => ({ supabase: { from: (table: string) => {
  const query: Query = { table, operations: [] }
  mock.queries.push(query)
  const builder: Record<string, (...args: any[]) => any> = {}
  for (const name of ['select', 'eq', 'gte', 'or', 'order', 'range', 'limit', 'in']) {
    builder[name] = (...args: unknown[]) => { query.operations.push({ name, args }); return builder }
  }
  builder.then = (resolve, reject) => Promise.resolve(mock.respond(query)).then(resolve, reject)
  return builder
} } }))

const op = (query: Query, name: string) => query.operations.find(operation => operation.name === name)
const role = (query: Query) => op(query, 'eq')?.args[0]
const countQuery = (query: Query) => Boolean((op(query, 'select')?.args[1] as { head?: boolean } | undefined)?.head)
beforeEach(() => { mock.queries.length = 0; mock.respond = () => ({ data: [] }) })

describe('mobile hub real data', () => {
  it('keeps totals exact when more than one ledger page and 100 history rows exist', async () => {
    const ledger = Array.from({ length: 501 }, (_, id) => ({ id: String(id), request_id: `mission-${id}`, points: 10, created_at: '2026-10-29T10:00:00Z' }))
    mock.respond = query => {
      if (query.table === 'volunteer_point_transactions') {
        const [start, end] = op(query, 'range')!.args as [number, number]
        return { data: ledger.slice(start, end + 1) }
      }
      if (countQuery(query)) return { count: role(query) === 'volunteer_id' ? 501 : 3 }
      return { data: role(query) === 'volunteer_id' ? Array.from({ length: 101 }, (_, id) => ({ id: `mission-${id}`, status: 'completed', service_type: 'battery', completed_at: '2026-10-29T10:00:00Z', created_at: '2026-09-30T22:00:00Z' })) : [] }
    }
    const impact = await mobileHubRepository.impact('current-user', '2026-10-01T00:00:00Z')
    expect(impact.completed).toBe(501)
    expect(impact.received).toBe(3)
    expect(impact.earned).toBe(5010)
    expect(impact.entries.filter(entry => entry.type === 'given')).toHaveLength(100)
    expect(impact.entries.filter(entry => entry.type === 'points')).toHaveLength(100)
    expect(impact.entries.find(entry => entry.id === 'given-mission-0')).toMatchObject({ points: 10, occurredAt: '2026-10-29T10:00:00Z', missionId: 'mission-0' })
    expect(impact.historyLimited).toBe(true)
    expect(mock.queries.filter(query => query.table === 'volunteer_point_transactions').map(query => op(query, 'range')!.args)).toEqual([[0, 499], [500, 999]])
    // A mission created last month but completed this month contributes this month.
    for (const query of mock.queries.filter(countQuery)) expect(op(query, 'gte')!.args).toEqual(['completed_at', '2026-10-01T00:00:00Z'])
    for (const query of mock.queries.filter(query => query.table === 'help_requests' && !countQuery(query))) expect(op(query, 'or')!.args[0]).toContain('completed_at.gte.2026-10-01T00:00:00Z')
    for (const query of mock.queries) expect(query.operations.some(operation => operation.name === 'eq' && operation.args[1] === 'current-user')).toBe(true)
  })

  it('returns honest zeroes for empty history, with no date restriction for all time', async () => {
    expect(await mobileHubRepository.impact('current-user', null)).toEqual({ completed: 0, received: 0, earned: 0, entries: [], historyLimited: false })
    expect(mock.queries.some(query => op(query, 'gte') || op(query, 'or'))).toBe(false)
  })

  it('surfaces a failed ledger instead of displaying a misleading zero balance', async () => {
    mock.respond = query => query.table === 'volunteer_point_transactions' ? { error: new Error('Network unavailable') } : { data: [] }
    await expect(mobileHubRepository.impact('current-user', null)).rejects.toThrow('Network unavailable')
  })

  it('loads approved public offers with one lookup per unique partner', async () => {
    mock.respond = query => query.table === 'public_offers' ? { data: [{ id: 'one', partner_id: 'partner' }, { id: 'two', partner_id: 'partner' }] } : { data: [{ id: 'partner', name: 'Example' }] }
    const result = await mobileHubRepository.offers()
    expect(result.offers).toHaveLength(2)
    expect(result.partnersById.partner?.name).toBe('Example')
    expect(op(mock.queries.find(query => query.table === 'partners')!, 'in')!.args).toEqual(['id', ['partner']])
  })
})
