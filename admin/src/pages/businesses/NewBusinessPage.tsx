import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useIsRTL } from '@/lib/direction'
import { BusinessForm } from './BusinessForm'

export function NewBusinessPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const isRTL = useIsRTL()
  const BackIcon = isRTL ? ArrowRight : ArrowLeft

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/businesses')}>
          <BackIcon className="size-4" />
        </Button>
        <h1 className="text-xl font-extrabold text-foreground">{t('businesses.create')}</h1>
      </div>
      <BusinessForm />
    </div>
  )
}
