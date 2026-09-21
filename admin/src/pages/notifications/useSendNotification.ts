import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import type { NotificationAudience } from '@/types'

export function useSendNotification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ title, body, details, audience, imageUrls }: { title: string; body: string; details: string; audience: NotificationAudience; imageUrls: string[] }) => {
      const { data: notification, error } = await supabase.rpc('admin_create_broadcast_notification', { p_title: title, p_body: body, p_target: audience, p_image_urls: imageUrls, p_details: details.trim() || null })
      if (error) throw error

      const { data: delivery, error: sendError } = await supabase.functions.invoke('send-broadcast-notification', { body: { notification_id: notification.id } })
      // The campaign already exists. Keep its id for retry from history;
      // resubmitting the compose form must not create a duplicate campaign.
      return { ...notification, deliveryComplete: !sendError && delivery?.complete === true }
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

export function useRetryNotification() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.functions.invoke('send-broadcast-notification', { body: { notification_id: id } })
      if (error) throw error
      return data as { complete: boolean }
    },
    onSettled: () => { void queryClient.invalidateQueries({ queryKey: ['notifications'] }) }
  })
}
