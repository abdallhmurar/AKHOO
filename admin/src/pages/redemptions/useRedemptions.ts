import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { fetchPage, DEFAULT_PAGE_SIZE } from '@/lib/pagination'
import type { OfferRedemption, RedemptionStatus } from '@/types'

export type RedemptionFilters = {
  status: RedemptionStatus | 'all'
  search: string
}

export type RedemptionRow = OfferRedemption & { offer_title: string | null; user_name: string | null; partner_name: string | null }

export function useRedemptions(page: number, filters: RedemptionFilters, pageSize = DEFAULT_PAGE_SIZE) {
  return useQuery({
    queryKey: ['redemptions', page, filters, pageSize],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      let matchingIds: string[] | null = null
      if (filters.search.trim()) {
        const { data: matches } = await supabase.from('offer_redemptions').select('id').ilike('code', `%${filters.search.trim()}%`).limit(200)
        matchingIds = (matches ?? []).map(m => m.id)
        if (matchingIds.length === 0) return { rows: [] as RedemptionRow[], total: 0 }
      }

      const { rows, total } = await fetchPage<OfferRedemption>((from, to) => {
        let query = supabase.from('offer_redemptions').select('*', { count: 'exact' }).order('created_at', { ascending: false })
        if (filters.status !== 'all') query = query.eq('status', filters.status)
        if (matchingIds) query = query.in('id', matchingIds)
        return query.range(from, to)
      }, page, pageSize)

      const offerIds = [...new Set(rows.map(r => r.offer_id))]
      const userIds = [...new Set(rows.map(r => r.user_id))]
      const partnerIds = [...new Set(rows.map(r => r.partner_id).filter((id): id is string => id !== null))]

      const [{ data: offers }, { data: users }, { data: partners }] = await Promise.all([
        offerIds.length ? supabase.from('partner_offers').select('id, title').in('id', offerIds) : Promise.resolve({ data: [] as { id: string; title: string }[] }),
        userIds.length ? supabase.from('profiles').select('id, full_name').in('id', userIds) : Promise.resolve({ data: [] as { id: string; full_name: string }[] }),
        partnerIds.length ? supabase.from('partners').select('id, name').in('id', partnerIds) : Promise.resolve({ data: [] as { id: string; name: string }[] })
      ])

      const offerTitles = new Map((offers ?? []).map(o => [o.id, o.title]))
      const userNames = new Map((users ?? []).map(u => [u.id, u.full_name]))
      const partnerNames = new Map((partners ?? []).map(p => [p.id, p.name]))

      const enriched: RedemptionRow[] = rows.map(r => ({
        ...r,
        offer_title: offerTitles.get(r.offer_id) ?? null,
        user_name: userNames.get(r.user_id) ?? null,
        partner_name: r.partner_id ? partnerNames.get(r.partner_id) ?? null : null
      }))

      return { rows: enriched, total }
    }
  })
}
