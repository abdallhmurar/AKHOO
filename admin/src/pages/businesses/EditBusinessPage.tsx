import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useIsRTL } from '@/lib/direction'
import { FullPageSpinner } from '@/components/FullPageSpinner'
import { ErrorState } from '@/components/ErrorState'
import { useBusinessDetail } from './useBusinessDetail'
import { BusinessForm } from './BusinessForm'

export function EditBusinessPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const isRTL = useIsRTL()
  const BackIcon = isRTL ? ArrowRight : ArrowLeft
  const query = useBusinessDetail(id)

  if (query.isPending) return <FullPageSpinner />
  if (query.isError || !query.data) return <ErrorState onRetry={() => query.refetch()} />

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/businesses/${id}`)}>
          <BackIcon className="size-4" />
        </Button>
        <h1 className="text-xl font-extrabold text-foreground">
          {t('businesses.edit')} · {query.data.business.name}
        </h1>
      </div>
      <BusinessForm business={query.data.business} />
    </div>
  )
}
