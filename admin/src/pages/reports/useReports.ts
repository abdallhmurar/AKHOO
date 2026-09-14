import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { fetchPage, DEFAULT_PAGE_SIZE } from '@/lib/pagination'
import type { Report, ReportStatus } from '@/types'

export type ReportFilters = {
  status: ReportStatus | 'all'
  search: string
}

export type ReportRow = Report & { reporter_name: string | null }

export function useReports(page: number, filters: ReportFilters, pageSize = DEFAULT_PAGE_SIZE) {
  return useQuery({
    queryKey: ['reports', page, filters, pageSize],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const { rows, total } = await fetchPage<Report>((from, to) => {
        let query = supabase.from('reports').select('*', { count: 'exact' }).order('created_at', { ascending: false })
        if (filters.status !== 'all') query = query.eq('status', filters.status)
        if (filters.search.trim()) query = query.ilike('reason', `%${filters.search.trim()}%`)
        return query.range(from, to)
      }, page, pageSize)

      const reporterIds = [...new Set(rows.map(r => r.reporter_id))]
      const names = new Map<string, string>()
      if (reporterIds.length > 0) {
        const { data } = await supabase.from('profiles').select('id, full_name').in('id', reporterIds)
        for (const p of data ?? []) names.set(p.id, p.full_name)
      }

      const enriched: ReportRow[] = rows.map(r => ({ ...r, reporter_name: names.get(r.reporter_id) ?? null }))
      return { rows: enriched, total }
    }
  })
}
