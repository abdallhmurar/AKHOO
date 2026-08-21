import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { RequestStatusBadge, BooleanBadge } from '@/components/StatusBadge'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { FullPageSpinner } from '@/components/FullPageSpinner'
import { ErrorState } from '@/components/ErrorState'
import { EmptyState } from '@/components/EmptyState'
import { useIsRTL } from '@/lib/direction'
import { AUDIT_ACTION_LABEL_KEYS } from '@/lib/auditActions'
import { useVolunteerDetail } from './useVolunteerDetail'
import { useSetVolunteerVerified } from './useSetVolunteerVerified'
import { ActivityStar } from './ActivityStar'

export function VolunteerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const isRTL = useIsRTL()
  const BackIcon = isRTL ? ArrowRight : ArrowLeft
  const query = useVolunteerDetail(id)
  const verifyMutation = useSetVolunteerVerified()
  const [confirmOpen, setConfirmOpen] = useState(false)

  if (query.isPending) return <FullPageSpinner />
  if (query.isError || !query.data) return <ErrorState onRetry={() => query.refetch()} />

  const { profile, volunteerProfile, missions, points, history, completedCount } = query.data
  const initial = (profile.full_name?.trim()?.[0] ?? '?').toUpperCase()
  const totalPoints = points.reduce((sum, p) => sum + p.points, 0)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/volunteers')}>
          <BackIcon className="size-4" />
        </Button>
        <Avatar className="size-10">
          <AvatarImage src={profile.avatar_url ?? undefined} />
          <AvatarFallback>{initial}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h1 className="text-xl font-extrabold text-foreground">{profile.full_name || t('users.table.noName')}</h1>
          <ActivityStar completedCount={completedCount} />
        </div>
        <BooleanBadge value={volunteerProfile.is_verified} trueLabel={t('volunteers.table.verified')} falseLabel={t('volunteers.table.unverified')} />
        <Button variant="outline" size="sm" onClick={() => setConfirmOpen(true)}>
          {volunteerProfile.is_verified ? t('volunteers.detail.unverify') : t('volunteers.detail.verify')}
        </Button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={volunteerProfile.is_verified ? t('volunteers.detail.unverifyConfirmTitle') : t('volunteers.detail.verifyConfirmTitle')}
        description={volunteerProfile.is_verified ? t('volunteers.detail.unverifyConfirmMessage') : t('volunteers.detail.verifyConfirmMessage')}
        confirmLabel={volunteerProfile.is_verified ? t('volunteers.detail.unverify') : t('volunteers.detail.verify')}
        onConfirm={() => verifyMutation.mutateAsync({ userId: profile.id, verified: !volunteerProfile.is_verified })}
      />

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">{t('volunteers.detail.tabs.profile')}</TabsTrigger>
          <TabsTrigger value="missions">{t('volunteers.detail.tabs.missions')}</TabsTrigger>
          <TabsTrigger value="points">{t('volunteers.detail.tabs.points')}</TabsTrigger>
          <TabsTrigger value="history">{t('volunteers.detail.tabs.history')}</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardContent className="flex flex-col gap-2 p-4">
              <p className="text-xs font-semibold uppercase text-muted-foreground">{t('volunteers.detail.services')}</p>
              <p className="text-sm text-foreground">
                {volunteerProfile.services.length ? volunteerProfile.services.map(s => t(`requests.service.${s}`)).join(' · ') : t('volunteers.detail.noServices')}
              </p>
              <BooleanBadge value={volunteerProfile.is_available} trueLabel={t('volunteers.table.available')} falseLabel={t('volunteers.table.unavailable')} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="missions">
          {missions.length === 0 ? (
            <EmptyState message={t('users.detail.noRequests')} />
          ) : (
            <ul className="flex flex-col gap-2">
              {missions.map(m => (
                <li key={m.id}>
                  <Card className="cursor-pointer" onClick={() => navigate(`/requests/${m.id}`)}>
                    <CardContent className="flex items-center justify-between gap-3 p-3">
                      <span className="text-sm text-foreground">{t(`requests.service.${m.service_type}`)}</span>
                      <RequestStatusBadge status={m.status} />
                      <span className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleDateString(i18n.language, { dateStyle: 'medium' })}</span>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="points">
          {points.length === 0 ? (
            <EmptyState message={t('volunteers.detail.noPoints')} />
          ) : (
            <>
              <p className="mb-2 text-sm font-semibold text-foreground">{totalPoints} {t('points.title')}</p>
              <ul className="flex flex-col gap-2 text-sm">
                {points.map(p => (
                  <li key={p.id} className="flex items-center justify-between border-b border-border py-2 last:border-0">
                    <span className="text-foreground">+{p.points}</span>
                    <span className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString(i18n.language, { dateStyle: 'medium' })}</span>
                  </li>
                ))}
              </ul>
            </>
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
