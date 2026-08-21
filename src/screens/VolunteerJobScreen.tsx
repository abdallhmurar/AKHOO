import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, AppState, Animated, Image, Linking, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native'
import * as Haptics from 'expo-haptics'
import { ArrowLeft, ArrowRight, Star } from 'phosphor-react-native'
import { useTranslation } from 'react-i18next'
import { translateActionError } from '../lib/rpcErrors'
import { supabase } from '../lib/supabase'
import { colors, font, radius, shadow, space, type } from '../lib/theme'
import { dirStyles, useIsRTL } from '../lib/direction'
import { useStaggeredReveal } from '../lib/useStaggeredReveal'
import { getVolunteerActivityLevel, ACTIVITY_LEVEL_COLORS, ACTIVITY_LEVEL_LABEL_KEYS } from '../lib/activityLevel'
import type { ActivityLevel } from '../lib/activityLevel'
import type { HelpRequest, Profile, RequestStatus } from '../types'
import { PrimaryButton } from '../components/PrimaryButton'
import { Screen } from '../components/Screen'
import { Surface } from '../components/Surface'
import { StatusTimeline } from '../components/StatusTimeline'
import { SanadMap } from '../components/SanadMap'
import { SuccessCheckmark } from '../components/SuccessCheckmark'
import { Tactile } from '../components/Tactile'

const RELEASE_REASONS = ['cannot_reach', 'emergency', 'accepted_by_mistake', 'other'] as const
type ReleaseReason = (typeof RELEASE_REASONS)[number]
const LEVEL_UP_THRESHOLDS = [5, 15, 30, 60]
const TIMELINE_STATUSES = ['accepted', 'on_the_way', 'arrived', 'awaiting_confirmation'] as const

type CompletionStats = { points: number; completedCount: number; leveledUpTo: ActivityLevel | null }

export function VolunteerJobScreen({ request: initialRequest, onBack, onDone }: { request: HelpRequest; onBack: () => void; onDone: () => void }) {
  const { t } = useTranslation()
  const isRTL = useIsRTL()
  const dir = dirStyles(isRTL)
  const BackIcon = isRTL ? ArrowRight : ArrowLeft
  const [request, setRequest] = useState(initialRequest)
  const [requester, setRequester] = useState<Profile | null>(null)
  const [busy, setBusy] = useState(false)
  const [confirmingRelease, setConfirmingRelease] = useState(false)
  const [releaseReason, setReleaseReason] = useState<ReleaseReason | null>(null)
  const [releasing, setReleasing] = useState(false)
  const [completionStats, setCompletionStats] = useState<CompletionStats | null>(null)

  useEffect(() => {
    const channel = supabase.channel(`volunteer-job-${request.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'help_requests', filter: `id=eq.${request.id}` }, payload => {
        setRequest(payload.new as HelpRequest)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [request.id])

  // Same reasoning as ActiveRequestScreen: realtime isn't guaranteed to
  // deliver every UPDATE, so re-fetch authoritative status on foreground.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state !== 'active') return
      supabase.from('help_requests').select('*').eq('id', request.id).maybeSingle().then(({ data }) => {
        if (data) setRequest(data as HelpRequest)
      })
    })
    return () => subscription.remove()
  }, [request.id])

  useEffect(() => {
    supabase.from('profiles').select('id,full_name,phone,avatar_url,is_admin,is_banned').eq('id', request.requester_id).single().then(({ data }) => {
      if (data) setRequester(data as Profile)
    })
  }, [request.requester_id])

  // The volunteer's own action only ever reaches 'awaiting_confirmation' -
  // 'completed' happens on the requester's side, delivered here via
  // realtime. Fetch real points/count once so the completion screen never
  // shows placeholder numbers, and only call onDone() once the volunteer
  // dismisses that screen (not the instant the status flips).
  useEffect(() => {
    if (request.status !== 'completed' || completionStats) return
    let cancelled = false
    ;(async () => {
      const [{ data: pointsRow }, { data: countData }] = await Promise.all([
        supabase.from('volunteer_point_transactions').select('points').eq('request_id', request.id).maybeSingle(),
        supabase.rpc('get_volunteer_completed_count', { p_volunteer_id: request.volunteer_id })
      ])
      if (cancelled) return
      const completedCount = (countData as number | null) ?? 0
      const leveledUpTo = LEVEL_UP_THRESHOLDS.includes(completedCount) ? getVolunteerActivityLevel(completedCount) : null
      setCompletionStats({ points: (pointsRow as { points: number } | null)?.points ?? 0, completedCount, leveledUpTo })
    })()
    return () => { cancelled = true }
  }, [request.status, request.id, request.volunteer_id, completionStats])

  async function setStatus(status: RequestStatus) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
    setBusy(true)
    try {
      const { error } = await supabase.rpc('update_help_request_status', { p_request_id: request.id, p_status: status })
      if (error) Alert.alert(t('common.error'), translateActionError(t, error))
    } finally {
      setBusy(false)
    }
  }

  async function release() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {})
    setReleasing(true)
    try {
      const { error } = await supabase.rpc('release_help_request', { p_request_id: request.id, p_reason: releaseReason })
      if (error) {
        Alert.alert(t('common.error'), translateActionError(t, error))
        return
      }
      onDone()
    } finally {
      setReleasing(false)
    }
  }

  const cancelled = request.status === 'cancelled'
  const awaitingConfirmation = request.status === 'awaiting_confirmation'
  const timelineIndex = TIMELINE_STATUSES.indexOf(request.status as any)
  const showTimeline = timelineIndex !== -1
  const title = (['accepted', 'on_the_way', 'arrived', 'awaiting_confirmation', 'completed', 'cancelled'] as const).includes(request.status as any)
    ? t(`volunteerJob.status.${request.status}`)
    : t('volunteerJob.title')

  if (request.status === 'completed') {
    return <CompletionCelebration stats={completionStats} onDone={onDone} />
  }

  if (cancelled) {
    return (
      <Screen contentStyle={styles.completionContent}>
        <SuccessCheckmark tone="danger" />
        <Text style={styles.completionTitle}>{title}</Text>
        <PrimaryButton title={t('volunteerJob.back')} onPress={onBack} />
      </Screen>
    )
  }

  return (
    <SafeAreaView style={styles.fill}>
      <View style={styles.mapArea}>
        <SanadMap latitude={request.latitude} longitude={request.longitude} style={styles.map} />
        <Tactile onPress={onBack} style={[styles.backButton, { [isRTL ? 'right' : 'left']: space.lg }]} scaleTo={0.92}>
          <BackIcon size={18} color={colors.text} />
        </Tactile>
      </View>

      <View style={styles.sheet}>
        <ScrollView contentContainerStyle={styles.sheetContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>{title}</Text>
          {awaitingConfirmation ? (
            <Text style={styles.subtitle}>{t('volunteerJob.awaitingConfirmationText')}</Text>
          ) : (
            <Text style={styles.subtitle}>{t('volunteerJob.subtitle')}</Text>
          )}

          {showTimeline ? (
            <View style={styles.timelineWrap}>
              <StatusTimeline
                steps={TIMELINE_STATUSES.map(key => ({ key, label: t(`common.timeline.${key}`) }))}
                currentIndex={timelineIndex}
              />
            </View>
          ) : null}

          {requester ? (
            <Surface elevation="soft" padding="lg" style={styles.card}>
              <Text style={[styles.label, dir.textStart]}>{t('volunteerJob.requesterLabel')}</Text>
              <Text style={[styles.value, dir.textStart]}>{requester.full_name || t('volunteerJob.defaultRequesterName')}</Text>
              {requester.phone ? (
                <PrimaryButton title={`📞 ${t('volunteerJob.callButton', { phone: requester.phone })}`} tone="green" onPress={() => Linking.openURL(`tel:${requester.phone}`)} />
              ) : null}
            </Surface>
          ) : null}

          <Surface elevation="soft" padding="lg" style={styles.card}>
            <Text style={[styles.label, dir.textStart]}>{t('volunteerJob.requestId')}</Text>
            <Text style={[styles.value, dir.textStart]}>{request.id.slice(0, 8).toUpperCase()}</Text>
          </Surface>

          {request.photo_url ? <Image source={{ uri: request.photo_url }} style={styles.photo} /> : null}

          {awaitingConfirmation ? null : (
            <>
              <PrimaryButton title={t('volunteerJob.openInGoogleMaps')} tone="light" onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${request.latitude},${request.longitude}`)} />
              <PrimaryButton title={t('volunteerJob.onMyWay')} onPress={() => setStatus('on_the_way')} disabled={request.status !== 'accepted' || busy} loading={busy && request.status === 'accepted'} />
              <PrimaryButton title={t('volunteerJob.arrivedButton')} tone="green" onPress={() => setStatus('arrived')} disabled={request.status !== 'on_the_way' || busy} loading={busy && request.status === 'on_the_way'} />
              <PrimaryButton title={t('volunteerJob.completeButton')} tone="green" onPress={() => setStatus('awaiting_confirmation')} disabled={request.status !== 'arrived' || busy} loading={busy && request.status === 'arrived'} />

              {confirmingRelease ? (
                <Surface tone="surface" elevation="none" padding="lg" style={styles.releaseCard}>
                  <Text style={[styles.releaseConfirmTitle, dir.textStart]}>{t('volunteerJob.release.confirmTitle')}</Text>
                  <Text style={[styles.releaseConfirmMessage, dir.textStart]}>{t('volunteerJob.release.confirmMessage')}</Text>
                  <View style={[styles.reasonRow, dir.row]}>
                    {RELEASE_REASONS.map(reason => (
                      <Tactile key={reason} onPress={() => setReleaseReason(current => (current === reason ? null : reason))} style={[styles.reasonChip, releaseReason === reason && styles.reasonChipActive]}>
                        <Text style={[styles.reasonChipText, releaseReason === reason && styles.reasonChipTextActive]}>{t(`volunteerJob.release.reasons.${reason}`)}</Text>
                      </Tactile>
                    ))}
                  </View>
                  <View style={[styles.releaseActions, dir.row]}>
                    <PrimaryButton title={t('volunteerJob.release.back')} tone="light" onPress={() => { setConfirmingRelease(false); setReleaseReason(null) }} style={styles.releaseButton} />
                    <PrimaryButton title={t('volunteerJob.release.confirm')} tone="red" onPress={release} loading={releasing} style={styles.releaseButton} />
                  </View>
                </Surface>
              ) : (
                <Tactile onPress={() => setConfirmingRelease(true)} style={styles.releaseLink}>
                  <Text style={styles.releaseLinkText}>{t('volunteerJob.release.button')}</Text>
                </Tactile>
              )}
            </>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  )
}

// A dedicated component (not inline JSX in VolunteerJobScreen) so its
// staggered reveal actually mounts fresh the moment the mission completes.
// useStaggeredReveal's animation starts on mount - if it lived inline in
// VolunteerJobScreen's own render tree, it would have started (and long
// since finished) back when the screen first opened in 'accepted' state,
// so by the time 'completed' is actually reached minutes later everything
// would just appear instantly with no visible stagger at all.
function CompletionCelebration({ stats, onDone }: { stats: CompletionStats | null; onDone: () => void }) {
  const { t } = useTranslation()
  const dir = dirStyles(useIsRTL())
  const { stageStyle } = useStaggeredReveal(4)

  return (
    <Screen contentStyle={styles.completionContent}>
      <SuccessCheckmark tone="success" />
      <Animated.Text style={[styles.completionTitle, stageStyle(0)]}>{t('volunteerJob.completion.title')}</Animated.Text>
      <Animated.Text style={[styles.completionMessage, stageStyle(1)]}>{t('volunteerJob.completion.message')}</Animated.Text>

      {stats ? (
        <>
          <Animated.View style={[styles.statsCard, stageStyle(2)]}>
            <Text style={styles.statsPoints}>{t('volunteerJob.completion.pointsEarned', { points: stats.points })}</Text>
            <Text style={styles.statsCount}>{t('points.completedCount', { count: stats.completedCount })}</Text>
          </Animated.View>
          <Animated.View style={stageStyle(3)}>
            {stats.leveledUpTo ? (
              <View style={[styles.levelUpBanner, dir.row]}>
                <Star size={18} color={ACTIVITY_LEVEL_COLORS[stats.leveledUpTo]} weight="fill" />
                <Text style={styles.levelUpText}>
                  {t('activityLevel.levelUpMessage', { levelName: t(ACTIVITY_LEVEL_LABEL_KEYS[stats.leveledUpTo]) })}
                </Text>
              </View>
            ) : null}
            <PrimaryButton title={t('volunteerJob.completion.backHome')} onPress={onDone} />
          </Animated.View>
        </>
      ) : (
        <ActivityIndicator color={colors.forest} style={{ marginTop: space.lg }} />
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
  mapArea: { height: 300 },
  map: { flex: 1, marginTop: 0, borderRadius: 0, borderWidth: 0 },
  backButton: { position: 'absolute', top: space.lg, width: 42, height: 42, borderRadius: radius.pill, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...shadow.floating },

  sheet: { flex: 1, backgroundColor: colors.surface, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, marginTop: -radius.sheet, ...shadow.elevated },
  sheetContent: { padding: space.xl, paddingTop: space.xxl, gap: 10 },

  title: { ...type.h1, color: colors.text, textAlign: 'center' },
  subtitle: { color: colors.muted, textAlign: 'center', lineHeight: 22, fontFamily: font.regular, fontSize: 14, marginBottom: 4 },
  timelineWrap: { marginTop: space.sm, marginBottom: space.xs },

  card: { gap: 8 },
  photo: { width: '100%', height: 150, borderRadius: radius.md },
  label: { color: colors.muted },
  value: { color: colors.text, fontWeight: '900', fontSize: 17, marginTop: 5 },

  releaseLink: { alignItems: 'center', paddingVertical: space.md, marginTop: space.xs },
  releaseLinkText: { color: colors.muted, fontFamily: font.medium, fontSize: 13, textDecorationLine: 'underline' },
  releaseCard: { backgroundColor: colors.dangerSoft, borderRadius: radius.lg, marginTop: space.sm, gap: space.md },
  releaseConfirmTitle: { color: colors.text, fontFamily: font.extraBold, fontSize: 16 },
  releaseConfirmMessage: { color: colors.muted, fontFamily: font.regular, fontSize: 13.5, lineHeight: 20 },
  reasonRow: { flexWrap: 'wrap', gap: space.sm },
  reasonChip: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingVertical: 8, paddingHorizontal: space.md },
  reasonChipActive: { backgroundColor: colors.forest, borderColor: colors.forest },
  reasonChipText: { color: colors.text, fontFamily: font.medium, fontSize: 12.5 },
  reasonChipTextActive: { color: '#fff' },
  releaseActions: { gap: space.sm },
  releaseButton: { flex: 1 },

  completionContent: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', gap: space.md, padding: space.xxl },
  completionTitle: { color: colors.text, fontFamily: font.extraBold, fontSize: 22, textAlign: 'center' },
  completionMessage: { color: colors.muted, fontFamily: font.regular, fontSize: 14.5, textAlign: 'center', lineHeight: 22 },
  statsCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, paddingVertical: space.xl, paddingHorizontal: space.xxl, alignItems: 'center', gap: 6, width: '100%' },
  statsPoints: { color: colors.forest, fontFamily: font.extraBold, fontSize: 28 },
  statsCount: { color: colors.muted, fontFamily: font.medium, fontSize: 13.5 },
  levelUpBanner: { alignItems: 'center', gap: 8, backgroundColor: colors.sageSoft, borderRadius: radius.pill, paddingVertical: 10, paddingHorizontal: space.lg },
  levelUpText: { color: colors.forest, fontFamily: font.bold, fontSize: 13.5 }
})
