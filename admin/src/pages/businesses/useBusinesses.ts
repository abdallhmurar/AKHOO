import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { fetchPage, DEFAULT_PAGE_SIZE } from '@/lib/pagination'
import type { Business, BusinessCategory } from '@/types'

export type BusinessFilters = {
  category: BusinessCategory | 'all'
  active: 'all' | 'active' | 'inactive'
  search: string
}

export function useBusinesses(page: number, filters: BusinessFilters, pageSize = DEFAULT_PAGE_SIZE) {
  return useQuery({
    queryKey: ['businesses', page, filters, pageSize],
    placeholderData: keepPreviousData,
    queryFn: () =>
      fetchPage<Business>((from, to) => {
        let query = supabase.from('partners').select('*', { count: 'exact' }).order('created_at', { ascending: false })
        if (filters.category !== 'all') query = query.eq('category', filters.category)
        if (filters.active !== 'all') query = query.eq('is_active', filters.active === 'active')
        if (filters.search.trim()) query = query.ilike('name', `%${filters.search.trim()}%`)
        return query.range(from, to)
      }, page, pageSize)
  })
}
