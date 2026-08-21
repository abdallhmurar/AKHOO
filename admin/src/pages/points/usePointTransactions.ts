import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { fetchPage, DEFAULT_PAGE_SIZE } from '@/lib/pagination'
import type { VolunteerPointTransaction, HelpRequest } from '@/types'

export type PointRow = VolunteerPointTransaction & { volunteer_name: string | null; service_type: HelpRequest['service_type'] | null }

export function usePointTransactions(page: number, search: string, pageSize = DEFAULT_PAGE_SIZE) {
  return useQuery({
    queryKey: ['points', page, search, pageSize],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      let matchingIds: string[] | null = null
      if (search.trim()) {
        const term = `%${search.trim()}%`
        const { data: matches } = await supabase.from('profiles').select('id').ilike('full_name', term).limit(200)
        matchingIds = (matches ?? []).map(m => m.id)
        if (matchingIds.length === 0) return { rows: [] as PointRow[], total: 0 }
      }

      const { rows, total } = await fetchPage<VolunteerPointTransaction>((from, to) => {
        let query = supabase.from('volunteer_point_transactions').select('*', { count: 'exact' }).order('created_at', { ascending: false })
        if (matchingIds) query = query.in('volunteer_id', matchingIds)
        return query.range(from, to)
      }, page, pageSize)

      const volunteerIds = [...new Set(rows.map(r => r.volunteer_id))]
      const namesById = new Map<string, string>()
      if (volunteerIds.length > 0) {
        const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', volunteerIds)
        for (const p of profiles ?? []) namesById.set(p.id, p.full_name)
      }

      const requestIds = [...new Set(rows.map(r => r.request_id))]
      const serviceById = new Map<string, HelpRequest['service_type']>()
      if (requestIds.length > 0) {
        const { data: requests } = await supabase.from('help_requests').select('id, service_type').in('id', requestIds)
        for (const r of requests ?? []) serviceById.set(r.id, r.service_type)
      }

      const enriched: PointRow[] = rows.map(r => ({
        ...r,
        volunteer_name: namesById.get(r.volunteer_id) ?? null,
        service_type: serviceById.get(r.request_id) ?? null
      }))

      return { rows: enriched, total }
    }
  })
}
