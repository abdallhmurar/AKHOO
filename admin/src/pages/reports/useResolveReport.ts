import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import type { ReportStatus } from '@/types'

export function useResolveReport() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, status, note }: { id: string; status: Exclude<ReportStatus, 'open'>; note?: string }) => {
      const { error } = await supabase.rpc('admin_resolve_report', { p_id: id, p_status: status, p_note: note ?? null })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] })
      queryClient.invalidateQueries({ queryKey: ['report'] })
      queryClient.invalidateQueries({ queryKey: ['audit-log'] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}
