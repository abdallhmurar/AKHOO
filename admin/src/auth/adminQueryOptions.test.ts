import { describe, it, expect } from 'vitest'
import { QueryClient } from '@tanstack/react-query'
import { adminQueryOptions } from './adminQueryOptions'

describe('admin identity isolation', () => {
  it('checks a second account independently of a cached admin result', async () => {
    const client = new QueryClient()
    expect(await client.fetchQuery(adminQueryOptions('admin', async () => true))).toBe(true)
    expect(await client.fetchQuery(adminQueryOptions('ordinary', async () => false))).toBe(false)
    client.clear()
  })
  it('rechecks revoked permissions instead of trusting five-minute-old access', async () => {
    const client = new QueryClient()
    await client.fetchQuery(adminQueryOptions('admin', async () => true))
    expect(await client.fetchQuery(adminQueryOptions('admin', async () => false))).toBe(false)
    client.clear()
  })
})
