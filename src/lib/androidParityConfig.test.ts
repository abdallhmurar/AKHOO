import { createRequire } from 'node:module'
import { afterEach, describe, expect, it, vi } from 'vitest'

const require = createRequire(import.meta.url)
const app = require('../../app.json').expo
const eas = require('../../eas.json')
const config = require('../../app.config.js')
afterEach(() => vi.unstubAllEnvs())

function release() {
  for (const [name, value] of Object.entries(eas.build['android-parity'].env)) vi.stubEnv(name, String(value))
}

describe('Android full-presentation release isolation', () => {
  it('reserves 2.0.5 (10) with its own runtime and the same package/permission scope', () => {
    release()
    vi.stubEnv('EAS_BUILD_PLATFORM', 'android')
    const next = config()
    expect(next.version).toBe('2.0.5')
    expect(next.runtimeVersion).toBe('2.0.5')
    expect(next.android).toEqual({ ...app.android, versionCode: 10 })
    expect(next.plugins).toEqual(app.plugins)
    expect(next.ios).toEqual(app.ios)
    expect(eas.build['android-parity'].autoIncrement).toBe(false)
  })
  it('rejects accidentally building iOS with the Android release profile', () => {
    release()
    vi.stubEnv('EAS_BUILD_PLATFORM', 'ios')
    expect(config).toThrow('restricted to Android')
  })
  it('does not change the default app configuration', () => {
    vi.stubEnv('AKHOO_BUILD_TARGET', '')
    expect(config()).toEqual(app)
  })
  it('fails before building if the reserved Android version is missing', () => {
    release()
    vi.stubEnv('AKHOO_ANDROID_VERSION_CODE', '')
    expect(config).toThrow('explicit version')
  })
})
