import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { fetchPage, DEFAULT_PAGE_SIZE } from '@/lib/pagination'
import type { BroadcastNotification } from '@/types'

export function useNotifications(page: number, pageSize = DEFAULT_PAGE_SIZE) {
  return useQuery({
    queryKey: ['notifications', page, pageSize],
    refetchInterval: 15_000,
    placeholderData: keepPreviousData,
    queryFn: () => fetchPage<BroadcastNotification>((from, to) =>
      supabase.from('broadcast_notifications').select('*', { count: 'exact' }).order('created_at', { ascending: false }).range(from, to),
      page, pageSize
    )
  })
}
