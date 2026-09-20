import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn(), getSession: vi.fn(), upsert: vi.fn(), defineTask: vi.fn() }))
vi.mock('@react-native-async-storage/async-storage', () => ({ default: mocks }))
vi.mock('expo-task-manager', () => ({ defineTask: mocks.defineTask }))
vi.mock('expo-location', () => ({ Accuracy: { Balanced: 3 } }))
vi.mock('./supabase', () => ({ supabase: { auth: { getSession: mocks.getSession }, from: () => ({ upsert: mocks.upsert }) } }))
beforeEach(() => {
  vi.stubGlobal('__DEV__', false)
  mocks.upsert.mockClear().mockResolvedValue({ error: null })
  mocks.getItem.mockResolvedValue('restored-user')
  mocks.getSession.mockResolvedValue({ data: { session: { user: { id: 'restored-user' } } } })
})
describe('headless location identity', () => {
  const event = { data: { locations: [{ coords: { latitude: 31.77, longitude: 35.21 } }] } }
  it('restores the authorized identity in a fresh background JS runtime', async () => {
    await import('./location')
    const task = mocks.defineTask.mock.calls[0]![1]
    await task(event)
    expect(mocks.upsert).toHaveBeenCalledWith(expect.objectContaining({ user_id: 'restored-user', latitude: 31.77 }))
    expect(mocks.upsert.mock.calls[0]![0]).not.toHaveProperty('is_available')
  })
  it('never writes the previous user location after logout or an account change', async () => {
    await import('./location')
    mocks.getSession.mockResolvedValue({ data: { session: { user: { id: 'different-user' } } } })
    await mocks.defineTask.mock.calls[0]![1](event)
    expect(mocks.upsert).not.toHaveBeenCalled()
  })
})
