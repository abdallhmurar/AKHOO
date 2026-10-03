import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Languages } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export function ContentTranslationNotice() {
  const { t } = useTranslation()
  const status = useQuery({
    queryKey: ['content-translation-status'], staleTime: 60000,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('translate-content', { body: { action: 'status' } })
      if (error) throw error
      return data?.configured === true
    }
  })
  return <div role="status" className="flex items-start gap-2 rounded-lg border border-border bg-secondary p-3 text-xs text-foreground">
    <Languages className="size-4 shrink-0" />
    <span>{t(status.isPending ? 'contentTranslation.checking' : status.isError ? 'contentTranslation.statusError' : status.data ? 'contentTranslation.enabled' : 'contentTranslation.setupNeeded')}</span>
  </div>
}
