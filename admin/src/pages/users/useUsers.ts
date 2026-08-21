import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { fetchPage, DEFAULT_PAGE_SIZE } from '@/lib/pagination'
import type { Profile } from '@/types'

export function useUsers(page: number, search: string, pageSize = DEFAULT_PAGE_SIZE) {
  return useQuery({
    queryKey: ['users', page, search, pageSize],
    placeholderData: keepPreviousData,
    queryFn: () =>
      fetchPage<Profile>((from, to) => {
        let query = supabase.from('profiles').select('*', { count: 'exact' }).order('created_at', { ascending: false })
        if (search.trim()) {
          const term = `%${search.trim()}%`
          query = query.or(`full_name.ilike.${term},phone.ilike.${term}`)
        }
        return query.range(from, to)
      }, page, pageSize)
  })
}
