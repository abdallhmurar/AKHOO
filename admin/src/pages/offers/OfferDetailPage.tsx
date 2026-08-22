import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ArrowRight, Pencil, CheckCircle2, XCircle, PauseCircle, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { OfferStatusBadge } from '@/components/StatusBadge'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { FullPageSpinner } from '@/components/FullPageSpinner'
import { ErrorState } from '@/components/ErrorState'
import { useIsRTL } from '@/lib/direction'
import { AUDIT_ACTION_LABEL_KEYS } from '@/lib/auditActions'
import { effectiveOfferStatus } from '@/lib/offerStatus'
import { useOfferDetail } from './useOfferDetail'
import { useSetOfferStatus } from './useSetOfferStatus'
import { OfferPreviewCard } from './OfferPreviewCard'

type PendingAction = 'approved' | 'rejected' | 'paused' | null

export function OfferDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const isRTL = useIsRTL()
  const BackIcon = isRTL ? ArrowRight : ArrowLeft
  const query = useOfferDetail(id)
  const setStatus = useSetOfferStatus()
  const [pendingAction, setPendingAction] = useState<PendingAction>(null)

  if (query.isPending) return <FullPageSpinner />
  if (query.isError || !query.data) return <ErrorState onRetry={() => query.refetch()} />

  const { offer, business, history } = query.data
  const status = effectiveOfferStatus(offer.status, offer.valid_until)
  const computedPct = offer.original_price && offer.offer_price != null && offer.original_price > 0 ? Math.round(((offer.original_price - offer.offer_price) / offer.original_price) * 1000) / 10 : null

  const actionCopy: Record<Exclude<PendingAction, null>, { title: string; message: string; confirm: string; destructive?: boolean }> = {
    approved: { title: t('offers.detail.approveConfirmTitle'), message: t('offers.detail.approveConfirmMessage'), confirm: t('offers.detail.approve') },
    rejected: { title: t('offers.detail.rejectConfirmTitle'), message: t('offers.detail.rejectConfirmMessage'), confirm: t('offers.detail.reject'), destructive: true },
    paused: { title: t('offers.detail.pauseConfirmTitle'), message: t('offers.detail.pauseConfirmMessage'), confirm: t('offers.detail.pause') }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/offers')}>
          <BackIcon className="size-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-extrabold text-foreground">{offer.title}</h1>
          {business ? (
            <button type="button" className="text-sm text-muted-foreground underline" onClick={() => navigate(`/businesses/${business.id}`)}>
              {business.name}
            </button>
          ) : null}
        </div>
        {offer.member_only ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-sanad-forest px-2.5 py-1 text-xs font-bold text-sanad-sand">
            <Sparkles className="size-3.5" />
            {t('offers.detail.memberOnlyBadge')}
          </span>
        ) : null}
        <OfferStatusBadge status={status} />
        <Button variant="outline" size="sm" onClick={() => navigate(`/offers/${id}/edit`)}>
          <Pencil className="size-4" />
          {t('offers.edit')}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {offer.status !== 'approved' ? (
          <Button size="sm" onClick={() => setPendingAction('approved')}>
            <CheckCircle2 className="size-4" />
            {t('offers.detail.approve')}
          </Button>
        ) : null}
        {offer.status !== 'paused' ? (
          <Button size="sm" variant="outline" onClick={() => setPendingAction('paused')}>
            <PauseCircle className="size-4" />
            {t('offers.detail.pause')}
          </Button>
        ) : null}
        {offer.status !== 'rejected' ? (
          <Button size="sm" variant="destructive" onClick={() => setPendingAction('rejected')}>
            <XCircle className="size-4" />
            {t('offers.detail.reject')}
          </Button>
        ) : null}
      </div>

      {pendingAction ? (
        <ConfirmDialog
          open={!!pendingAction}
          onOpenChange={open => !open && setPendingAction(null)}
          title={actionCopy[pendingAction].title}
          description={actionCopy[pendingAction].message}
          confirmLabel={actionCopy[pendingAction].confirm}
          destructive={actionCopy[pendingAction].destructive}
          onConfirm={() => setStatus.mutateAsync({ id: offer.id, status: pendingAction })}
        />
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-4">
          {/* Trust/review panel - section 11: everything an admin needs to
              verify before approving, in one place, with no automatic
              "competitive with market" claim anywhere. */}
          <Card>
            <CardContent className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3">
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">{t('offers.form.originalPrice')}</p>
                <p className="text-sm text-foreground" dir="ltr">{offer.original_price ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">{t('offers.form.offerPrice')}</p>
                <p className="text-sm text-foreground" dir="ltr">{offer.offer_price ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">{t('offers.detail.calculatedDiscount')}</p>
                <p className="text-sm font-semibold text-sanad-success" dir="ltr">{computedPct != null ? `${computedPct}%` : offer.discount_value ? `${offer.discount_value}${offer.discount_type === 'percentage' ? '%' : ''}` : '—'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">{t('common.dateFrom')}</p>
                <p className="text-sm text-foreground">{offer.valid_from ? new Date(offer.valid_from).toLocaleDateString(i18n.language, { dateStyle: 'medium' }) : '—'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">{t('common.dateTo')}</p>
                <p className="text-sm text-foreground">{offer.valid_until ? new Date(offer.valid_until).toLocaleDateString(i18n.language, { dateStyle: 'medium' }) : '—'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">{t('offers.form.discountType')}</p>
                <p className="text-sm text-foreground">{t(`offers.discountTypes.${offer.discount_type}`)}</p>
              </div>
              {offer.terms ? (
                <div className="col-span-2 sm:col-span-3">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">{t('offers.form.terms')}</p>
                  <p className="text-sm text-foreground">{offer.terms}</p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">{t('businesses.detail.tabs.history')}</p>
              {history.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('users.detail.noHistory')}</p>
              ) : (
                <ul className="flex flex-col gap-2 text-sm">
                  {history.map(item => (
                    <li key={item.id} className="flex items-center justify-between border-b border-border py-2 last:border-0">
                      <span className="text-foreground">{t(AUDIT_ACTION_LABEL_KEYS[item.action])}</span>
                      <span className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleString(i18n.language, { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase text-muted-foreground">{t('offers.form.previewLabel')}</p>
          <OfferPreviewCard
            title={offer.title}
            description={offer.description ?? ''}
            businessName={business?.name ?? null}
            imageUrl={offer.image_url}
            discountType={offer.discount_type}
            discountValue={offer.discount_value}
            originalPrice={offer.original_price}
            offerPrice={offer.offer_price}
            validUntil={offer.valid_until}
          />
        </div>
      </div>
    </div>
  )
}
