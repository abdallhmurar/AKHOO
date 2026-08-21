import { WifiOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'

export function NetworkErrorPage({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-dvh w-full flex-col items-center justify-center gap-4 bg-background p-4 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-muted">
        <WifiOff className="size-8 text-muted-foreground" />
      </div>
      <div>
        <h1 className="text-xl font-bold text-foreground">{t('auth.networkErrorTitle')}</h1>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{t('auth.networkErrorMessage')}</p>
      </div>
      <Button onClick={onRetry}>{t('common.retry')}</Button>
    </div>
  )
}
