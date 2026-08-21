import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { fetchPage, DEFAULT_PAGE_SIZE } from '@/lib/pagination'
import type { HelpRequest, RequestStatus, ServiceType, Profile } from '@/types'

export type RequestFilters = {
  status: RequestStatus | 'all'
  serviceType: ServiceType | 'all'
  search: string
}

export type RequestRow = HelpRequest & { requester_name: string | null; volunteer_name: string | null }

export function useRequests(page: number, filters: RequestFilters, pageSize = DEFAULT_PAGE_SIZE) {
  return useQuery({
    queryKey: ['requests', page, filters, pageSize],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      let matchingIds: string[] | null = null
      if (filters.search.trim()) {
        const term = `%${filters.search.trim()}%`
        const { data: matches } = await supabase.from('profiles').select('id').or(`full_name.ilike.${term},phone.ilike.${term}`).limit(200)
        matchingIds = (matches ?? []).map(m => m.id)
        if (matchingIds.length === 0) return { rows: [] as RequestRow[], total: 0 }
      }

      const { rows, total } = await fetchPage<HelpRequest>((from, to) => {
        let query = supabase.from('help_requests').select('*', { count: 'exact' }).order('created_at', { ascending: false })
        if (filters.status !== 'all') query = query.eq('status', filters.status)
        if (filters.serviceType !== 'all') query = query.eq('service_type', filters.serviceType)
        if (matchingIds) query = query.or(`requester_id.in.(${matchingIds.join(',')}),volunteer_id.in.(${matchingIds.join(',')})`)
        return query.range(from, to)
      }, page, pageSize)

      const userIds = [...new Set(rows.flatMap(r => [r.requester_id, r.volunteer_id]).filter((id): id is string => !!id))]
      const namesById = new Map<string, string>()
      if (userIds.length > 0) {
        const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', userIds)
        for (const p of (profiles ?? []) as Pick<Profile, 'id' | 'full_name'>[]) namesById.set(p.id, p.full_name)
      }

      const enriched: RequestRow[] = rows.map(r => ({
        ...r,
        requester_name: namesById.get(r.requester_id) ?? null,
        volunteer_name: r.volunteer_id ? (namesById.get(r.volunteer_id) ?? null) : null
      }))

      return { rows: enriched, total }
    }
  })
}
