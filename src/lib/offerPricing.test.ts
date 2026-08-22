import { describe, expect, it } from 'vitest'
import { computeOfferPriceDisplay, formatPrice, daysUntil } from './offerPricing'

describe('computeOfferPriceDisplay', () => {
  it('reads a percentage offer', () => {
    const result = computeOfferPriceDisplay({ discount_type: 'percentage', discount_value: 25, original_price: 120, offer_price: 90 })
    expect(result).toEqual({ kind: 'percentage', percent: 25, originalPrice: 120, offerPrice: 90 })
  })

  it('reads a fixed-amount offer', () => {
    const result = computeOfferPriceDisplay({ discount_type: 'fixed', discount_value: 15, original_price: 100, offer_price: 85 })
    expect(result).toEqual({ kind: 'fixed', amountOff: 15, originalPrice: 100, offerPrice: 85 })
  })

  it('reads a special-price offer with no discount_value', () => {
    const result = computeOfferPriceDisplay({ discount_type: 'special_price', discount_value: null, original_price: null, offer_price: 40 })
    expect(result).toEqual({ kind: 'special_price', originalPrice: null, offerPrice: 40 })
  })

  it('never invents an original price for a free-benefit offer', () => {
    const result = computeOfferPriceDisplay({ discount_type: 'free_benefit', discount_value: null, original_price: null, offer_price: null })
    expect(result).toEqual({ kind: 'free_benefit' })
  })
})

describe('formatPrice', () => {
  it('renders whole numbers without decimals', () => {
    expect(formatPrice(90, '₪')).toBe('₪90')
  })

  it('renders fractional amounts with two decimals', () => {
    expect(formatPrice(14.99, 'د.أ')).toBe('د.أ14.99')
  })
})

describe('daysUntil', () => {
  it('is positive for a future date', () => {
    const future = new Date(Date.now() + 3 * 86_400_000).toISOString()
    expect(daysUntil(future)).toBeGreaterThan(0)
  })

  it('is negative or zero for a past date', () => {
    const past = new Date(Date.now() - 3 * 86_400_000).toISOString()
    expect(daysUntil(past)).toBeLessThanOrEqual(0)
  })
})
