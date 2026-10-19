import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import i18next from 'i18next'
import { supabase } from '@/lib/supabase'
import { translateForPublish } from '@/lib/contentTranslation'
import type { ContentTranslations } from '../../../../shared/contentTranslations'
import type { Business, OpeningHours, BusinessCategory } from '@/types'

export type BusinessFormPayload = {
  name: string
  category: BusinessCategory
  description: string
  phone: string
  whatsapp: string
  address: string
  latitude: number | null
  longitude: number | null
  service_area: string
  opening_hours: OpeningHours | null
  website_url: string
  social_url: string
  logo_url: string | null
}

export function useUpsertBusiness() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, payload, existingTranslations }: { id: string | null; payload: BusinessFormPayload; existingTranslations?: ContentTranslations }) => {
      // Businesses are visible to users as soon as they are saved, so they are
      // translated on every save (unchanged text reuses the stored translation).
      // A translation outage must not stop the admin from saving a business: it
      // is saved with the Arabic original and "Translate all content" can fill
      // the translation in later.
      let translations: ContentTranslations = {}
      try {
        translations = await translateForPublish('business', { name: payload.name, description: payload.description, address: payload.address, service_area: payload.service_area }, existingTranslations)
      } catch {
        toast.warning(i18next.t('contentTranslation.businessSavedUntranslated'), { duration: 9000 })
      }
      const { data, error } = await supabase.rpc('admin_upsert_business', { p_id: id, p_payload: { ...payload, translations } })
      if (error) throw error
      return data as Business
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['businesses'] })
      queryClient.invalidateQueries({ queryKey: ['business'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] })
      queryClient.invalidateQueries({ queryKey: ['audit-log'] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}
