import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn(), register: vi.fn(), enabled: vi.fn(), getSession: vi.fn(), rpc: vi.fn() }))
vi.mock('@react-native-async-storage/async-storage', () => ({ default: mocks }))
vi.mock('../lib/notifications', () => ({ registerForPushNotificationsAsync: mocks.register }))
vi.mock('../lib/notificationPreference', () => ({ getNotificationsEnabled: mocks.enabled }))
vi.mock('../lib/supabase', () => ({ supabase: { rpc: mocks.rpc, auth: { getSession: mocks.getSession } } }))
beforeEach(() => {
  vi.clearAllMocks()
  mocks.getItem.mockResolvedValue('ExpoPushToken[current]')
  mocks.setItem.mockResolvedValue(undefined)
  mocks.removeItem.mockResolvedValue(undefined)
  mocks.enabled.mockResolvedValue(true)
  mocks.register.mockResolvedValue('ExpoPushToken[current]')
  mocks.getSession.mockResolvedValue({ data: { session: { user: { id: 'user' } } } })
  mocks.rpc.mockResolvedValue({ error: null })
})
describe('device push lifecycle', () => {
  it('saves disabled consent on the server without asking OS permission again', async () => {
    const { syncPushRegistration } = await import('./pushRegistration')
    mocks.enabled.mockResolvedValue(false)
    await syncPushRegistration('user')
    expect(mocks.register).not.toHaveBeenCalled()
    expect(mocks.rpc).toHaveBeenCalledWith('register_push_device', { p_token: 'ExpoPushToken[current]', p_enabled: false })
  })
  it('does not attach an old account registration to a new session', async () => {
    const { syncPushRegistration } = await import('./pushRegistration')
    mocks.getSession.mockResolvedValue({ data: { session: { user: { id: 'different' } } } })
    await syncPushRegistration('user')
    expect(mocks.rpc).not.toHaveBeenCalled()
  })
  it('removes an existing token when OS notification permission is revoked', async () => {
    const { syncPushRegistration } = await import('./pushRegistration')
    mocks.register.mockResolvedValue(null)
    await syncPushRegistration('user')
    expect(mocks.rpc).toHaveBeenCalledWith('unregister_push_device', { p_token: 'ExpoPushToken[current]' })
  })
  it('serializes a slow registration before logout so the final state is unregistered', async () => {
    const { syncPushRegistration, unregisterCurrentDevice } = await import('./pushRegistration')
    let finish: (value: string) => void = () => {}
    mocks.register.mockReturnValue(new Promise<string>(resolve => { finish = resolve }))
    const registration = syncPushRegistration('user')
    const logout = unregisterCurrentDevice()
    await vi.waitFor(() => expect(mocks.register).toHaveBeenCalled())
    finish('ExpoPushToken[current]')
    await Promise.all([registration, logout])
    expect(mocks.rpc.mock.calls.map(call => call[0])).toEqual(['register_push_device','unregister_push_device'])
  })
})
