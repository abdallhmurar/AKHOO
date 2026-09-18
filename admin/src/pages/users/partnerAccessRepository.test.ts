import { beforeEach, describe, expect, it, vi } from 'vitest'
import { partnerAccessRepository } from './partnerAccessRepository'

const { rpc, from, select, eq, maybeSingle } = vi.hoisted(() => ({ rpc: vi.fn(), from: vi.fn(), select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn() }))
vi.mock('../../lib/supabase', () => ({ supabase: { rpc, from } }))
beforeEach(() => {
  vi.clearAllMocks()
  rpc.mockResolvedValue({ error: null })
  from.mockReturnValue({ select })
  select.mockReturnValue({ eq })
  eq.mockReturnValue({ maybeSingle })
})

describe('Admin Partner access', () => {
  it('reads the selected user with linked business context, including disabled access', async () => {
    const row = { user_id: 'user', is_active: false, partner: { name: 'Business' } }
    maybeSingle.mockResolvedValue({ data: row, error: null })
    expect(await partnerAccessRepository.get('user')).toEqual(row)
    expect(from).toHaveBeenCalledWith('partner_users')
    expect(eq).toHaveBeenCalledWith('user_id', 'user')
  })
  it.each([true, false])('saves business, role and active=%s through the authorized RPC', async isActive => {
    await partnerAccessRepository.set({ userId: 'user', partnerId: 'business', role: 'staff', isActive })
    expect(rpc).toHaveBeenCalledWith('admin_set_partner_access', { p_user_id: 'user', p_partner_id: 'business', p_role: 'staff', p_is_active: isActive })
    expect(from).not.toHaveBeenCalled()
  })
  it('revokes through the server without deleting the relationship', async () => {
    await partnerAccessRepository.revoke('user')
    expect(rpc).toHaveBeenCalledWith('admin_revoke_partner_access', { p_user_id: 'user' })
    expect(from).not.toHaveBeenCalled()
  })
  it('propagates failed reads/grants/revocations', async () => {
    const error = new Error('Not authorized')
    maybeSingle.mockResolvedValue({ data: null, error })
    rpc.mockResolvedValue({ error })
    await expect(partnerAccessRepository.get('user')).rejects.toBe(error)
    await expect(partnerAccessRepository.set({ userId: 'user', partnerId: 'business', role: 'owner', isActive: true })).rejects.toBe(error)
    await expect(partnerAccessRepository.revoke('user')).rejects.toBe(error)
  })
})
