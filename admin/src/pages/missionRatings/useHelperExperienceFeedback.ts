import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { fetchPage, DEFAULT_PAGE_SIZE } from '@/lib/pagination'
import type { MissionHelperFeedback } from '@/types'

// The helper's own rating of their experience on a mission (0038) - a
// separate concept and table from mission_ratings (the requester rating the
// helper's quality of help), so it gets its own query/table on this page
// rather than being force-joined into one row-per-mission view.
export type HelperExperienceFeedbackRow = MissionHelperFeedback & { helper_name: string | null }

export function useHelperExperienceFeedback(page: number, pageSize = DEFAULT_PAGE_SIZE) {
  return useQuery({
    queryKey: ['helper-experience-feedback', page, pageSize],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const { rows, total } = await fetchPage<MissionHelperFeedback>((from, to) =>
        supabase.from('mission_helper_feedback').select('*', { count: 'exact' }).order('created_at', { ascending: false }).range(from, to),
        page, pageSize
      )

      const helperIds = [...new Set(rows.map(r => r.helper_id))]
      const names = new Map<string, string>()
      if (helperIds.length > 0) {
        const { data } = await supabase.from('profiles').select('id, full_name').in('id', helperIds)
        for (const p of data ?? []) names.set(p.id, p.full_name)
      }

      const enriched: HelperExperienceFeedbackRow[] = rows.map(r => ({ ...r, helper_name: names.get(r.helper_id) ?? null }))
      return { rows: enriched, total }
    }
  })
}
