import { beforeEach, describe, expect, it, vi } from 'vitest'
import { realtimeSubscription } from './realtimeSubscription'
const mock = vi.hoisted(() => ({ channel: vi.fn(), removeChannel: vi.fn() }))
vi.mock('./supabase', () => ({ supabase: mock }))
describe('realtime observer ownership', () => {
  beforeEach(() => { vi.clearAllMocks(); mock.channel.mockImplementation((topic: string) => { const channel = { topic, subscribe: () => channel }; return channel }) })
  it('keeps a second observer subscribed when the first unmounts', () => {
    const stopFirst = realtimeSubscription('mission:one', channel => channel)
    const stopSecond = realtimeSubscription('mission:one', channel => channel)
    expect(mock.channel.mock.calls[0]![0]).not.toBe(mock.channel.mock.calls[1]![0])
    stopFirst()
    expect(mock.removeChannel).toHaveBeenCalledTimes(1)
    expect(mock.removeChannel).toHaveBeenCalledWith(mock.channel.mock.results[0]!.value)
    stopSecond()
    expect(mock.removeChannel).toHaveBeenCalledTimes(2)
  })
})
