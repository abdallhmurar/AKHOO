import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { ActivityIndicator, Animated, Easing, Image, Linking, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ArrowRight, Star } from 'phosphor-react-native'
import { useTranslation } from 'react-i18next'
import { directionsHref, telHref } from '../../lib/contactLinks'
import { useIsRTL } from '../../lib/direction'
import { formatElapsed } from '../../lib/time'
import { translateActionError } from '../../lib/rpcErrors'
import { supabase } from '../../lib/supabase'
import { useAndroidBackHandler } from '../../lib/useAndroidBackHandler'
import { useStaggeredReveal } from '../../lib/useStaggeredReveal'
import { getVolunteerActivityLevel, ACTIVITY_LEVEL_COLORS, ACTIVITY_LEVEL_LABEL_KEYS } from '../../lib/activityLevel'
import type { ActivityLevel } from '../../lib/activityLevel'
import { radius, shadow, space, useSanadTheme } from '../../lib/theme'
import { useAppTypography } from '../../lib/typography'
import { useAuth } from '../../providers'
import { missionRepository } from '../../repositories/missionRepository'
import { profileRepository } from '../../repositories/profileRepository'
import type { Mission, MissionStatus } from '../../repositories/domainTypes'
import { queryKeys } from '../../services/queryKeys'
import { Avatar, Button, Card, IconButton, useToast } from '../../components/ui'
import { MissionTimeline } from '../../components/v2'
import { SanadMap } from '../../components/SanadMap'
import { SuccessCheckmark } from '../../components/SuccessCheckmark'
import { VolunteerActivityBadge } from '../../components/VolunteerActivityBadge'

const RELEASE_REASONS = ['cannot_reach', 'emergency', 'accepted_by_mistake', 'other'] as const
type ReleaseReason = (typeof RELEASE_REASONS)[number]
const LEVEL_UP_THRESHOLDS = [5, 15, 30, 60]
const TIMELINE: { status: MissionStatus; labelKey: string }[] = [
  { status: 'assigned', labelKey: 'common.timeline.accepted' },
  { status: 'on_the_way', labelKey: 'common.timeline.on_the_way' },
  { status: 'arrived', labelKey: 'common.timeline.arrived' },
  { status: 'awaiting_confirmation', labelKey: 'common.timeline.awaiting_confirmation' },
  { status: 'completed', labelKey: 'common.timeline.completed' }
]
// Legacy rows never carry 'in_progress' or 'disputed' - map them onto the
// nearest real i18n status key rather than adding new copy for states this
// (unmigrated) database can't actually produce.
const STATUS_LABEL: Record<MissionStatus, string> = {
  matching: 'open', assigned: 'accepted', on_the_way: 'on_the_way', arrived: 'arrived',
  in_progress: 'arrived', awaiting_confirmation: 'awaiting_confirmation', completed: 'completed',
  cancelled: 'cancelled', disputed: 'awaiting_confirmation'
}

// MissionProvider already holds the one realtime subscription for the
// signed-in user's active mission and invalidates queryKeys.mission(id) on
// every change (src/providers/MissionProvider.tsx) - subscribing again here
// for the same mission:${id} channel throws ("cannot add postgres_changes
// callbacks... after subscribe()", confirmed live against a real account's
// active mission) because supabase-js reuses one channel object per topic
// name. The 10s poll below is the floor; MissionProvider's push covers the
// rest, so this screen doesn't need its own subscription.
function useMissionDetail(missionId: string) {
  return useQuery({ queryKey: queryKeys.mission(missionId), queryFn: () => missionRepository.get(missionId), enabled: !!missionId, refetchInterval: 10_000 })
}

// Real SANAD live-mission screen - the same map+capsule+sheet composition as
// the intact src/screens/ActiveRequestScreen.tsx (requester side) and
// VolunteerJobScreen.tsx (helper side), merged into one route keyed by role
// since missionRepository already normalizes both sides into a single
// Mission shape. Not ccodex's invented chat/dispute/report/block/rating
// flows - none of that exists in the real product; a mission's only
// cross-party contact is a direct phone call.
export function LiveMissionScreen() {
  const theme = useSanadTheme()
  const router = useRouter()
  const { missionId } = useLocalSearchParams<{ missionId: string }>()
  const { session } = useAuth()
  const mission = useMissionDetail(String(missionId))
  const row = mission.data

  // A mission that's gone (completed elsewhere, cancelled, or never
  // existed) has nowhere useful to stay on this route - bounce Home
  // instead of rendering a dead-end screen.
  useEffect(() => {
    if (!mission.isLoading && !row) router.replace('/(tabs)')
  }, [mission.isLoading, row, router])

  if (mission.isLoading || !row) {
    return <View style={[styles.fill, styles.center, { backgroundColor: theme.colors.background }]}><ActivityIndicator color={theme.colors.primary} /></View>
  }
  const isRequester = row.requester_id === session?.user.id
  return isRequester ? <RequesterMissionView mission={row} /> : <HelperMissionView mission={row} />
}

function useOtherParty(mission: Mission, isRequester: boolean) {
  const otherId = isRequester ? mission.helper_id : mission.requester_id
  return useQuery({ queryKey: otherId ? queryKeys.profile(otherId) : ['participant'], queryFn: () => profileRepository.get(otherId!), enabled: !!otherId })
}

function MissionHero({ latitude, longitude, searching, header, onBack }: { latitude: number; longitude: number; searching: boolean; header: ReactNode; onBack: () => void }) {
  const theme = useSanadTheme()
  const { t } = useTranslation()
  const isRTL = useIsRTL()
  const BackIcon = isRTL ? ArrowRight : ArrowLeft
  const pulse = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (!searching) { pulse.setValue(0); return }
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 1600, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: 0, useNativeDriver: true })
    ]))
    loop.start()
    return () => loop.stop()
  }, [searching, pulse])

  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 2.6] })
  const ringOpacity = pulse.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.5, 0.15, 0] })

  return (
    <>
      <View style={styles.mapArea}>
        <SanadMap latitude={latitude} longitude={longitude} style={styles.map} />
        {searching ? (
          <View pointerEvents="none" style={styles.radarWrap}>
            <Animated.View style={[styles.radarRing, { backgroundColor: theme.colors.primary, opacity: ringOpacity, transform: [{ scale: ringScale }] }]} />
          </View>
        ) : null}
        <IconButton label={t('common.back')} size={42} style={{ ...styles.backButton, [isRTL ? 'right' : 'left']: space.lg }} icon={<BackIcon size={18} color={theme.colors.textPrimary} />} onPress={onBack} />
      </View>
      <View style={styles.capsuleWrap}>
        <View style={[styles.capsule, shadow.elevated, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>{header}</View>
      </View>
    </>
  )
}

function RequesterMissionView({ mission }: { mission: Mission }) {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const { t } = useTranslation()
  const router = useRouter()
  const toast = useToast()
  const queryClient = useQueryClient()
  const other = useOtherParty(mission, true)
  const [now, setNow] = useState(Date.now())
  const [busy, setBusy] = useState(false)
  const [confirmingCancel, setConfirmingCancel] = useState(false)
  const [respondingToCompletion, setRespondingToCompletion] = useState(false)
  const [justReleased, setJustReleased] = useState(false)
  const prevRef = useRef<{ status: MissionStatus; helperId: string | null } | null>(null)
  const volunteerCount = useQuery({
    queryKey: mission.helper_id ? ['volunteer-completed-count', mission.helper_id] : ['volunteer-completed-count'],
    queryFn: async () => {
      const { data } = await supabase.rpc('get_volunteer_completed_count', { p_volunteer_id: mission.helper_id })
      return (data as number | null) ?? 0
    },
    enabled: !!mission.helper_id
  })

  useAndroidBackHandler(() => router.replace('/(tabs)'))

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const prev = prevRef.current
    if (prev?.helperId && !mission.helper_id && mission.status === 'matching' && prev.status !== 'matching') setJustReleased(true)
    prevRef.current = { status: mission.status, helperId: mission.helper_id }
  }, [mission.status, mission.helper_id])

  async function cancel() {
    if (mission.status !== 'matching') return
    if (!confirmingCancel) { setConfirmingCancel(true); return }
    setBusy(true)
    try { await missionRepository.cancel(mission.id) } catch (cause: any) { toast.show(translateActionError(t, cause), 'error') } finally { setBusy(false); setConfirmingCancel(false) }
  }

  async function respond(confirmed: boolean) {
    setRespondingToCompletion(true)
    try {
      await missionRepository.confirmCompletion(mission.id, confirmed)
      await queryClient.invalidateQueries({ queryKey: queryKeys.mission(mission.id) })
    } catch (cause: any) { toast.show(translateActionError(t, cause), 'error') } finally { setRespondingToCompletion(false) }
  }

  const finished = mission.status === 'completed' || mission.status === 'cancelled'
  const searching = mission.status === 'matching'
  const awaitingConfirmation = mission.status === 'awaiting_confirmation'
  const timelineIndex = mission.status === 'completed' ? TIMELINE.length : TIMELINE.findIndex(step => step.status === mission.status)
  const showTimeline = timelineIndex !== -1
  const elapsedSince = searching ? mission.created_at : mission.accepted_at ?? mission.created_at
  const subtitle = searching ? t('activeRequest.subtitleSearching') : mission.status === 'completed' ? t('activeRequest.subtitleCompleted') : awaitingConfirmation ? t('activeRequest.subtitleAwaitingConfirmation') : t('activeRequest.subtitleTracking')

  return (
    <SafeAreaView style={styles.fill}>
      <MissionHero
        latitude={mission.request?.latitude ?? 31.7784}
        longitude={mission.request?.longitude ?? 35.2066}
        searching={searching}
        onBack={() => router.replace('/(tabs)')}
        header={mission.status === 'completed' ? (
          <CompletedHeader title={t(`activeRequest.status.${STATUS_LABEL[mission.status]}`)} subtitle={subtitle} />
        ) : (
          <>
            <Text style={[typography.h1, styles.centerText, { color: theme.colors.textPrimary }]}>{t(`activeRequest.status.${STATUS_LABEL[mission.status]}`)}</Text>
            <Text style={[typography.small, styles.centerText, { color: theme.colors.textSecondary }]}>{subtitle}</Text>
            {showTimeline ? <View style={styles.timelineWrap}><MissionTimeline steps={TIMELINE.map(step => ({ key: step.status, label: t(step.labelKey) }))} activeIndex={timelineIndex} /></View> : null}
          </>
        )}
      />

      <View style={[styles.sheet, { backgroundColor: theme.colors.surface }]}>
        <ScrollView contentContainerStyle={styles.sheetContent} showsVerticalScrollIndicator={false}>
          {justReleased && searching ? (
            <Card tone="default" elevation="none" title={t('activeRequest.releasedNotice.title')} subtitle={t('activeRequest.releasedNotice.message')} />
          ) : null}

          {awaitingConfirmation ? (
            <Card tone="primary" elevation="none">
              <Text style={[typography.bodyMedium, styles.centerText, { color: theme.colors.textPrimary }]}>{t('activeRequest.confirmPrompt')}</Text>
              <View style={[styles.confirmRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Button label={t('activeRequest.confirmReject')} variant="outline" style={styles.confirmButton} loading={respondingToCompletion} onPress={() => respond(false)} />
                <Button label={t('activeRequest.confirmAccept')} variant="community" style={styles.confirmButton} loading={respondingToCompletion} onPress={() => respond(true)} />
              </View>
            </Card>
          ) : null}

          {other.data ? (
            <Card
              title={other.data.full_name || t('activeRequest.defaultVolunteerName')}
              subtitle={t('points.completedCount', { count: volunteerCount.data ?? 0 })}
              leading={<Avatar name={other.data.full_name || 'SANAD'} uri={other.data.avatar_url} size={52} tone="community" />}
              trailing={<VolunteerActivityBadge completedCount={volunteerCount.data ?? 0} />}
            >
              {other.data.phone ? <Button label={t('activeRequest.callButton', { phone: other.data.phone })} variant="community" onPress={() => Linking.openURL(telHref(other.data!.phone!))} /> : null}
            </Card>
          ) : null}

          <Card title={t('activeRequest.requestId')} subtitle={mission.id.slice(0, 8).toUpperCase()}>
            {!finished ? (
              <View style={styles.elapsedRow}>
                <Text style={[typography.caption, { color: theme.colors.textMuted }]}>{searching ? t('activeRequest.waitingSince') : t('activeRequest.volunteerSince')}</Text>
                <Text style={[typography.bodyMedium, { color: theme.colors.textPrimary }]}>{formatElapsed(now - new Date(elapsedSince).getTime(), t)}</Text>
              </View>
            ) : null}
          </Card>

          {mission.request?.photo_url ? <Image source={{ uri: mission.request.photo_url }} style={styles.photo} /> : null}

          {finished ? <Button label={t('activeRequest.backToHome')} onPress={() => router.replace('/(tabs)')} /> : null}

          {searching ? (
            confirmingCancel ? (
              <View style={[styles.confirmRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Button label={t('activeRequest.cancelBack')} variant="outline" style={styles.confirmButton} onPress={() => setConfirmingCancel(false)} />
                <Button label={t('activeRequest.cancelConfirm')} variant="danger" style={styles.confirmButton} loading={busy} onPress={cancel} />
              </View>
            ) : (
              <Button label={t('activeRequest.cancel')} variant="outline" onPress={cancel} />
            )
          ) : null}
        </ScrollView>
      </View>
    </SafeAreaView>
  )
}

function HelperMissionView({ mission }: { mission: Mission }) {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const { t } = useTranslation()
  const router = useRouter()
  const toast = useToast()
  const queryClient = useQueryClient()
  const { session } = useAuth()
  const other = useOtherParty(mission, false)
  const [busy, setBusy] = useState(false)
  const [confirmingRelease, setConfirmingRelease] = useState(false)
  const [releaseReason, setReleaseReason] = useState<ReleaseReason | null>(null)
  const [releasing, setReleasing] = useState(false)
  const [completionStats, setCompletionStats] = useState<{ points: number; completedCount: number; leveledUpTo: ActivityLevel | null } | null>(null)

  useAndroidBackHandler(() => router.replace('/(tabs)'))

  useEffect(() => {
    if (mission.status !== 'completed' || completionStats) return
    let cancelled = false
    ;(async () => {
      const [{ data: pointsRow }, { data: countData }] = await Promise.all([
        supabase.from('volunteer_point_transactions').select('points').eq('request_id', mission.request_id).maybeSingle(),
        supabase.rpc('get_volunteer_completed_count', { p_volunteer_id: mission.helper_id })
      ])
      if (cancelled) return
      const completedCount = (countData as number | null) ?? 0
      const leveledUpTo = LEVEL_UP_THRESHOLDS.includes(completedCount) ? getVolunteerActivityLevel(completedCount) : null
      setCompletionStats({ points: (pointsRow as { points: number } | null)?.points ?? 0, completedCount, leveledUpTo })
    })()
    return () => { cancelled = true }
  }, [mission.status, mission.request_id, mission.helper_id, completionStats])

  async function advance(status: MissionStatus) {
    setBusy(true)
    try {
      await missionRepository.advance(mission.id, status)
      await queryClient.invalidateQueries({ queryKey: queryKeys.mission(mission.id) })
    } catch (cause: any) { toast.show(translateActionError(t, cause), 'error') } finally { setBusy(false) }
  }

  async function release() {
    setReleasing(true)
    try {
      const { error } = await supabase.rpc('release_help_request', { p_request_id: mission.request_id, p_reason: releaseReason })
      if (error) throw error
      if (session) await queryClient.invalidateQueries({ queryKey: queryKeys.activeMission(session.user.id) })
      router.replace('/(tabs)')
    } catch (cause: any) { toast.show(translateActionError(t, cause), 'error') } finally { setReleasing(false) }
  }

  if (mission.status === 'cancelled') {
    return (
      <SafeAreaView style={[styles.fill, styles.completionContent, { backgroundColor: theme.colors.background }]}>
        <SuccessCheckmark tone="danger" />
        <Text style={[typography.h2, styles.centerText, { color: theme.colors.textPrimary }]}>{t('volunteerJob.status.cancelled')}</Text>
        <Button label={t('volunteerJob.back')} onPress={() => router.replace('/(tabs)')} />
      </SafeAreaView>
    )
  }

  if (mission.status === 'completed') {
    return <HelperCompletion stats={completionStats} onDone={() => router.replace('/(tabs)')} />
  }

  const awaitingConfirmation = mission.status === 'awaiting_confirmation'
  const timelineIndex = TIMELINE.findIndex(step => step.status === mission.status)
  const showTimeline = timelineIndex !== -1
  const title = t(`volunteerJob.status.${STATUS_LABEL[mission.status]}`)

  return (
    <SafeAreaView style={styles.fill}>
      <MissionHero
        latitude={mission.request?.latitude ?? 31.7784}
        longitude={mission.request?.longitude ?? 35.2066}
        searching={false}
        onBack={() => router.replace('/(tabs)')}
        header={
          <>
            <Text style={[typography.h1, styles.centerText, { color: theme.colors.textPrimary }]}>{title}</Text>
            <Text style={[typography.small, styles.centerText, { color: theme.colors.textSecondary }]}>{awaitingConfirmation ? t('volunteerJob.awaitingConfirmationText') : t('volunteerJob.subtitle')}</Text>
            {showTimeline ? <View style={styles.timelineWrap}><MissionTimeline steps={TIMELINE.map(step => ({ key: step.status, label: t(step.labelKey) }))} activeIndex={timelineIndex} /></View> : null}
          </>
        }
      />

      <View style={[styles.sheet, { backgroundColor: theme.colors.surface }]}>
        <ScrollView contentContainerStyle={styles.sheetContent} showsVerticalScrollIndicator={false}>
          {other.data ? (
            <Card title={other.data.full_name || t('volunteerJob.defaultRequesterName')} subtitle={t('volunteerJob.requesterLabel')} leading={<Avatar name={other.data.full_name || 'SANAD'} uri={other.data.avatar_url} size={52} tone="primary" />}>
              {other.data.phone ? <Button label={t('volunteerJob.callButton', { phone: other.data.phone })} variant="community" onPress={() => Linking.openURL(telHref(other.data!.phone!))} /> : null}
            </Card>
          ) : null}

          <Card title={t('volunteerJob.requestId')} subtitle={mission.id.slice(0, 8).toUpperCase()} />

          {mission.request?.photo_url ? <Image source={{ uri: mission.request.photo_url }} style={styles.photo} /> : null}

          {awaitingConfirmation ? null : (
            <>
              <Button label={t('volunteerJob.openInGoogleMaps')} variant="outline" onPress={() => Linking.openURL(directionsHref(mission.request?.latitude ?? 0, mission.request?.longitude ?? 0))} />
              <Button label={t('volunteerJob.onMyWay')} disabled={mission.status !== 'assigned' || busy} loading={busy && mission.status === 'assigned'} onPress={() => advance('on_the_way')} />
              <Button label={t('volunteerJob.arrivedButton')} variant="community" disabled={mission.status !== 'on_the_way' || busy} loading={busy && mission.status === 'on_the_way'} onPress={() => advance('arrived')} />
              <Button label={t('volunteerJob.completeButton')} variant="community" disabled={mission.status !== 'arrived' || busy} loading={busy && mission.status === 'arrived'} onPress={() => advance('awaiting_confirmation')} />

              {confirmingRelease ? (
                <Card tone="emergency" elevation="none">
                  <Text style={[typography.bodyMedium, { color: theme.colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{t('volunteerJob.release.confirmTitle')}</Text>
                  <Text style={[typography.small, { color: theme.colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{t('volunteerJob.release.confirmMessage')}</Text>
                  <View style={[styles.reasonRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    {RELEASE_REASONS.map(reason => (
                      <Pressable key={reason} onPress={() => setReleaseReason(current => (current === reason ? null : reason))} style={[styles.reasonChip, { backgroundColor: releaseReason === reason ? theme.colors.emergency : theme.colors.surface, borderColor: releaseReason === reason ? theme.colors.emergency : theme.colors.border }]}>
                        <Text style={[typography.caption, { color: releaseReason === reason ? theme.colors.onEmergency : theme.colors.textPrimary }]}>{t(`volunteerJob.release.reasons.${reason}`)}</Text>
                      </Pressable>
                    ))}
                  </View>
                  <View style={[styles.confirmRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <Button label={t('volunteerJob.release.back')} variant="outline" style={styles.confirmButton} onPress={() => { setConfirmingRelease(false); setReleaseReason(null) }} />
                    <Button label={t('volunteerJob.release.confirm')} variant="danger" style={styles.confirmButton} loading={releasing} onPress={release} />
                  </View>
                </Card>
              ) : (
                <Pressable onPress={() => setConfirmingRelease(true)} style={styles.releaseLink}>
                  <Text style={[typography.small, { color: theme.colors.textMuted, textDecorationLine: 'underline' }]}>{t('volunteerJob.release.button')}</Text>
                </Pressable>
              )}
            </>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  )
}

function CompletedHeader({ title, subtitle }: { title: string; subtitle: string }) {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const { stageStyle } = useStaggeredReveal(2)
  return (
    <>
      <SuccessCheckmark tone="success" />
      <Animated.Text style={[typography.h1, styles.centerText, stageStyle(0), { color: theme.colors.textPrimary }]}>{title}</Animated.Text>
      <Animated.Text style={[typography.small, styles.centerText, stageStyle(1), { color: theme.colors.textSecondary }]}>{subtitle}</Animated.Text>
    </>
  )
}

function HelperCompletion({ stats, onDone }: { stats: { points: number; completedCount: number; leveledUpTo: ActivityLevel | null } | null; onDone: () => void }) {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const { t } = useTranslation()
  const { stageStyle } = useStaggeredReveal(4)
  return (
    <SafeAreaView style={[styles.fill, styles.completionContent, { backgroundColor: theme.colors.background }]}>
      <SuccessCheckmark tone="success" />
      <Animated.Text style={[typography.h1, styles.centerText, stageStyle(0), { color: theme.colors.textPrimary }]}>{t('volunteerJob.completion.title')}</Animated.Text>
      <Animated.Text style={[typography.body, styles.centerText, stageStyle(1), { color: theme.colors.textSecondary }]}>{t('volunteerJob.completion.message')}</Animated.Text>
      {stats ? (
        <>
          <Animated.View style={[styles.statsCard, stageStyle(2), { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={[typography.hero, { color: theme.colors.primary }]}>{t('volunteerJob.completion.pointsEarned', { points: stats.points })}</Text>
            <Text style={[typography.small, { color: theme.colors.textSecondary }]}>{t('points.completedCount', { count: stats.completedCount })}</Text>
          </Animated.View>
          <Animated.View style={[stageStyle(3), styles.completionActions]}>
            {stats.leveledUpTo ? (
              <View style={[styles.levelUpBanner, { flexDirection: isRTL ? 'row-reverse' : 'row', backgroundColor: theme.colors.primarySoft }]}>
                <Star size={18} color={ACTIVITY_LEVEL_COLORS[stats.leveledUpTo]} weight="fill" />
                <Text style={[typography.smallMedium, { color: theme.colors.primary }]}>{t('activityLevel.levelUpMessage', { levelName: t(ACTIVITY_LEVEL_LABEL_KEYS[stats.leveledUpTo]) })}</Text>
              </View>
            ) : null}
            <Button label={t('volunteerJob.completion.backHome')} onPress={onDone} />
          </Animated.View>
        </>
      ) : (
        <ActivityIndicator color={theme.colors.primary} />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  unavailable: { gap: space.md, padding: space.xl },
  centerText: { textAlign: 'center' },

  mapArea: { height: 250 },
  map: { flex: 1, marginTop: 0, borderRadius: 0, borderWidth: 0 },
  backButton: { position: 'absolute', top: space.lg },
  radarWrap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  radarRing: { width: 90, height: 90, borderRadius: 45 },

  capsuleWrap: { marginTop: -56, paddingHorizontal: space.lg, zIndex: 5 },
  capsule: { borderRadius: radius.lg, borderWidth: 1, padding: space.xl, gap: space.xs },
  timelineWrap: { marginTop: space.lg },

  sheet: { flex: 1, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, marginTop: -radius.md, zIndex: 1 },
  sheetContent: { padding: space.xl, paddingTop: space.xxl, gap: space.md },

  elapsedRow: { gap: 2 },
  photo: { width: '100%', height: 160, borderRadius: radius.md },
  confirmRow: { gap: space.sm },
  confirmButton: { flex: 1 },

  reasonRow: { flexWrap: 'wrap', gap: space.sm },
  reasonChip: { borderWidth: 1, borderRadius: radius.pill, paddingVertical: 8, paddingHorizontal: space.md },
  releaseLink: { alignItems: 'center', paddingVertical: space.md },

  completionContent: { alignItems: 'center', justifyContent: 'center', gap: space.md, padding: space.xxl },
  completionActions: { width: '100%', gap: space.md, alignItems: 'stretch' },
  statsCard: { borderWidth: 1, borderRadius: radius.lg, paddingVertical: space.xl, paddingHorizontal: space.xxl, alignItems: 'center', gap: 6, width: '100%' },
  levelUpBanner: { alignSelf: 'center', alignItems: 'center', gap: 8, borderRadius: radius.pill, paddingVertical: 10, paddingHorizontal: space.lg }
})
