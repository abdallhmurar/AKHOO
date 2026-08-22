import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { isMembershipActive } from './membershipLogic'
import type { Membership } from '../types'

export { isMembershipActive, resolveOfferUseAction } from './membershipLogic'
export type { OfferUseAction } from './membershipLogic'

// Real entitlement check - no hardcoded isPlus. memberships has no client
// insert/update path yet (payment webhook/RPC is a future phase), so this
// will honestly return null for every user until that ships. Deliberately
// NOT gated by the market's sanadPlus feature flag: that flag only controls
// whether SANAD+ purchase/activation marketing is shown (PlusHeroCard,
// MembershipSheet's CTA copy) - it must never make a member_only offer
// silently free just because a market hasn't turned purchasing on yet, so
// this always queries for a real row regardless of the flag.
export function useMembership(userId: string) {
  const [membership, setMembership] = useState<Membership | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    supabase
      .from('memberships')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('expires_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return
        setMembership(data as Membership | null)
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [userId])

  const isPlusMember = isMembershipActive(membership)

  return { membership, isPlusMember, loading }
}
