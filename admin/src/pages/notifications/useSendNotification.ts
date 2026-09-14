import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import type { NotificationAudience } from '@/types'

export function useSendNotification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ title, body, audience }: { title: string; body: string; audience: NotificationAudience }) => {
      const { data: notification, error } = await supabase.rpc('admin_create_broadcast_notification', { p_title: title, p_body: body, p_target: audience })
      if (error) throw error

      const { error: sendError } = await supabase.functions.invoke('send-broadcast-notification', { body: { notification_id: notification.id } })
      if (sendError) throw sendError

      return notification
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['audit-log'] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}
