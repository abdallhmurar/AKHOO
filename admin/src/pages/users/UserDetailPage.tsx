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
import { useUserDetail } from './useUserDetail'
import { useSetUserBanned } from './useSetUserBanned'

export function UserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const isRTL = useIsRTL()
  const BackIcon = isRTL ? ArrowRight : ArrowLeft
  const query = useUserDetail(id)
  const banMutation = useSetUserBanned()
  const [confirmOpen, setConfirmOpen] = useState(false)

  if (query.isPending) return <FullPageSpinner />
  if (query.isError || !query.data) return <ErrorState onRetry={() => query.refetch()} />

  const { profile, requests, volunteerProfile, history } = query.data
  const initial = (profile.full_name?.trim()?.[0] ?? '?').toUpperCase()

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

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">{t('users.detail.tabs.profile')}</TabsTrigger>
          <TabsTrigger value="requests">{t('users.detail.tabs.requests')}</TabsTrigger>
          <TabsTrigger value="volunteer">{t('users.detail.tabs.volunteer')}</TabsTrigger>
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

        <TabsContent value="volunteer">
          {!volunteerProfile ? (
            <EmptyState message={t('users.detail.notAVolunteer')} />
          ) : (
            <Card>
              <CardContent className="flex flex-col gap-2 p-4">
                <BooleanBadge value={volunteerProfile.is_verified} trueLabel={t('volunteers.table.verified')} falseLabel={t('volunteers.table.unverified')} />
                <BooleanBadge value={volunteerProfile.is_available} trueLabel={t('volunteers.table.available')} falseLabel={t('volunteers.table.unavailable')} />
              </CardContent>
            </Card>
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
