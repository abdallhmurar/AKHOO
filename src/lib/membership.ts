import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { CURRENT_MARKET_FEATURES } from './market'
import type { Membership } from '../types'

// Real entitlement check - no hardcoded isPlus. memberships has no client
// insert/update path yet (payment webhook/RPC is a future phase), so this
// will honestly return null for every user until that ships. Also gated by
// the market's own sanadPlus feature flag: memberships.market only allows
// 'JO' today, so a market without that flag (e.g. the current IL pilot)
// could never have a real row here anyway - short-circuiting avoids a
// pointless round trip and keeps the "no member_only offer can ever
// dead-end a user in a market where SANAD+ isn't purchasable" guarantee.
export function useMembership(userId: string) {
  const [membership, setMembership] = useState<Membership | null>(null)
  const [loading, setLoading] = useState(CURRENT_MARKET_FEATURES.sanadPlus)

  useEffect(() => {
    if (!CURRENT_MARKET_FEATURES.sanadPlus) {
      setLoading(false)
      return
    }
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

  const isPlusMember = !!membership && (!membership.expires_at || new Date(membership.expires_at) > new Date())

  return { membership, isPlusMember, loading }
}
