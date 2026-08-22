import { distanceKm } from './location'
import type { HelpRequest } from '../types'

export type NearbyRequest = HelpRequest & { distance: number }

// Pulled out of VolunteerScreen's loadRequests() so the actual filter/sort
// rules (self-exclusion, radius, ordering) are unit-testable independent of
// the network fetch, the realtime subscription, and the polling fallback
// added this round - all three of which just need to call this the same
// way after any fetch, regardless of what triggered it.
export function filterNearbyRequests(
  requests: HelpRequest[],
  userId: string,
  at: { latitude: number; longitude: number },
  radiusKm = 20
): NearbyRequest[] {
  return requests
    .filter(item => item.requester_id !== userId)
    .map(item => ({ ...item, distance: distanceKm(at.latitude, at.longitude, item.latitude, item.longitude) }))
    .filter(item => item.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance)
}
