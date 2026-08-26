import { describe, expect, it } from 'vitest'
import { accountRoutes, communityRoutes, helperRoutes, publicRoutes, requesterRoutes, resolveLaunchRoute, tabRoutes } from './routes'

describe('SANAD V2 route architecture', () => {
  it('contains four product tabs in the approved order', () => {
    expect(tabRoutes).toEqual(['/(tabs)', '/(tabs)/community', '/(tabs)/activity', '/(tabs)/account'])
  })

  it('contains every requester flow step in order', () => {
    expect(requesterRoutes).toEqual([
      '/requester/emergency', '/requester/category', '/requester/scenario', '/requester/details',
      '/requester/media', '/requester/location', '/requester/review', '/requester/matching', '/requester/assigned'
    ])
  })

  it('keeps route names unique across static screens', () => {
    const paths = [...publicRoutes, ...tabRoutes, ...requesterRoutes, ...helperRoutes, ...communityRoutes, ...accountRoutes]
    expect(new Set(paths).size).toBe(paths.length)
  })

  it('applies first-launch and session guards deterministically', () => {
    expect(resolveLaunchRoute({ bootstrapped: true, hasSelectedLanguage: false, hasSession: false, restricted: false, sessionExpired: false })).toBe('/language')
    expect(resolveLaunchRoute({ bootstrapped: true, hasSelectedLanguage: true, hasSession: false, restricted: false, sessionExpired: false })).toBe('/welcome')
    expect(resolveLaunchRoute({ bootstrapped: true, hasSelectedLanguage: true, hasSession: true, restricted: true, sessionExpired: false })).toBe('/restricted')
    expect(resolveLaunchRoute({ bootstrapped: true, hasSelectedLanguage: true, hasSession: true, restricted: false, sessionExpired: false })).toBe('/(tabs)')
  })
})
