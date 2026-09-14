import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

export function useSetWeeklySlot() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, slot }: { id: string; slot: 1 | 2 | 3 | null }) => {
      const { error } = await supabase.rpc('admin_set_weekly_slot', { p_id: id, p_slot: slot })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offers'] })
      queryClient.invalidateQueries({ queryKey: ['offer'] })
      queryClient.invalidateQueries({ queryKey: ['audit-log'] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}
