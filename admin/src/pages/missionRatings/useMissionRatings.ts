import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { fetchPage, DEFAULT_PAGE_SIZE } from '@/lib/pagination'
import type { MissionRating } from '@/types'

export type MissionRatingRow = MissionRating & { helper_name: string | null; requester_name: string | null }

export function useMissionRatings(page: number, pageSize = DEFAULT_PAGE_SIZE) {
  return useQuery({
    queryKey: ['mission-ratings', page, pageSize],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const { rows, total } = await fetchPage<MissionRating>((from, to) =>
        supabase.from('mission_ratings').select('*', { count: 'exact' }).order('created_at', { ascending: false }).range(from, to),
        page, pageSize
      )

      const userIds = [...new Set([...rows.map(r => r.helper_id), ...rows.map(r => r.requester_id)])]
      const names = new Map<string, string>()
      if (userIds.length > 0) {
        const { data } = await supabase.from('profiles').select('id, full_name').in('id', userIds)
        for (const p of data ?? []) names.set(p.id, p.full_name)
      }

      const enriched: MissionRatingRow[] = rows.map(r => ({ ...r, helper_name: names.get(r.helper_id) ?? null, requester_name: names.get(r.requester_id) ?? null }))
      return { rows: enriched, total }
    }
  })
}
