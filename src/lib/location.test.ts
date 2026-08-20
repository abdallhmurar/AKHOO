import { describe, expect, it, vi } from 'vitest'

// location.ts imports native-only modules (expo-location, expo-task-manager)
// and the Supabase client at module scope purely to support the
// permission/background-tracking functions this file doesn't test - stub
// them out so importing the module in plain Node (vitest) doesn't try to
// touch a native bridge that isn't there.
vi.mock('expo-location', () => ({ Accuracy: { Balanced: 3 } }))
vi.mock('expo-task-manager', () => ({ defineTask: () => {} }))
vi.mock('./supabase', () => ({ supabase: { from: () => ({ select: () => ({ eq: () => Promise.resolve({ data: [] }) }) }) } }))

const { distanceKm, isWithinAnyZone } = await import('./location')

describe('distanceKm', () => {
  it('returns ~0 for the same point', () => {
    expect(distanceKm(31.7683, 35.2137, 31.7683, 35.2137)).toBeCloseTo(0, 5)
  })

  it('matches a known real-world distance (Jerusalem to Tel Aviv, ~54km)', () => {
    const km = distanceKm(31.7683, 35.2137, 32.0853, 34.7818)
    expect(km).toBeGreaterThan(50)
    expect(km).toBeLessThan(58)
  })

  it('is symmetric regardless of argument order', () => {
    const a = distanceKm(31.7683, 35.2137, 32.0853, 34.7818)
    const b = distanceKm(32.0853, 34.7818, 31.7683, 35.2137)
    expect(a).toBeCloseTo(b, 9)
  })
})

describe('isWithinAnyZone', () => {
  const jerusalemZone = { center_lat: 31.7683, center_lng: 35.2137, radius_km: 15 }

  it('is true for a point at the zone center', () => {
    expect(isWithinAnyZone(31.7683, 35.2137, [jerusalemZone])).toBe(true)
  })

  it('is true for a point inside the radius', () => {
    // ~5km north of the zone center, well inside a 15km radius.
    expect(isWithinAnyZone(31.813, 35.2137, [jerusalemZone])).toBe(true)
  })

  it('is false for a point well outside every zone (Tel Aviv, ~54km away)', () => {
    expect(isWithinAnyZone(32.0853, 34.7818, [jerusalemZone])).toBe(false)
  })

  it('is false when there are no active zones at all', () => {
    expect(isWithinAnyZone(31.7683, 35.2137, [])).toBe(false)
  })

  it('is true if the point falls inside any one of several zones', () => {
    const farAwayZone = { center_lat: 0, center_lng: 0, radius_km: 5 }
    expect(isWithinAnyZone(31.7683, 35.2137, [farAwayZone, jerusalemZone])).toBe(true)
  })
})
