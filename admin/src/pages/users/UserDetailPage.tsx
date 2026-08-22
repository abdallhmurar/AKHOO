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
import { ActivityStar } from '@/components/ActivityStar'
import { useIsRTL } from '@/lib/direction'
import { AUDIT_ACTION_LABEL_KEYS } from '@/lib/auditActions'
import { useUserDetail } from './useUserDetail'
import { useSetUserBanned } from './useSetUserBanned'
import { useSetVolunteerVerified } from './useSetVolunteerVerified'

export function UserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const isRTL = useIsRTL()
  const BackIcon = isRTL ? ArrowRight : ArrowLeft
  const query = useUserDetail(id)
  const banMutation = useSetUserBanned()
  const verifyMutation = useSetVolunteerVerified()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [verifyConfirmOpen, setVerifyConfirmOpen] = useState(false)

  if (query.isPending) return <FullPageSpinner />
  if (query.isError || !query.data) return <ErrorState onRetry={() => query.refetch()} />

  const { profile, requests, volunteerProfile, assists, points, completedCount, history } = query.data
  const initial = (profile.full_name?.trim()?.[0] ?? '?').toUpperCase()
  const totalPoints = points.reduce((sum, p) => sum + p.points, 0)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/users')}>
          <BackIcon className="size-4" />
        </Button>
        <Avatar className="size-10">
          <AvatarImage src={profile.avatar_url ?? undefined} />
          <AvatarFallback>{initial}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h1 className="text-xl font-extrabold text-foreground">{profile.full_name || t('users.table.noName')}</h1>
          <p className="text-sm text-muted-foreground" dir="ltr">{profile.phone || t('users.table.noPhone')}</p>
        </div>
        <BooleanBadge value={profile.is_banned} trueLabel={t('users.table.banned')} falseLabel={t('users.table.active')} invertTone />
        <Button variant={profile.is_banned ? 'default' : 'destructive'} size="sm" onClick={() => setConfirmOpen(true)}>
          {profile.is_banned ? t('users.detail.unban') : t('users.detail.ban')}
        </Button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={profile.is_banned ? t('users.detail.unbanConfirmTitle') : t('users.detail.banConfirmTitle')}
        description={profile.is_banned ? t('users.detail.unbanConfirmMessage') : t('users.detail.banConfirmMessage')}
        confirmLabel={profile.is_banned ? t('users.detail.unban') : t('users.detail.ban')}
        destructive={!profile.is_banned}
        onConfirm={() => banMutation.mutateAsync({ userId: profile.id, banned: !profile.is_banned })}
      />

      {volunteerProfile && (
        <ConfirmDialog
          open={verifyConfirmOpen}
          onOpenChange={setVerifyConfirmOpen}
          title={volunteerProfile.is_verified ? t('users.detail.assists.unverifyConfirmTitle') : t('users.detail.assists.verifyConfirmTitle')}
          description={volunteerProfile.is_verified ? t('users.detail.assists.unverifyConfirmMessage') : t('users.detail.assists.verifyConfirmMessage')}
          confirmLabel={volunteerProfile.is_verified ? t('users.detail.assists.unverify') : t('users.detail.assists.verify')}
          onConfirm={() => verifyMutation.mutateAsync({ userId: profile.id, verified: !volunteerProfile.is_verified })}
        />
      )}

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">{t('users.detail.tabs.profile')}</TabsTrigger>
          <TabsTrigger value="requests">{t('users.detail.tabs.requests')}</TabsTrigger>
          <TabsTrigger value="assists">{t('users.detail.tabs.assists')}</TabsTrigger>
          <TabsTrigger value="points">{t('users.detail.tabs.points')}</TabsTrigger>
          <TabsTrigger value="history">{t('users.detail.tabs.history')}</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardContent className="flex flex-col gap-1 p-4">
              <p className="text-xs font-semibold uppercase text-muted-foreground">{t('users.detail.memberSince')}</p>
              <p className="text-sm text-foreground">{new Date(profile.created_at).toLocaleDateString(i18n.language, { dateStyle: 'long' })}</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests">
          {requests.length === 0 ? (
            <EmptyState message={t('users.detail.noRequests')} />
          ) : (
            <ul className="flex flex-col gap-2">
              {requests.map(r => (
                <li key={r.id}>
                  <Card className="cursor-pointer" onClick={() => navigate(`/requests/${r.id}`)}>
                    <CardContent className="flex items-center justify-between gap-3 p-3">
                      <span className="text-sm text-foreground">{t(`requests.service.${r.service_type}`)}</span>
                      <RequestStatusBadge status={r.status} />
                      <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString(i18n.language, { dateStyle: 'medium' })}</span>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="assists">
          {!volunteerProfile ? (
            <EmptyState message={t('users.detail.notAVolunteer')} />
          ) : (
            <div className="flex flex-col gap-3">
              <Card>
                <CardContent className="flex flex-col gap-3 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-foreground">{completedCount} {t('users.detail.assists.completedAssists')}</span>
                      <ActivityStar completedCount={completedCount} />
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setVerifyConfirmOpen(true)}>
                      {volunteerProfile.is_verified ? t('users.detail.assists.unverify') : t('users.detail.assists.verify')}
                    </Button>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <BooleanBadge value={volunteerProfile.is_verified} trueLabel={t('users.detail.assists.verified')} falseLabel={t('users.detail.assists.unverified')} />
                    <BooleanBadge value={volunteerProfile.is_available} trueLabel={t('users.detail.assists.available')} falseLabel={t('users.detail.assists.unavailable')} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-muted-foreground">{t('users.detail.assists.services')}</p>
                    <p className="text-sm text-foreground">
                      {volunteerProfile.services.length ? volunteerProfile.services.map(s => t(`requests.service.${s}`)).join(' · ') : t('users.detail.assists.noServices')}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {assists.length === 0 ? (
                <EmptyState message={t('users.detail.noRequests')} />
              ) : (
                <ul className="flex flex-col gap-2">
                  {assists.map(a => (
                    <li key={a.id}>
                      <Card className="cursor-pointer" onClick={() => navigate(`/requests/${a.id}`)}>
                        <CardContent className="flex items-center justify-between gap-3 p-3">
                          <span className="text-sm text-foreground">{t(`requests.service.${a.service_type}`)}</span>
                          <RequestStatusBadge status={a.status} />
                          <span className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString(i18n.language, { dateStyle: 'medium' })}</span>
                        </CardContent>
                      </Card>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="points">
          {points.length === 0 ? (
            <EmptyState message={t('users.detail.assists.noPoints')} />
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
