import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { RequestStatusBadge } from '@/components/StatusBadge'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { FullPageSpinner } from '@/components/FullPageSpinner'
import { ErrorState } from '@/components/ErrorState'
import { useIsRTL } from '@/lib/direction'
import { useRequestDetail } from './useRequestDetail'
import { useCancelRequest } from './useCancelRequest'
import { RequestTimeline } from './RequestTimeline'
import { RequestMap } from './RequestMap'

export function RequestDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const isRTL = useIsRTL()
  const BackIcon = isRTL ? ArrowRight : ArrowLeft
  const query = useRequestDetail(id)
  const cancelMutation = useCancelRequest()
  const [confirmOpen, setConfirmOpen] = useState(false)

  if (query.isPending) return <FullPageSpinner />
  if (query.isError || !query.data) return <ErrorState onRetry={() => query.refetch()} />

  const { request, requester, volunteer, releases, pointsTransaction } = query.data
  const canCancel = request.status !== 'completed' && request.status !== 'cancelled'

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/requests')}>
          <BackIcon className="size-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-extrabold text-foreground">
            {t('requests.detail.title')} · <span className="font-mono text-base">{request.id.slice(0, 8).toUpperCase()}</span>
          </h1>
        </div>
        <RequestStatusBadge status={request.status} />
        {canCancel ? (
          <Button variant="destructive" size="sm" onClick={() => setConfirmOpen(true)}>
            {t('requests.detail.cancelRequest')}
          </Button>
        ) : null}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t('requests.detail.cancelConfirmTitle')}
        description={t('requests.detail.cancelConfirmMessage')}
        confirmLabel={t('requests.detail.cancelRequest')}
        destructive
        onConfirm={() => cancelMutation.mutateAsync(request.id)}
      />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">{t('requests.detail.tabs.overview')}</TabsTrigger>
          <TabsTrigger value="timeline">{t('requests.detail.tabs.timeline')}</TabsTrigger>
          <TabsTrigger value="map">{t('requests.detail.tabs.map')}</TabsTrigger>
          <TabsTrigger value="history">{t('requests.detail.tabs.history')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card>
              <CardContent className="flex flex-col gap-1 p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">{t('requests.detail.requester')}</p>
                <p className="font-medium text-foreground">{requester?.full_name || t('users.table.noName')}</p>
                <p className="text-sm text-muted-foreground" dir="ltr">{requester?.phone || t('users.table.noPhone')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col gap-1 p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">{t('requests.detail.volunteer')}</p>
                {volunteer ? (
                  <>
                    <p className="font-medium text-foreground">{volunteer.full_name || t('users.table.noName')}</p>
                    <p className="text-sm text-muted-foreground" dir="ltr">{volunteer.phone || t('users.table.noPhone')}</p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">{t('requests.table.unassigned')}</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="flex flex-col gap-1 p-4">
              <p className="text-xs font-semibold uppercase text-muted-foreground">{t('requests.detail.note')}</p>
              <p className="text-sm text-foreground">{request.note || t('requests.detail.noNote')}</p>
            </CardContent>
          </Card>

          {request.photo_url ? (
            <Card>
              <CardContent className="p-4">
                <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">{t('requests.detail.photo')}</p>
                <img src={request.photo_url} alt="" className="max-h-72 rounded-lg border border-border object-cover" />
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardContent className="flex flex-col gap-1 p-4">
              <p className="text-xs font-semibold uppercase text-muted-foreground">{t('requests.detail.pointsAwarded')}</p>
              {pointsTransaction ? (
                <p className="text-sm text-foreground">
                  +{pointsTransaction.points} · {new Date(pointsTransaction.created_at).toLocaleString(i18n.language, { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">{t('requests.detail.noPoints')}</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline">
          <Card>
            <CardContent className="p-4">
              <RequestTimeline request={request} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="map">
          <RequestMap latitude={request.latitude} longitude={request.longitude} />
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardContent className="p-4">
              <p className="mb-3 text-xs font-semibold uppercase text-muted-foreground">{t('requests.detail.releaseHistory')}</p>
              {releases.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('requests.detail.noReleases')}</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {releases.map(release => (
                    <li key={release.id} className="text-sm">
                      <p className="text-foreground">{new Date(release.released_at).toLocaleString(i18n.language, { dateStyle: 'medium', timeStyle: 'short' })}</p>
                      {release.reason ? <p className="text-muted-foreground">{release.reason}</p> : null}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
