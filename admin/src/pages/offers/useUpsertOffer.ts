import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { translateForPublish } from '@/lib/contentTranslation'
import type { ContentTranslations } from '../../../../shared/contentTranslations'
import type { Offer, OfferDiscountType } from '@/types'

export type OfferFormPayload = {
  business_id: string | null
  title: string
  description: string
  terms: string
  discount_type: OfferDiscountType
  discount_value: number | null
  original_price: number | null
  offer_price: number | null
  image_url: string | null
  image_urls: string[]
  offer_type_label: string | null
  translations?: ContentTranslations
  valid_from: string | null
  valid_until: string | null
  member_only: boolean
  points_required: number | null
}

export function useUpsertOffer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, payload, published = false }: { id: string | null; payload: OfferFormPayload; published?: boolean }) => {
      // Drafts do not incur translation calls. Approval translates them once;
      // subsequent edits to already published offers translate before saving.
      const translations = published ? await translateForPublish('offer', { title: payload.title, description: payload.description, terms: payload.terms, offer_type_label: payload.offer_type_label }, payload.translations) : payload.translations ?? {}
      const { data, error } = await supabase.rpc('admin_upsert_offer', { p_id: id, p_payload: { ...payload, translations } })
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
