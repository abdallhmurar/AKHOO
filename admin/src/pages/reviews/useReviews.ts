import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { fetchPage, DEFAULT_PAGE_SIZE } from '@/lib/pagination'
import type { Review, Profile } from '@/types'

export type ReviewFilters = {
  visibility: 'all' | 'visible' | 'hidden'
  search: string
}

export type ReviewRow = Review & { business_name: string | null; reviewer_name: string | null }

export function useReviews(page: number, filters: ReviewFilters, pageSize = DEFAULT_PAGE_SIZE) {
  return useQuery({
    queryKey: ['reviews', page, filters, pageSize],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      let matchingBusinessIds: string[] | null = null
      if (filters.search.trim()) {
        const { data: matches } = await supabase.from('partners').select('id').ilike('name', `%${filters.search.trim()}%`).limit(200)
        matchingBusinessIds = (matches ?? []).map(m => m.id)
        if (matchingBusinessIds.length === 0) return { rows: [] as ReviewRow[], total: 0 }
      }

      const { rows, total } = await fetchPage<Review>((from, to) => {
        let query = supabase.from('reviews').select('*', { count: 'exact' }).order('created_at', { ascending: false })
        if (filters.visibility !== 'all') query = query.eq('is_hidden', filters.visibility === 'hidden')
        if (matchingBusinessIds) query = query.in('business_id', matchingBusinessIds)
        return query.range(from, to)
      }, page, pageSize)

      const businessIds = [...new Set(rows.map(r => r.business_id))]
      const userIds = [...new Set(rows.map(r => r.user_id))]
      const businessNames = new Map<string, string>()
      const userNames = new Map<string, string>()
      if (businessIds.length > 0) {
        const { data } = await supabase.from('partners').select('id, name').in('id', businessIds)
        for (const b of data ?? []) businessNames.set(b.id, b.name)
      }
      if (userIds.length > 0) {
        const { data } = await supabase.from('profiles').select('id, full_name').in('id', userIds)
        for (const p of (data ?? []) as Pick<Profile, 'id' | 'full_name'>[]) userNames.set(p.id, p.full_name)
      }

      const enriched: ReviewRow[] = rows.map(r => ({ ...r, business_name: businessNames.get(r.business_id) ?? null, reviewer_name: userNames.get(r.user_id) ?? null }))

      return { rows: enriched, total }
    }
  })
}
