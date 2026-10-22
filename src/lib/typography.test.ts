import { afterEach, describe, expect, it } from 'vitest'
import { Platform } from 'react-native'
import { createTypography } from './typography'

const originalOS = Platform.OS
const setPlatform = (value: string) => Object.defineProperty(Platform, 'OS', { configurable: true, writable: true, value })
afterEach(() => setPlatform(originalOS))
describe('iOS language direction and Arabic metrics', () => {
  it.each([['ar', 'rtl'], ['he', 'rtl'], ['en', 'ltr']] as const)('sets %s paragraph direction explicitly', (language, direction) => {
    setPlatform('ios')
    expect(createTypography(language).body.writingDirection).toBe(direction)
  })
  it('uses a compact Arabic family with room for diacritics', () => {
    setPlatform('ios')
    const typography = createTypography('ar')
    expect(typography.h1.fontFamily).toBe('Tajawal_700Bold')
    expect(typography.h1.lineHeight).toBeGreaterThanOrEqual(typography.h1.fontSize! * 1.5)
    expect(typography.h1.letterSpacing).toBeUndefined()
  })
  it('keeps existing Android typography metrics', () => {
    setPlatform('android')
    expect(createTypography('ar').body.lineHeight).toBe(21)
  })
})
