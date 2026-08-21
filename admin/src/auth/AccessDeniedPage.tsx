import { ShieldX } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { useAuth } from './useAuth'

export function AccessDeniedPage() {
  const { t } = useTranslation()
  const { signOut } = useAuth()

  return (
    <div className="flex min-h-dvh w-full flex-col items-center justify-center gap-4 bg-background p-4 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
        <ShieldX className="size-8 text-destructive" />
      </div>
      <div>
        <h1 className="text-xl font-bold text-foreground">{t('auth.accessDeniedTitle')}</h1>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{t('auth.accessDeniedMessage')}</p>
      </div>
      <Button variant="outline" onClick={signOut}>
        {t('common.signOut')}
      </Button>
    </div>
  )
}
