import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { translateForPublish } from '@/lib/contentTranslation'

export function useSetOfferStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'approved' | 'rejected' | 'paused' | 'draft' }) => {
      if (status === 'approved') {
        const { data: offer, error: readError } = await supabase.from('partner_offers').select('title,description,terms,offer_type_label,translations').eq('id', id).single()
        if (readError) throw readError
        const source = { title: offer.title ?? '', description: offer.description ?? '', terms: offer.terms ?? '', offer_type_label: offer.offer_type_label ?? '' }
        const translations = await translateForPublish('offer', source, offer.translations)
        const { error: translationError } = await supabase.rpc('admin_set_offer_translations', { p_id: id, p_source: source, p_translations: translations })
        if (translationError) throw translationError
      }
      const { error } = await supabase.rpc('admin_set_offer_status', { p_id: id, p_status: status })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offers'] })
      queryClient.invalidateQueries({ queryKey: ['offer'] })
      queryClient.invalidateQueries({ queryKey: ['business'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] })
      queryClient.invalidateQueries({ queryKey: ['audit-log'] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}
