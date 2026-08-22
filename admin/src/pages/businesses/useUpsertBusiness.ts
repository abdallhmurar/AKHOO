import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import type { Business, OpeningHours, BusinessCategory } from '@/types'

export type BusinessFormPayload = {
  name: string
  category: BusinessCategory
  description: string
  phone: string
  whatsapp: string
  address: string
  latitude: number | null
  longitude: number | null
  service_area: string
  opening_hours: OpeningHours | null
  website_url: string
  social_url: string
  logo_url: string | null
}

export function useUpsertBusiness() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string | null; payload: BusinessFormPayload }) => {
      const { data, error } = await supabase.rpc('admin_upsert_business', { p_id: id, p_payload: payload })
      if (error) throw error
      return data as Business
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['businesses'] })
      queryClient.invalidateQueries({ queryKey: ['business'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] })
      queryClient.invalidateQueries({ queryKey: ['audit-log'] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}
