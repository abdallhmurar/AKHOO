import type { OfferDiscountType } from '../types'

export type OfferPriceDisplay =
  | { kind: 'percentage'; percent: number; originalPrice: number | null; offerPrice: number | null }
  | { kind: 'fixed'; amountOff: number; originalPrice: number | null; offerPrice: number | null }
  | { kind: 'special_price'; originalPrice: number | null; offerPrice: number | null }
  | { kind: 'free_benefit' }

export function computeOfferPriceDisplay(offer: {
  discount_type: OfferDiscountType
  discount_value: number | null
  original_price: number | null
  offer_price: number | null
}): OfferPriceDisplay {
  if (offer.discount_type === 'percentage') {
    return { kind: 'percentage', percent: offer.discount_value ?? 0, originalPrice: offer.original_price, offerPrice: offer.offer_price }
  }
  if (offer.discount_type === 'fixed') {
    return { kind: 'fixed', amountOff: offer.discount_value ?? 0, originalPrice: offer.original_price, offerPrice: offer.offer_price }
  }
  if (offer.discount_type === 'special_price') {
    return { kind: 'special_price', originalPrice: offer.original_price, offerPrice: offer.offer_price }
  }
  return { kind: 'free_benefit' }
}

export function formatPrice(value: number, currencySymbol: string) {
  return `${currencySymbol}${Number.isInteger(value) ? value : value.toFixed(2)}`
}

// Offers are frozen out of public_offers once valid_until passes (server-
// filtered), so this is purely a "closing soon" nudge for the UI, never the
// source of truth for whether an offer is usable.
export function daysUntil(iso: string): number {
  const diffMs = new Date(iso).getTime() - Date.now()
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}
