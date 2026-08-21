import { describe, it, expect } from 'vitest'
import { isRTLLanguage } from './direction'

describe('isRTLLanguage', () => {
  it('treats Arabic and Hebrew as RTL', () => {
    expect(isRTLLanguage('ar')).toBe(true)
    expect(isRTLLanguage('he')).toBe(true)
  })

  it('treats English (and anything unrecognized) as LTR', () => {
    expect(isRTLLanguage('en')).toBe(false)
    expect(isRTLLanguage('fr')).toBe(false)
  })
})
