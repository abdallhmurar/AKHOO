import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { fetchPage, DEFAULT_PAGE_SIZE } from '@/lib/pagination'
import type { Offer, OfferStatus } from '@/types'

export type OfferFilters = {
  status: OfferStatus | 'all'
  businessId: string | 'all'
  search: string
}

export type OfferRow = Offer & { business_name: string | null }

export function useOffers(page: number, filters: OfferFilters, pageSize = DEFAULT_PAGE_SIZE) {
  return useQuery({
    queryKey: ['offers', page, filters, pageSize],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      // 'expired' is never stored (see admin_offer_effective_status in
      // 0015_businesses_offers_reviews.sql) - filtering for it means
      // "approved rows whose valid_until has passed", computed here rather
      // than as a stored status the server would need to filter on.
      let matchingIds: string[] | null = null
      if (filters.search.trim()) {
        const { data: matches } = await supabase.from('partner_offers').select('id').ilike('title', `%${filters.search.trim()}%`).limit(200)
        matchingIds = (matches ?? []).map(m => m.id)
        if (matchingIds.length === 0) return { rows: [] as OfferRow[], total: 0 }
      }

      const { rows, total } = await fetchPage<Offer>((from, to) => {
        let query = supabase.from('partner_offers').select('*', { count: 'exact' }).order('created_at', { ascending: false })
        if (filters.businessId !== 'all') query = query.eq('partner_id', filters.businessId)
        if (filters.status !== 'all' && filters.status !== 'expired') query = query.eq('status', filters.status)
        if (filters.status === 'expired') query = query.eq('status', 'approved').lt('valid_until', new Date().toISOString())
        if (matchingIds) query = query.in('id', matchingIds)
        return query.range(from, to)
      }, page, pageSize)

      const businessIds = [...new Set(rows.map(r => r.partner_id))]
      const namesById = new Map<string, string>()
      if (businessIds.length > 0) {
        const { data: businesses } = await supabase.from('partners').select('id, name').in('id', businessIds)
        for (const b of businesses ?? []) namesById.set(b.id, b.name)
      }

      const enriched: OfferRow[] = rows.map(r => ({ ...r, business_name: namesById.get(r.partner_id) ?? null }))

      return { rows: enriched, total }
    }
  })
}
