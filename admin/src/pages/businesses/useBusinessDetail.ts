import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Business, BusinessPhoto, Offer, Review, BusinessRating, AdminAuditLog, Profile } from '@/types'

export function useBusinessDetail(id: string | undefined) {
  return useQuery({
    queryKey: ['business', id],
    enabled: !!id,
    queryFn: async () => {
      const { data: business, error } = await supabase.from('partners').select('*').eq('id', id!).single()
      if (error) throw error

      const { data: photos } = await supabase.from('business_photos').select('*').eq('business_id', id!).order('sort_order')

      const { data: offers } = await supabase.from('partner_offers').select('*').eq('partner_id', id!).order('created_at', { ascending: false })

      const { data: reviews } = await supabase.from('reviews').select('*').eq('business_id', id!).order('created_at', { ascending: false })

      const { data: rating } = await supabase.from('business_ratings').select('*').eq('business_id', id!).maybeSingle()

      const { data: history } = await supabase.from('admin_audit_log').select('*').eq('target_type', 'business').eq('target_id', id!).order('created_at', { ascending: false })

      const reviewerIds = [...new Set((reviews ?? []).map(r => r.user_id))]
      const reviewerNames = new Map<string, string>()
      if (reviewerIds.length > 0) {
        const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', reviewerIds)
        for (const p of (profiles ?? []) as Pick<Profile, 'id' | 'full_name'>[]) reviewerNames.set(p.id, p.full_name)
      }

      return {
        business: business as Business,
        photos: (photos ?? []) as BusinessPhoto[],
        offers: (offers ?? []) as Offer[],
        reviews: ((reviews ?? []) as Review[]).map(r => ({ ...r, reviewer_name: reviewerNames.get(r.user_id) ?? null })),
        rating: (rating ?? null) as BusinessRating | null,
        history: (history ?? []) as AdminAuditLog[]
      }
    }
  })
}
