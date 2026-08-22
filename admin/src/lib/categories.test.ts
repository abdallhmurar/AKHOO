import { describe, it, expect } from 'vitest'
import { BUSINESS_CATEGORIES, BUSINESS_CATEGORY_LABEL_KEYS } from './categories'

describe('business categories', () => {
  it('has a translation label key for every category, and no orphaned keys', () => {
    const labelKeys = Object.keys(BUSINESS_CATEGORY_LABEL_KEYS)
    expect([...BUSINESS_CATEGORIES].sort()).toEqual([...labelKeys].sort())
  })

  it('has no duplicate categories', () => {
    expect(new Set(BUSINESS_CATEGORIES).size).toBe(BUSINESS_CATEGORIES.length)
  })
})
