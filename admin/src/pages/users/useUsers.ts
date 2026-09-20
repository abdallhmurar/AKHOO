import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { fetchPage, DEFAULT_PAGE_SIZE } from '@/lib/pagination'
import type { Profile } from '@/types'

export type UserRow = Profile & { points: number | null }

export function useUsers(page: number, search: string, pageSize = DEFAULT_PAGE_SIZE) {
  return useQuery({
    queryKey: ['users', page, search, pageSize],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const { rows, total } = await fetchPage<Profile>((from, to) => {
        let query = supabase.from('profiles').select('*', { count: 'exact' }).order('created_at', { ascending: false })
        if (search.trim()) {
          const term = `%${search.trim()}%`
          query = query.or(`full_name.ilike.${term},phone.ilike.${term}`)
        }
        return query.range(from, to)
      }, page, pageSize)

      // The points column is informational: if balances can't be read the
      // list itself must still render, so a failure here just leaves it blank.
      const { data } = rows.length > 0 ? await supabase.rpc('get_points_balances', { p_user_ids: rows.map(r => r.id) }) : { data: [] }
      const balances = new Map(((data ?? []) as { user_id: string; balance: number }[]).map(b => [b.user_id, b.balance]))

      return { rows: rows.map(r => ({ ...r, points: balances.get(r.id) ?? null })) as UserRow[], total }
    }
  })
}
