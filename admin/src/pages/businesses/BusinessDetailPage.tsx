import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ArrowRight, Pencil, MessageCircle, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { BooleanBadge, OfferStatusBadge } from '@/components/StatusBadge'
import { StarRating } from '@/components/StarRating'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { FullPageSpinner } from '@/components/FullPageSpinner'
import { ErrorState } from '@/components/ErrorState'
import { EmptyState } from '@/components/EmptyState'
import { useIsRTL } from '@/lib/direction'
import { BUSINESS_CATEGORY_LABEL_KEYS } from '@/lib/categories'
import { AUDIT_ACTION_LABEL_KEYS } from '@/lib/auditActions'
import { effectiveOfferStatus } from '@/lib/offerStatus'
import { useBusinessDetail } from './useBusinessDetail'
import { useSetBusinessActive } from './useSetBusinessActive'
import { BusinessLocationMap } from './BusinessLocationMap'
import { BusinessPhotosManager } from './BusinessPhotosManager'

export function BusinessDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const isRTL = useIsRTL()
  const BackIcon = isRTL ? ArrowRight : ArrowLeft
  const query = useBusinessDetail(id)
  const setActive = useSetBusinessActive()
  const [confirmOpen, setConfirmOpen] = useState(false)

  if (query.isPending) return <FullPageSpinner />
  if (query.isError || !query.data) return <ErrorState onRetry={() => query.refetch()} />

  const { business, photos, offers, reviews, rating, history } = query.data
  const initial = business.name.trim()[0]?.toUpperCase() ?? '?'

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/businesses')}>
          <BackIcon className="size-4" />
        </Button>
        <Avatar className="size-10 rounded-lg">
          <AvatarImage src={business.logo_url ?? undefined} className="object-cover" />
          <AvatarFallback className="rounded-lg">{initial}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h1 className="text-xl font-extrabold text-foreground">{business.name}</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{t(BUSINESS_CATEGORY_LABEL_KEYS[business.category])}</span>
            <StarRating rating={rating?.average_rating ?? null} reviewCount={rating?.review_count} size="sm" />
          </div>
        </div>
        <BooleanBadge value={business.is_active} trueLabel={t('businesses.table.active')} falseLabel={t('businesses.table.inactive')} />
        <Button variant="outline" size="sm" onClick={() => navigate(`/businesses/${id}/edit`)}>
          <Pencil className="size-4" />
          {t('businesses.edit')}
        </Button>
        <Button variant={business.is_active ? 'destructive' : 'default'} size="sm" onClick={() => setConfirmOpen(true)}>
          {business.is_active ? t('businesses.detail.hide') : t('businesses.detail.activate')}
        </Button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={business.is_active ? t('businesses.detail.hideConfirmTitle') : t('businesses.detail.activateConfirmTitle')}
        description={business.is_active ? t('businesses.detail.hideConfirmMessage') : t('businesses.detail.activateConfirmMessage')}
        confirmLabel={business.is_active ? t('businesses.detail.hide') : t('businesses.detail.activate')}
        destructive={business.is_active}
        onConfirm={() => setActive.mutateAsync({ id: business.id, active: !business.is_active })}
      />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">{t('businesses.detail.tabs.overview')}</TabsTrigger>
          <TabsTrigger value="photos">{t('businesses.detail.tabs.photos')}</TabsTrigger>
          <TabsTrigger value="offers">{t('businesses.detail.tabs.offers')}</TabsTrigger>
          <TabsTrigger value="reviews">{t('businesses.detail.tabs.reviews')}</TabsTrigger>
          <TabsTrigger value="history">{t('businesses.detail.tabs.history')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="flex flex-col gap-4">
          <Card>
            <CardContent className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">{t('businesses.form.description')}</p>
                <p className="text-sm text-foreground">{business.description || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">{t('businesses.form.phone')}</p>
                <p className="text-sm text-foreground" dir="ltr">{business.phone || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">{t('businesses.form.whatsapp')}</p>
                <p className="flex items-center gap-1 text-sm text-foreground" dir="ltr">
                  {business.whatsapp ? <MessageCircle className="size-3.5 text-sanad-success" /> : null}
                  {business.whatsapp || '—'}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">{t('businesses.form.website')}</p>
                <p className="flex items-center gap-1 text-sm text-foreground" dir="ltr">
                  {business.website_url ? <Globe className="size-3.5 text-sanad-info" /> : null}
                  {business.website_url || '—'}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">{t('businesses.form.address')}</p>
                <p className="text-sm text-foreground">{business.address || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">{t('businesses.form.serviceArea')}</p>
                <p className="text-sm text-foreground">{business.service_area || '—'}</p>
              </div>
            </CardContent>
          </Card>

          {business.opening_hours && Object.keys(business.opening_hours).length > 0 ? (
            <Card>
              <CardContent className="p-4">
                <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">{t('businesses.form.sections.hours')}</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {Object.entries(business.opening_hours).map(([day, hours]) => (
                    <div key={day} className="text-sm">
                      <span className="font-medium text-foreground">{t(`businesses.form.days.${day}`)}: </span>
                      <span className="text-muted-foreground" dir="ltr">{hours}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}

          {business.latitude != null && business.longitude != null ? <BusinessLocationMap latitude={business.latitude} longitude={business.longitude} /> : null}
        </TabsContent>

        <TabsContent value="photos">
          <BusinessPhotosManager businessId={business.id} photos={photos} />
        </TabsContent>

        <TabsContent value="offers" className="flex flex-col gap-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => navigate(`/offers/new?business=${business.id}`)}>
              {t('offers.create')}
            </Button>
          </div>
          {offers.length === 0 ? (
            <EmptyState message={t('offers.detail.noneForBusiness')} />
          ) : (
            <ul className="flex flex-col gap-2">
              {offers.map(offer => (
                <li key={offer.id}>
                  <Card className="cursor-pointer" onClick={() => navigate(`/offers/${offer.id}`)}>
                    <CardContent className="flex items-center justify-between gap-3 p-3">
                      <span className="text-sm font-medium text-foreground">{offer.title}</span>
                      <OfferStatusBadge status={effectiveOfferStatus(offer.status, offer.valid_until)} />
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="reviews" className="flex flex-col gap-3">
          {reviews.length === 0 ? (
            <EmptyState message={t('businesses.detail.noReviews')} />
          ) : (
            reviews.map(review => (
              <Card key={review.id} className={review.is_hidden ? 'opacity-50' : undefined}>
                <CardContent className="flex flex-col gap-1 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{review.reviewer_name ?? t('common.unknown')}</span>
                    <StarRating rating={review.rating} size="sm" />
                  </div>
                  {review.comment ? <p className="text-sm text-muted-foreground">{review.comment}</p> : null}
                  <span className="text-xs text-muted-foreground">{new Date(review.created_at).toLocaleDateString(i18n.language, { dateStyle: 'medium' })}</span>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="history">
          {history.length === 0 ? (
            <EmptyState message={t('users.detail.noHistory')} />
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
        </TabsContent>
      </Tabs>
    </div>
  )
}
