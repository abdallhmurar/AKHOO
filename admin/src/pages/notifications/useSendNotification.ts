import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { translateForPublish } from '@/lib/contentTranslation'
import type { NotificationAudience } from '@/types'

export function useSendNotification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ title, body, details, audience, imageUrls, durationDays }: { title: string; body: string; details: string; audience: NotificationAudience; imageUrls: string[]; durationDays: number }) => {
      const translations = await translateForPublish('announcement', { title, body, details: details.trim() })
      const { data: notification, error } = await supabase.rpc('admin_create_broadcast_notification', { p_title: title, p_body: body, p_target: audience, p_image_urls: imageUrls, p_details: details.trim() || null, p_duration_days: durationDays, p_translations: translations })
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

export function useDeleteNotification() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc('admin_delete_broadcast_notification', { p_id: id })
      if (error) throw error
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

export function useDeleteAllNotifications() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('admin_delete_all_broadcast_notifications')
      if (error) throw error
      return data as number
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
