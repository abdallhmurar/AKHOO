import { describe, it, expect } from 'vitest'
import { fetchPage } from './pagination'

describe('fetchPage', () => {
  it('computes the correct from/to range for a given page and pageSize', async () => {
    const calls: { from: number; to: number }[] = []
    await fetchPage(
      async (from, to) => {
        calls.push({ from, to })
        return { data: [], count: 0, error: null }
      },
      2,
      20
    )
    expect(calls).toEqual([{ from: 40, to: 59 }])
  })

  it('returns rows/total from the query result, defaulting nulls', async () => {
    const result = await fetchPage(async () => ({ data: null, count: null, error: null }), 0, 10)
    expect(result).toEqual({ rows: [], total: 0 })
  })

  it('throws when the query returns an error', async () => {
    await expect(fetchPage(async () => ({ data: null, count: null, error: { message: 'boom' } }), 0, 10)).rejects.toThrow('boom')
  })
})
