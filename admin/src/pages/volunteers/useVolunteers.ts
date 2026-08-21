import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { fetchPage, DEFAULT_PAGE_SIZE } from '@/lib/pagination'
import type { VolunteerProfile, Profile } from '@/types'

export type VolunteerRow = VolunteerProfile & { full_name: string | null; avatar_url: string | null; completed_count: number; points: number }

export function useVolunteers(page: number, search: string, pageSize = DEFAULT_PAGE_SIZE) {
  return useQuery({
    queryKey: ['volunteers', page, search, pageSize],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      let matchingIds: string[] | null = null
      if (search.trim()) {
        const term = `%${search.trim()}%`
        const { data: matches } = await supabase.from('profiles').select('id').ilike('full_name', term).limit(200)
        matchingIds = (matches ?? []).map(m => m.id)
        if (matchingIds.length === 0) return { rows: [] as VolunteerRow[], total: 0 }
      }

      const { rows, total } = await fetchPage<VolunteerProfile>((from, to) => {
        let query = supabase.from('volunteer_profiles').select('*', { count: 'exact' }).order('updated_at', { ascending: false })
        if (matchingIds) query = query.in('user_id', matchingIds)
        return query.range(from, to)
      }, page, pageSize)

      const userIds = rows.map(r => r.user_id)
      const profilesById = new Map<string, Pick<Profile, 'id' | 'full_name' | 'avatar_url'>>()
      if (userIds.length > 0) {
        const { data: profiles } = await supabase.from('profiles').select('id, full_name, avatar_url').in('id', userIds)
        for (const p of profiles ?? []) profilesById.set(p.id, p)
      }

      const completedCounts = new Map<string, number>()
      const pointsByVolunteer = new Map<string, number>()
      if (userIds.length > 0) {
        const { data: counts } = await supabase.rpc('admin_volunteer_completed_counts', { p_volunteer_ids: userIds })
        for (const row of (counts ?? []) as { volunteer_id: string; completed_count: number }[]) completedCounts.set(row.volunteer_id, row.completed_count)

        const { data: pointRows } = await supabase.from('volunteer_point_transactions').select('volunteer_id, points').in('volunteer_id', userIds)
        for (const row of pointRows ?? []) pointsByVolunteer.set(row.volunteer_id, (pointsByVolunteer.get(row.volunteer_id) ?? 0) + row.points)
      }

      const enriched: VolunteerRow[] = rows.map(r => ({
        ...r,
        full_name: profilesById.get(r.user_id)?.full_name ?? null,
        avatar_url: profilesById.get(r.user_id)?.avatar_url ?? null,
        completed_count: completedCounts.get(r.user_id) ?? 0,
        points: pointsByVolunteer.get(r.user_id) ?? 0
      }))

      return { rows: enriched, total }
    }
  })
}
