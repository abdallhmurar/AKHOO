import type { Membership } from '../types'

// Pure logic only, deliberately kept out of membership.ts (which imports
// the Supabase client at module scope for useMembership) so it can be unit
// tested without pulling in a client/session import chain.

export function isMembershipActive(membership: Pick<Membership, 'expires_at'> | null): boolean {
  return !!membership && (!membership.expires_at || new Date(membership.expires_at) > new Date())
}

export type OfferUseAction = 'contact' | 'membership-required'

// The one place this decision is made - OfferDetailView's "Use offer"
// button calls this directly. Deliberately takes no market-flag parameter:
// the correction brief this shipped for was explicit that member_only must
// restrict use regardless of whether the market's SANAD+ purchasing flag is
// on, so there is structurally nothing here for that flag to influence.
export function resolveOfferUseAction(offer: { member_only: boolean }, isPlusMember: boolean): OfferUseAction {
  if (offer.member_only && !isPlusMember) return 'membership-required'
  return 'contact'
}
