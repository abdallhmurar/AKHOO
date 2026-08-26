import { describe, expect, it } from 'vitest'
import { isRTLLanguage } from './direction'
import { createTypography, normalizeTypographyLanguage } from './typography'

describe('V2 language direction and fonts', () => {
  it('treats Arabic and Hebrew locales as RTL and English as LTR', () => {
    expect(isRTLLanguage('ar')).toBe(true)
    expect(isRTLLanguage('ar-IL')).toBe(true)
    expect(isRTLLanguage('he')).toBe(true)
    expect(isRTLLanguage('en-US')).toBe(false)
  })

  it('selects the approved script-specific family', () => {
    expect(createTypography('ar').body.fontFamily).toBe('NotoSansArabic_400Regular')
    expect(createTypography('he').body.fontFamily).toBe('NotoSansHebrew_400Regular')
    expect(createTypography('en').body.fontFamily).toBe('Inter_400Regular')
    expect(normalizeTypographyLanguage('fr')).toBe('ar')
  })
})
