import { describe, it, expect } from 'vitest'
import ar from './ar.json'
import en from './en.json'
import he from './he.json'

function flattenKeys(obj: unknown, prefix = ''): string[] {
  if (typeof obj !== 'object' || obj === null) return [prefix]
  return Object.entries(obj as Record<string, unknown>).flatMap(([key, value]) => flattenKeys(value, prefix ? `${prefix}.${key}` : key))
}

describe('locale key parity', () => {
  it('ar/en/he have exactly the same set of translation keys', () => {
    const arKeys = flattenKeys(ar).sort()
    const enKeys = flattenKeys(en).sort()
    const heKeys = flattenKeys(he).sort()
    expect(arKeys).toEqual(enKeys)
    expect(arKeys).toEqual(heKeys)
  })
})
