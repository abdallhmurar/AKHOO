import { beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClient } from '@tanstack/react-query'
import { partnerRepository } from '../../repositories/partnerRepository'
import { partnerAccessQueryOptions } from './partnerAccessQuery'
import { resolvePartnerAccessState } from './partnerAccessState'
import type { PartnerAccess } from '../../types'

const { rpc, maybeSingle, abortSignal } = vi.hoisted(() => ({ rpc: vi.fn(), maybeSingle: vi.fn(), abortSignal: vi.fn() }))
vi.mock('../../lib/supabase', () => ({ supabase: { rpc } }))

const access: PartnerAccess = {
  id: 'relation', user_id: 'owner', partner_id: 'business', role: 'owner', is_active: true,
  created_at: '', created_by: 'admin', updated_at: '', business_name: 'Linked business'
}
beforeEach(() => {
  vi.clearAllMocks()
  const query = { maybeSingle, abortSignal }
  rpc.mockReturnValue(query)
  abortSignal.mockReturnValue(query)
  maybeSingle.mockResolvedValue({ data: access, error: null })
})

describe('Partner relationship repository and cache', () => {
  it('uses the caller-bound RPC, forwards cancellation and returns real context', async () => {
    const signal = new AbortController().signal
    expect(await partnerRepository.activeAccess('owner', signal)).toEqual(access)
    expect(rpc).toHaveBeenCalledWith('get_my_partner_context')
    expect(abortSignal).toHaveBeenCalledWith(signal)
  })
  it('returns no access for ordinary/disabled users and rejects another session or failed requests', async () => {
    maybeSingle.mockResolvedValueOnce({ data: null, error: null })
    expect(await partnerRepository.activeAccess('ordinary')).toBeNull()
    maybeSingle.mockResolvedValueOnce({ data: { ...access, is_active: false }, error: null })
    expect(await partnerRepository.activeAccess('owner')).toBeNull()
    await expect(partnerRepository.activeAccess('other')).rejects.toMatchObject({ code: 'auth' })
    maybeSingle.mockResolvedValueOnce({ data: null, error: { code: '42501', message: 'Not authorized' } })
    await expect(partnerRepository.activeAccess('owner')).rejects.toMatchObject({ code: 'forbidden' })
  })
  it('refetches revocations and isolates cached context by user', async () => {
    const client = new QueryClient()
    const options = partnerAccessQueryOptions('owner')
    expect(await client.fetchQuery(options)).toEqual(access)
    maybeSingle.mockResolvedValueOnce({ data: null, error: null })
    expect(await client.fetchQuery(options)).toBeNull()
    expect(client.getQueryData(partnerAccessQueryOptions('other').queryKey)).toBeUndefined()
    expect(partnerAccessQueryOptions(null).enabled).toBe(false)
    client.clear()
  })
})

describe('Partner access decision', () => {
  const ready = { userId: 'owner', restricted: false, loading: false, fetching: false, failed: false, data: access }
  it.each(['owner', 'staff'] as const)('authorizes active %s', role => {
    expect(resolvePartnerAccessState({ ...ready, data: { ...access, role } }).status).toBe('authorized')
  })
  it.each([
    { userId: null }, { restricted: true }, { data: null },
    { data: { ...access, is_active: false } }, { userId: 'different-user' }
  ])('denies unavailable or foreign access: %j', override => {
    expect(resolvePartnerAccessState({ ...ready, ...override })).toEqual({ status: 'denied', access: null })
  })
  it('never exposes stale context while refreshing or after a failed refresh', () => {
    expect(resolvePartnerAccessState({ ...ready, fetching: true })).toEqual({ status: 'checking', access: null })
    expect(resolvePartnerAccessState({ ...ready, failed: true })).toEqual({ status: 'error', access: null })
  })
})
