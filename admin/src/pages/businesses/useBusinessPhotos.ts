import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { uploadBusinessImage, removeBusinessImage } from '@/lib/storage'

// Direct RLS-gated writes (the "business photos admin write" policy in
// 0015_businesses_offers_reviews.sql), not an RPC - individual photo adds/
// removes aren't part of the audit-logged event set (only the parent
// business's own edit event is), so there's no atomicity requirement an
// RPC would be needed for here.
export function useAddBusinessPhoto(businessId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ file, sortOrder }: { file: File; sortOrder: number }) => {
      const url = await uploadBusinessImage(file, businessId, 'photos')
      const { error } = await supabase.from('business_photos').insert({ business_id: businessId, url, sort_order: sortOrder })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business', businessId] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}

export function useRemoveBusinessPhoto(businessId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, url }: { id: string; url: string }) => {
      const { error } = await supabase.from('business_photos').delete().eq('id', id)
      if (error) throw error
      await removeBusinessImage(url).catch(() => {})
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business', businessId] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}
