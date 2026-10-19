import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Languages } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { translateAllContent } from '@/lib/translateAll'

export function TranslateAllButton() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const run = useMutation({
    mutationFn: translateAllContent,
    onSuccess: ({ translated, failed }) => {
      queryClient.invalidateQueries({ queryKey: ['businesses'] })
      queryClient.invalidateQueries({ queryKey: ['business'] })
      queryClient.invalidateQueries({ queryKey: ['offers'] })
      queryClient.invalidateQueries({ queryKey: ['offer'] })
      if (failed > 0) toast.warning(t('contentTranslation.translateAllPartial', { count: translated, failed }))
      else if (translated === 0) toast.success(t('contentTranslation.translateAllNothing'))
      else toast.success(t('contentTranslation.translateAllDone', { count: translated }))
    },
    onError: () => toast.error(t('contentTranslation.failed'))
  })

  return (
    <Button type="button" variant="outline" disabled={run.isPending} onClick={() => run.mutate()} title={t('contentTranslation.translateAllHint')}>
      <Languages className="size-4" />
      {run.isPending ? t('contentTranslation.translateAllRunning') : t('contentTranslation.translateAll')}
    </Button>
  )
}
