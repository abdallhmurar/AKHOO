import type { OfferStatus } from '@/types'

// Mirrors public.admin_offer_effective_status() in
// 0015_businesses_offers_reviews.sql exactly - 'expired' is never a stored
// transition, only ever this same live comparison against valid_until,
// computed identically on both sides so the admin UI's badge never
// disagrees with what the database itself enforces for public visibility.
export function effectiveOfferStatus(status: OfferStatus, validUntil: string | null): OfferStatus {
  if (status === 'approved' && validUntil && new Date(validUntil) < new Date()) {
    return 'expired'
  }
  return status
}
