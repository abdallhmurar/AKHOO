import { describe, expect, it } from 'vitest'
import { isMembershipActive, resolveOfferUseAction } from './membershipLogic'

describe('resolveOfferUseAction', () => {
  it('allows the normal contact flow when the offer is not member_only, regardless of membership', () => {
    expect(resolveOfferUseAction({ member_only: false }, false)).toBe('contact')
    expect(resolveOfferUseAction({ member_only: false }, true)).toBe('contact')
  })

  it('requires membership when the offer is member_only and the user is not a member', () => {
    expect(resolveOfferUseAction({ member_only: true }, false)).toBe('membership-required')
  })

  it('allows the normal contact flow when the offer is member_only and the user is a real active member', () => {
    expect(resolveOfferUseAction({ member_only: true }, true)).toBe('contact')
  })

  // The correction brief this shipped for is explicit: this restriction
  // must hold regardless of the market's SANAD+ purchasing feature flag.
  // resolveOfferUseAction takes no such flag as input at all, so there is
  // nothing for a flag value to change here - this test exists to make
  // that invariant explicit and guard against it being reintroduced.
  it('has no parameter for the market feature flag - the restriction cannot depend on it', () => {
    expect(resolveOfferUseAction.length).toBe(2)
  })
})

describe('isMembershipActive', () => {
  it('is false when there is no membership row', () => {
    expect(isMembershipActive(null)).toBe(false)
  })

  it('is true for an active membership with no expiry', () => {
    expect(isMembershipActive({ expires_at: null })).toBe(true)
  })

  it('is true for an active membership that expires in the future', () => {
    const future = new Date(Date.now() + 86_400_000).toISOString()
    expect(isMembershipActive({ expires_at: future })).toBe(true)
  })

  it('is false for a membership row whose expiry has already passed', () => {
    const past = new Date(Date.now() - 86_400_000).toISOString()
    expect(isMembershipActive({ expires_at: past })).toBe(false)
  })
})
