import type { PartnerOffer } from '../../types'
import type { ActivityEntry } from '../../repositories/activityRepository'

export type ImpactPeriod = 'month' | 'all'
export type ActivityFilter = 'all' | 'given' | 'received' | 'points'
export type ImpactData = { completed: number; received: number; earned: number; entries: ActivityEntry[]; historyLimited: boolean }

// Calendar month in the phone's timezone, not a rolling 30-day window.
export function periodStart(period: ImpactPeriod, now = new Date()): string | null {
  return period === 'all' ? null : new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
}

export function offersWithinBalance(offers: PartnerOffer[], balance: number | null, affordableOnly: boolean) {
  return affordableOnly && balance !== null ? offers.filter(offer => Math.max(offer.points_required ?? 0, 0) <= balance) : offers
}

export function visibleActivity(entries: ActivityEntry[], filter: ActivityFilter, expanded: boolean) {
  const filtered = entries.filter(entry => filter === 'all' || entry.type === filter)
  return expanded ? filtered : filtered.slice(0, 3)
}
