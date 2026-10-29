import { supabase } from '../lib/supabase'
import type { HelpRequest, Partner, PartnerOffer } from '../types'
import type { ActivityEntry } from './activityRepository'
import type { ImpactData } from '../features/mobileHub/model'

export type HubOffers = { offers: PartnerOffer[]; partnersById: Record<string, Partner> }
const HISTORY_LIMIT = 100
const PAGE_SIZE = 500

export const mobileHubRepository = {
  async offers(): Promise<HubOffers> {
    // The public view enforces approval, validity and active partner restrictions.
    const { data, error } = await supabase.from('public_offers').select('*').order('weekly_slot', { ascending: true, nullsFirst: false }).order('created_at', { ascending: false })
    if (error) throw error
    const offers = (data ?? []) as PartnerOffer[]
    const ids = [...new Set(offers.flatMap(offer => offer.partner_id ? [offer.partner_id] : []))]
    const partners = ids.length ? await supabase.from('partners').select('*').in('id', ids) : { data: [], error: null }
    if (partners.error) throw partners.error
    return { offers, partnersById: Object.fromEntries(((partners.data ?? []) as Partner[]).map(partner => [partner.id, partner])) }
  },

  async impact(userId: string, since: string | null): Promise<ImpactData> {
    async function count(column: 'volunteer_id' | 'requester_id') {
      let query = supabase.from('help_requests').select('id', { count: 'exact', head: true }).eq(column, userId).eq('status', 'completed')
      if (since) query = query.gte('completed_at', since)
      const result = await query
      if (result.error) throw result.error
      return result.count ?? 0
    }
    async function history(column: 'volunteer_id' | 'requester_id') {
      let query = supabase.from('help_requests').select('*').eq(column, userId)
      if (since) query = query.or(`completed_at.gte.${since},and(completed_at.is.null,created_at.gte.${since})`)
      const result = await query.order('completed_at', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false }).limit(HISTORY_LIMIT + 1)
      if (result.error) throw result.error
      return (result.data ?? []) as HelpRequest[]
    }
    async function earnedPoints() {
      // Paginate the narrow ledger; a capped activity feed cannot supply totals.
      const rows: { id: string; request_id: string; points: number; created_at: string }[] = []
      for (let from = 0; ; from += PAGE_SIZE) {
        let query = supabase.from('volunteer_point_transactions').select('id,request_id,points,created_at').eq('volunteer_id', userId)
        if (since) query = query.gte('created_at', since)
        const result = await query.order('created_at', { ascending: false }).order('id').range(from, from + PAGE_SIZE - 1)
        if (result.error) throw result.error
        rows.push(...(result.data ?? []))
        if ((result.data?.length ?? 0) < PAGE_SIZE) break
      }
      return rows
    }
    const [completed, received, givenRows, receivedRows, ledger] = await Promise.all([count('volunteer_id'), count('requester_id'), history('volunteer_id'), history('requester_id'), earnedPoints()])
    const byRequest = new Map<string, number>()
    for (const row of ledger) byRequest.set(row.request_id, (byRequest.get(row.request_id) ?? 0) + row.points)
    const helpEntries = (rows: HelpRequest[], type: 'given' | 'received'): ActivityEntry[] => rows.slice(0, HISTORY_LIMIT).map(row => ({
      id: `${type}-${row.id}`, type, serviceType: row.service_type, status: row.status,
      occurredAt: row.completed_at ?? row.created_at, missionId: row.id,
      points: type === 'given' && row.status === 'completed' ? byRequest.get(row.id) : undefined,
    }))
    const entries: ActivityEntry[] = [...helpEntries(givenRows, 'given'), ...helpEntries(receivedRows, 'received'), ...ledger.slice(0, HISTORY_LIMIT).map(row => ({ id: `points-${row.id}`, type: 'points' as const, status: 'earned', occurredAt: row.created_at, points: row.points, pointsReason: 'completed_verified_mission' as const, missionId: row.request_id }))]
    entries.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
    return { completed, received, earned: ledger.reduce((sum, row) => sum + row.points, 0), entries, historyLimited: givenRows.length > HISTORY_LIMIT || receivedRows.length > HISTORY_LIMIT || ledger.length > HISTORY_LIMIT }
  },
}
