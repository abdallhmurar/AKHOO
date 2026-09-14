import { useTranslation } from 'react-i18next'
import { Crown } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

// Deliberately a placeholder, not a stub someone forgot to wire up - AKHOO
// Pro Max itself hasn't shipped yet (see the old SANAD+ membership admin
// page, which was explicitly deferred rather than built out further for
// the same reason). Nothing here should pretend to be real until the
// membership tier it manages actually exists.
export function ProMaxPage() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">{t('proMax.title')}</h1>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-gold-soft">
            <Crown className="size-7 text-gold" />
          </div>
          <p className="text-lg font-bold text-foreground">{t('proMax.comingSoonTitle')}</p>
          <p className="max-w-md text-sm text-muted-foreground">{t('proMax.comingSoonMessage')}</p>
        </CardContent>
      </Card>
    </div>
  )
}
