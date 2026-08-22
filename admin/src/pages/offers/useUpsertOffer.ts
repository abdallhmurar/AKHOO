import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import type { Offer, OfferDiscountType } from '@/types'

export type OfferFormPayload = {
  business_id: string
  title: string
  description: string
  terms: string
  discount_type: OfferDiscountType
  discount_value: number | null
  original_price: number | null
  offer_price: number | null
  image_url: string | null
  valid_from: string | null
  valid_until: string | null
  member_only: boolean
}

export function useUpsertOffer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string | null; payload: OfferFormPayload }) => {
      const { data, error } = await supabase.rpc('admin_upsert_offer', { p_id: id, p_payload: payload })
      if (error) throw error
      return data as Offer
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offers'] })
      queryClient.invalidateQueries({ queryKey: ['offer'] })
      queryClient.invalidateQueries({ queryKey: ['business'] })
      queryClient.invalidateQueries({ queryKey: ['audit-log'] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}
