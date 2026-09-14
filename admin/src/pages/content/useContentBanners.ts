import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { ContentBanner } from '@/types'

export function useContentBanners() {
  return useQuery({
    queryKey: ['content-banners'],
    queryFn: async () => {
      const { data, error } = await supabase.from('content_banners').select('*')
      if (error) throw error
      return (data ?? []) as ContentBanner[]
    }
  })
}
