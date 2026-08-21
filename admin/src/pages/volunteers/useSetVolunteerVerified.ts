import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

export function useSetVolunteerVerified() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ userId, verified }: { userId: string; verified: boolean }) => {
      const { error } = await supabase.rpc('admin_set_volunteer_verified', { p_user_id: userId, p_verified: verified })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volunteers'] })
      queryClient.invalidateQueries({ queryKey: ['volunteer'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] })
      queryClient.invalidateQueries({ queryKey: ['audit-log'] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}
