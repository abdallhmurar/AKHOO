import { createRequire } from 'node:module'
import { describe, expect, it } from 'vitest'

const require = createRequire(import.meta.url)
const app = require('../../app.json').expo
const eas = require('../../eas.json')

// The first Android production release must not ask for background location (that needs Google's declaration), must go
// to Play as a draft, and must not be mistaken for the iOS versions.
describe('Android 2.0.3 production release settings', () => {
  it('uses version name 2.0.3 and keeps the last uploaded versionCode for autoIncrement to raise', () => {
    expect(app.version).toBe('2.0.3')
    expect(app.android.versionCode).toBe(7)
    expect(eas.build.production.autoIncrement).toBe(true)
  })

  it('keeps background location and the location foreground service blocked', () => {
    expect(app.android.blockedPermissions).toEqual(expect.arrayContaining([
      'android.permission.ACCESS_BACKGROUND_LOCATION',
      'android.permission.FOREGROUND_SERVICE',
      'android.permission.FOREGROUND_SERVICE_LOCATION'
    ]))
    expect(app.android.permissions).not.toContain('android.permission.ACCESS_BACKGROUND_LOCATION')
    const location = app.plugins.find((plugin: unknown) => Array.isArray(plugin) && plugin[0] === 'expo-location')[1]
    expect(location.isAndroidBackgroundLocationEnabled).toBe(false)
    expect(location.isAndroidForegroundServiceEnabled).toBe(false)
  })

  it('only ever uploads the production track as a draft', () => {
    expect(eas.submit['android-production'].android.track).toBe('production')
    expect(eas.submit['android-production'].android.releaseStatus).toBe('draft')
    expect(eas.submit.production.android.track).toBe('internal')
  })
})
