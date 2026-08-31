import { describe, expect, it } from 'vitest'
import { accountRoutes, communityRoutes, helperRoutes, publicRoutes, requesterRoutes, resolveLaunchRoute, tabRoutes } from './routes'

describe('SANAD route architecture', () => {
  it('contains four product tabs in the approved order', () => {
    expect(tabRoutes).toEqual(['/(tabs)', '/(tabs)/community', '/(tabs)/activity', '/(tabs)/account'])
  })

  it('keeps route names unique across static screens', () => {
    const paths = [...publicRoutes, ...tabRoutes, ...requesterRoutes, ...helperRoutes, ...communityRoutes, ...accountRoutes]
    expect(new Set(paths).size).toBe(paths.length)
  })

  it('applies session guards deterministically - no first-launch language gate', () => {
    expect(resolveLaunchRoute({ bootstrapped: false, hasSession: false, restricted: false })).toBe(null)
    expect(resolveLaunchRoute({ bootstrapped: true, hasSession: false, restricted: false })).toBe('/welcome')
    expect(resolveLaunchRoute({ bootstrapped: true, hasSession: true, restricted: true })).toBe('/restricted')
    expect(resolveLaunchRoute({ bootstrapped: true, hasSession: true, restricted: false })).toBe('/(tabs)')
  })
})
