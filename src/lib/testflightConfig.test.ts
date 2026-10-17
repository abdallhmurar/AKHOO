import { createRequire } from 'node:module'
import { afterEach, describe, expect, it, vi } from 'vitest'

const require = createRequire(import.meta.url)
const getConfig = require('../../app.config.js')
const app = require('../../app.json').expo
const eas = require('../../eas.json')

afterEach(() => vi.unstubAllEnvs())

describe('TestFlight release isolation', () => {
  it('preserves the existing app configuration outside the beta profile', () => {
    vi.stubEnv('AKHOO_BUILD_TARGET', '')
    vi.stubEnv('EXPO_WEB_BASE_PATH', '')
    expect(getConfig()).toEqual(app)
  })
  it('isolates the beta runtime and disables OTA updates without mutating app.json', () => {
    vi.stubEnv('AKHOO_BUILD_TARGET', 'testflight')
    vi.stubEnv('AKHOO_IOS_VERSION', '2.0.2')
    vi.stubEnv('AKHOO_IOS_BUILD_NUMBER', '18')
    vi.stubEnv('EAS_BUILD_PLATFORM', 'ios')
    vi.stubEnv('EXPO_WEB_BASE_PATH', '')
    const before = structuredClone(app)
    const beta = getConfig()
    expect(beta.ios.bundleIdentifier).toBe(app.ios.bundleIdentifier)
    expect(beta.ios.buildNumber).toBe('18')
    expect(beta.updates.enabled).toBe(false)
    expect(beta.version).toBe('2.0.2')
    expect(beta.runtimeVersion).toBe('2.0.2-testflight')
    expect(beta.android).toEqual(app.android)
    expect(app).toEqual(before)
    expect(eas.build.testflight.channel).not.toBe(eas.build.production.channel)
    expect(eas.build.testflight.distribution).toBe('store')
    expect(eas.submit.testflight.android).toBeUndefined()
  })
  it('rejects an Android build using the TestFlight profile', () => {
    vi.stubEnv('AKHOO_BUILD_TARGET', 'testflight')
    vi.stubEnv('EAS_BUILD_PLATFORM', 'android')
    expect(getConfig).toThrow('restricted to iOS')
  })
})
