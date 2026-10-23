import { readAll } from './pagination.ts'

export function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (value: number) => (value * Math.PI) / 180
  const earth = 6371
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return earth * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export const NEARBY_RADIUS_KM = 20

// Who counts as reachable for a push: a volunteer whose app refreshed their availability in the last
// 24 hours. This used to mirror the 20-minute bound of the "request read relevant" RLS policy
// (0007_volunteer_staleness.sql), but a volunteer's availability and position only refresh while the
// app is open (Android has no background location, see src/lib/location.ts), so with 20 minutes a
// push could only reach someone who was already looking at the helper screen, which defeats a push.
// Opening the app from the notification refreshes the volunteer's heartbeat, so the request is
// readable again by the time they see it. Stale rows beyond a day are still skipped (uninstalled
// apps that never switched availability off).
export const PUSH_FRESHNESS_MS = 24 * 60 * 60 * 1000

type Volunteer = { user_id: string; latitude: number | null; longitude: number | null }
type Request = { id: string; requester_id: string; latitude: number; longitude: number }

// deno-lint-ignore no-explicit-any
type Db = any

// Available volunteers within the radius of a request, never the requester and never anyone in
// `exclude` (for example the volunteers who released this very request).
export async function nearbyVolunteers(db: Db, request: Request, exclude: string[] = [], now = Date.now()) {
  const volunteers = await readAll<Volunteer>((from, to) => db
    .from('volunteer_profiles')
    .select('user_id, latitude, longitude')
    .eq('is_available', true)
    .gt('updated_at', new Date(now - PUSH_FRESHNESS_MS).toISOString())
    .order('user_id').range(from, to))
  const skip = new Set([request.requester_id, ...exclude])
  const nearby = volunteers.filter(v => {
    if (v.latitude == null || v.longitude == null || skip.has(v.user_id)) return false
    return distanceKm(request.latitude, request.longitude, v.latitude, v.longitude) <= NEARBY_RADIUS_KM
  })
  return { candidateCount: volunteers.length, nearby: nearby.map(v => v.user_id) }
}
