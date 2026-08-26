import { describe, expect, it } from 'vitest'
import { v2Copy, v2Text } from './v2Copy'

describe('SANAD V2 copy', () => {
  it('contains Arabic, Hebrew and English for every key', () => {
    for (const value of Object.values(v2Copy)) {
      expect(value.ar.trim()).not.toBe('')
      expect(value.he.trim()).not.toBe('')
      expect(value.en.trim()).not.toBe('')
    }
  })

  it('falls back to Arabic for unsupported languages', () => {
    expect(v2Text('brand.name', 'fr')).toBe('سَنَد')
  })
})
