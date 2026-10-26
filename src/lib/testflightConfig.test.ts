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
    vi.stubEnv('AKHOO_PARTNER_HOME_BETA', '1')
    vi.stubEnv('EXPO_WEB_BASE_PATH', '')
    expect(getConfig()).toEqual(app)
  })
  it('enables the partner prototype only in its isolated TestFlight profile', () => {
    const profile = eas.build['partner-testflight']
    for (const [key, value] of Object.entries(profile.env)) vi.stubEnv(key, String(value))
    vi.stubEnv('EAS_BUILD_PLATFORM', 'ios')
    vi.stubEnv('EXPO_WEB_BASE_PATH', '')
    const config = getConfig()
    expect(profile.extends).toBe('testflight')
    expect(config.extra.partnerHomeBeta).toBe(true)
    expect(config.ios.buildNumber).toBe('31')
    expect(config.version).toBe('2.0.4')
    expect(config.updates.enabled).toBe(false)
    expect(config.android).toEqual(app.android)
    expect(app.extra.partnerHomeBeta).toBeUndefined()
    vi.stubEnv('AKHOO_PARTNER_HOME_BETA', '')
    expect(getConfig().extra.partnerHomeBeta).toBe(false)
  })
  it('isolates the beta runtime and disables OTA updates without mutating app.json', () => {
    vi.stubEnv('AKHOO_BUILD_TARGET', 'testflight')
    vi.stubEnv('AKHOO_IOS_VERSION', '2.0.2')
    vi.stubEnv('AKHOO_IOS_BUILD_NUMBER', eas.build.testflight.env.AKHOO_IOS_BUILD_NUMBER)
    vi.stubEnv('EAS_BUILD_PLATFORM', 'ios')
    vi.stubEnv('EXPO_WEB_BASE_PATH', '')
    const before = structuredClone(app)
    const beta = getConfig()
    expect(beta.ios.bundleIdentifier).toBe(app.ios.bundleIdentifier)
    expect(beta.ios.buildNumber).toBe(eas.build.testflight.env.AKHOO_IOS_BUILD_NUMBER)
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
