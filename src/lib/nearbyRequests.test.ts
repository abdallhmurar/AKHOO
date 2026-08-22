import { describe, expect, it, vi } from 'vitest'
import type { HelpRequest } from '../types'

// nearbyRequests.ts imports distanceKm from ./location, which itself
// imports native-only modules (expo-location, expo-task-manager) and the
// Supabase client at module scope for functions this file doesn't
// exercise - same stub-before-import pattern as location.test.ts, so
// importing here in plain Node (vitest) doesn't try to touch a native
// bridge that isn't there.
vi.mock('expo-location', () => ({ Accuracy: { Balanced: 3 } }))
vi.mock('expo-task-manager', () => ({ defineTask: () => {} }))
vi.mock('./supabase', () => ({ supabase: { from: () => ({ select: () => ({ eq: () => Promise.resolve({ data: [] }) }) }) } }))

const { filterNearbyRequests } = await import('./nearbyRequests')

const CENTER = { latitude: 31.7683, longitude: 35.2137 } // Jerusalem

function makeRequest(overrides: Partial<HelpRequest> & { id: string }): HelpRequest {
  return {
    requester_id: 'other-user',
    service_type: 'battery',
    note: null,
    latitude: CENTER.latitude,
    longitude: CENTER.longitude,
    status: 'open',
    volunteer_id: null,
    created_at: new Date().toISOString(),
    accepted_at: null,
    completed_at: null,
    photo_url: null,
    awaiting_confirmation_at: null,
    confirmation_rejected_at: null,
    ...overrides
  }
}

describe('filterNearbyRequests', () => {
  it('excludes the caller\'s own request even if it is otherwise nearby', () => {
    const requests = [makeRequest({ id: '1', requester_id: 'me' })]
    expect(filterNearbyRequests(requests, 'me', CENTER)).toEqual([])
  })

  it('excludes a request outside the radius', () => {
    // ~111km per degree of latitude - well outside the default 20km radius.
    const farAway = makeRequest({ id: '1', latitude: CENTER.latitude + 1, longitude: CENTER.longitude })
    expect(filterNearbyRequests([farAway], 'me', CENTER)).toEqual([])
  })

  it('includes a request within the radius', () => {
    const nearby = makeRequest({ id: '1', latitude: CENTER.latitude + 0.01, longitude: CENTER.longitude })
    const result = filterNearbyRequests([nearby], 'me', CENTER)
    expect(result).toHaveLength(1)
    expect(result[0]!.id).toBe('1')
  })

  it('sorts by distance, nearest first', () => {
    const far = makeRequest({ id: 'far', latitude: CENTER.latitude + 0.15, longitude: CENTER.longitude })
    const near = makeRequest({ id: 'near', latitude: CENTER.latitude + 0.01, longitude: CENTER.longitude })
    const result = filterNearbyRequests([far, near], 'me', CENTER)
    expect(result.map(r => r.id)).toEqual(['near', 'far'])
  })

  it('produces no duplicate entries for a request list with no duplicates in', () => {
    const requests = [makeRequest({ id: '1' }), makeRequest({ id: '2' })]
    const result = filterNearbyRequests(requests, 'me', CENTER)
    expect(result).toHaveLength(2)
    expect(new Set(result.map(r => r.id)).size).toBe(2)
  })

  it('respects a custom radius', () => {
    const at5km = makeRequest({ id: '1', latitude: CENTER.latitude + 0.045, longitude: CENTER.longitude })
    expect(filterNearbyRequests([at5km], 'me', CENTER, 20)).toHaveLength(1)
    expect(filterNearbyRequests([at5km], 'me', CENTER, 1)).toHaveLength(0)
  })
})
