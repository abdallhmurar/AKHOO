import { createRequire } from 'node:module'
import { describe, expect, it } from 'vitest'
const require = createRequire(import.meta.url)
const withNearby = require('../../plugins/withNearbyBackgroundAlerts.js')
const base = require('../../app.json').expo
describe('new native nearby-alert capability', () => {
  it('keeps old runtime and blocked permissions untouched, creates a distinct new runtime', () => {
    const original = JSON.stringify(base)
    const next = withNearby(base)
    expect(JSON.stringify(base)).toBe(original)
    expect(next.runtimeVersion).not.toEqual(base.runtimeVersion)
    expect(next.runtimeVersion).toContain('nearby-v1')
    expect(next.extra.nearbyBackgroundAlerts).toBe(true)
    expect(next.android.blockedPermissions).not.toContain('android.permission.ACCESS_BACKGROUND_LOCATION')
    expect(next.plugins).not.toContain('./plugins/withoutLocationForegroundService')
    expect(next.plugins.find((p: unknown) => Array.isArray(p) && p[0] === 'expo-location')[1]).toMatchObject({ isAndroidBackgroundLocationEnabled: true, isAndroidForegroundServiceEnabled: true, isIosBackgroundLocationEnabled: true })
  })
})
