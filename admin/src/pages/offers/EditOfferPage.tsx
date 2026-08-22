import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useIsRTL } from '@/lib/direction'
import { FullPageSpinner } from '@/components/FullPageSpinner'
import { ErrorState } from '@/components/ErrorState'
import { useOfferDetail } from './useOfferDetail'
import { OfferForm } from './OfferForm'

export function EditOfferPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const isRTL = useIsRTL()
  const BackIcon = isRTL ? ArrowRight : ArrowLeft
  const query = useOfferDetail(id)

  if (query.isPending) return <FullPageSpinner />
  if (query.isError || !query.data) return <ErrorState onRetry={() => query.refetch()} />

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/offers/${id}`)}>
          <BackIcon className="size-4" />
        </Button>
        <h1 className="text-xl font-extrabold text-foreground">
          {t('offers.edit')} · {query.data.offer.title}
        </h1>
      </div>
      <OfferForm offer={query.data.offer} />
    </div>
  )
}
