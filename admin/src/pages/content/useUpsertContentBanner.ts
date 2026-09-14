import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import type { ContentBanner, ContentBannerLanguage, ContentBannerSlot } from '@/types'

export function useUpsertContentBanner() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: { slot: ContentBannerSlot; language: ContentBannerLanguage; imageUrl: string; isActive: boolean }) => {
      const { data, error } = await supabase.rpc('admin_upsert_content_banner', {
        p_slot: payload.slot,
        p_language: payload.language,
        p_image_url: payload.imageUrl,
        p_is_active: payload.isActive
      })
      if (error) throw error
      return data as ContentBanner
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-banners'] })
      queryClient.invalidateQueries({ queryKey: ['audit-log'] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}
