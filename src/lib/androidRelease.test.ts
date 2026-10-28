import { createRequire } from 'node:module'
import { describe, expect, it } from 'vitest'

const require = createRequire(import.meta.url)
const app = require('../../app.json').expo
const eas = require('../../eas.json')

// The first Android production release must not ask for background location (that needs Google's declaration), is sent
// to the Production track as a completed release (the owner asked for it to be published on 2026-10-27), and must not be
// mistaken for the iOS versions.
describe('Android 2.0.4 production release settings', () => {
  it('uses version name 2.0.4 and the versionCode of the EAS build 4a679c37 (9; the next build raises it)', () => {
    expect(app.version).toBe('2.0.4')
    expect(app.android.versionCode).toBe(9)
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

  it('sends the production release as completed and keeps the old profile on the internal track', () => {
    expect(eas.submit['android-production'].android.track).toBe('production')
    expect(eas.submit['android-production'].android.releaseStatus).toBe('completed')
    expect(eas.submit.production.android.track).toBe('internal')
  })
})
