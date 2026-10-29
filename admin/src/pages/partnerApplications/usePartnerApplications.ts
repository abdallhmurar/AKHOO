import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { fetchPage, DEFAULT_PAGE_SIZE } from '@/lib/pagination'

export type PartnerApplicationStatus = 'new' | 'contacted' | 'approved' | 'rejected'
export const PARTNER_APPLICATION_STATUSES: PartnerApplicationStatus[] = ['new', 'contacted', 'approved', 'rejected']
// Same order as the categories of the partner form in the app.
export const PARTNER_CATEGORY_KEYS = ['cars', 'food', 'shops', 'professional', 'other'] as const

export type PartnerApplication = {
  id: string
  created_at: string
  business_name: string
  category: number
  city: string
  phone: string
  offer: string
  language: 'ar' | 'en' | 'he'
  source: 'web' | 'ios' | 'android'
  status: PartnerApplicationStatus
  note: string
  handled_at: string | null
}

export type PartnerApplicationFilters = { status: 'all' | PartnerApplicationStatus }

export function usePartnerApplications(page: number, filters: PartnerApplicationFilters, pageSize = DEFAULT_PAGE_SIZE) {
  return useQuery({
    queryKey: ['partner-applications', page, filters, pageSize],
    placeholderData: keepPreviousData,
    queryFn: () => fetchPage<PartnerApplication>((from, to) => {
      let query = supabase.from('partner_applications')
        .select('id, created_at, business_name, category, city, phone, offer, language, source, status, note, handled_at', { count: 'exact' })
        .order('created_at', { ascending: false })
      if (filters.status !== 'all') query = query.eq('status', filters.status)
      return query.range(from, to)
    }, page, pageSize)
  })
}

// The badge on the sidebar item: applications nobody has looked at yet.
export function useNewPartnerApplicationsCount() {
  return useQuery({
    queryKey: ['partner-applications-new-count'],
    refetchInterval: 60_000,
    queryFn: async () => {
      const { count, error } = await supabase.from('partner_applications').select('id', { count: 'exact', head: true }).eq('status', 'new')
      if (error) throw new Error(error.message)
      return count ?? 0
    }
  })
}

export function useSetPartnerApplication() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status, note }: { id: string; status: PartnerApplicationStatus; note: string }) => {
      const { error } = await supabase.rpc('admin_set_partner_application', { p_id: id, p_status: status, p_note: note })
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['partner-applications'] })
      void queryClient.invalidateQueries({ queryKey: ['partner-applications-new-count'] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}
