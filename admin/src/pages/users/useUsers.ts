import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { fetchPage, DEFAULT_PAGE_SIZE } from '@/lib/pagination'
import type { Profile } from '@/types'

export type UserRow = Profile & { points: number | null; email: string | null }

export function useUsers(page: number, search: string, pageSize = DEFAULT_PAGE_SIZE) {
  return useQuery({
    queryKey: ['users', page, search, pageSize],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const term = search.trim()

      // Emails live in auth.users (0044_admin_user_emails.sql); if that RPC
      // isn't available the search simply falls back to name and phone.
      let emailMatchIds: string[] = []
      if (term.length >= 2) {
        const { data } = await supabase.rpc('admin_find_user_ids_by_email', { p_term: term })
        emailMatchIds = ((data ?? []) as { user_id: string }[]).map(r => r.user_id)
      }

      const { rows, total } = await fetchPage<Profile>((from, to) => {
        let query = supabase.from('profiles').select('*', { count: 'exact' }).order('created_at', { ascending: false })
        if (term) {
          const like = `%${term}%`
          const filters = [`full_name.ilike.${like}`, `phone.ilike.${like}`]
          if (emailMatchIds.length > 0) filters.push(`id.in.(${emailMatchIds.join(',')})`)
          query = query.or(filters.join(','))
        }
        return query.range(from, to)
      }, page, pageSize)

      // The points and email columns are informational: if they can't be read
      // the list itself must still render, so a failure here just leaves them blank.
      const ids = rows.map(r => r.id)
      const [pointsRes, emailsRes] = ids.length > 0
        ? await Promise.all([
            supabase.rpc('get_points_balances', { p_user_ids: ids }),
            supabase.rpc('admin_get_user_emails', { p_user_ids: ids })
          ])
        : [{ data: [] }, { data: [] }]
      const balances = new Map(((pointsRes.data ?? []) as { user_id: string; balance: number }[]).map(b => [b.user_id, b.balance]))
      const emails = new Map(((emailsRes.data ?? []) as { user_id: string; email: string | null }[]).map(e => [e.user_id, e.email]))

      return { rows: rows.map(r => ({ ...r, points: balances.get(r.id) ?? null, email: emails.get(r.id) ?? null })) as UserRow[], total }
    }
  })
}
