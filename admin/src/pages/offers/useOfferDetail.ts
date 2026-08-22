import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Offer, Business, AdminAuditLog } from '@/types'

export function useOfferDetail(id: string | undefined) {
  return useQuery({
    queryKey: ['offer', id],
    enabled: !!id,
    queryFn: async () => {
      const { data: offer, error } = await supabase.from('partner_offers').select('*').eq('id', id!).single()
      if (error) throw error
      const o = offer as Offer

      const { data: business } = await supabase.from('partners').select('*').eq('id', o.partner_id).single()

      const { data: history } = await supabase.from('admin_audit_log').select('*').eq('target_type', 'offer').eq('target_id', o.id).order('created_at', { ascending: false })

      return {
        offer: o,
        business: (business ?? null) as Business | null,
        history: (history ?? []) as AdminAuditLog[]
      }
    }
  })
}
