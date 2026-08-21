import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { DashboardMetrics } from '@/types'

export function useDashboardMetrics() {
  return useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_dashboard_metrics')
      if (error) throw error
      return (Array.isArray(data) ? data[0] : data) as DashboardMetrics
    }
  })
}

export function useCompletionTrend(days = 14) {
  return useQuery({
    queryKey: ['dashboard-trend', days],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_requests_completed_daily', { p_days: days })
      if (error) throw error
      return data as { day: string; completed_count: number }[]
    }
  })
}
