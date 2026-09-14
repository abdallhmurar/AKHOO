import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import type { OfferRedemption } from '@/types'

export function useRedeemCode() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (code: string) => {
      const { data, error } = await supabase.rpc('admin_redeem_offer_code', { p_code: code.trim() })
      if (error) throw error
      return data as OfferRedemption
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['redemptions'] })
      queryClient.invalidateQueries({ queryKey: ['audit-log'] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}
