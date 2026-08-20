import { describe, expect, it } from 'vitest'
import ar from '../locales/ar.json'
import en from '../locales/en.json'
import he from '../locales/he.json'

function flattenKeys(obj: unknown, prefix = ''): string[] {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) return [prefix]
  return Object.entries(obj as Record<string, unknown>).flatMap(([key, value]) =>
    flattenKeys(value, prefix ? `${prefix}.${key}` : key)
  )
}

describe('locale key parity (ar/en/he)', () => {
  const arKeys = flattenKeys(ar).sort()
  const enKeys = flattenKeys(en).sort()
  const heKeys = flattenKeys(he).sort()

  it('en has exactly the same keys as ar', () => {
    expect(enKeys).toEqual(arKeys)
  })

  it('he has exactly the same keys as ar', () => {
    expect(heKeys).toEqual(arKeys)
  })

  it('has no empty translation strings', () => {
    for (const [name, locale] of [['ar', ar], ['en', en], ['he', he]] as const) {
      const empties = flattenKeys(locale).filter(key => {
        const value = key.split('.').reduce<any>((acc, part) => acc?.[part], locale)
        return typeof value === 'string' && value.trim() === ''
      })
      expect(empties, `${name} has empty values for: ${empties.join(', ')}`).toEqual([])
    }
  })
})
