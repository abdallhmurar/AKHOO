import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, AppState, Image, Linking, StyleSheet, Text, View } from 'react-native'
import { Star } from 'phosphor-react-native'
import { useTranslation } from 'react-i18next'
import { translateActionError } from '../lib/rpcErrors'
import { supabase } from '../lib/supabase'
import { colors, font, radius, space } from '../lib/theme'
import { dirStyles, useIsRTL } from '../lib/direction'
import { getVolunteerActivityLevel, ACTIVITY_LEVEL_COLORS, ACTIVITY_LEVEL_LABEL_KEYS } from '../lib/activityLevel'
import type { ActivityLevel } from '../lib/activityLevel'
import type { HelpRequest, Profile, RequestStatus } from '../types'
import { Header } from '../components/Header'
import { PrimaryButton } from '../components/PrimaryButton'
import { Screen } from '../components/Screen'
import { SanadMap } from '../components/SanadMap'
import { Tactile } from '../components/Tactile'

const RELEASE_REASONS = ['cannot_reach', 'emergency', 'accepted_by_mistake', 'other'] as const
type ReleaseReason = (typeof RELEASE_REASONS)[number]
const LEVEL_UP_THRESHOLDS = [5, 15, 30, 60]

type CompletionStats = { points: number; completedCount: number; leveledUpTo: ActivityLevel | null }

export function VolunteerJobScreen({ request: initialRequest, onBack, onDone }: { request: HelpRequest; onBack: () => void; onDone: () => void }) {
  const { t } = useTranslation()
  const dir = dirStyles(useIsRTL())
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
    setBusy(true)
    try {
      const { error } = await supabase.rpc('update_help_request_status', { p_request_id: request.id, p_status: status })
      if (error) Alert.alert(t('common.error'), translateActionError(t, error))
    } finally {
      setBusy(false)
    }
  }

  async function release() {
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
  const title = (['accepted', 'on_the_way', 'arrived', 'awaiting_confirmation', 'completed', 'cancelled'] as const).includes(request.status as any)
    ? t(`volunteerJob.status.${request.status}`)
    : t('volunteerJob.title')

  if (request.status === 'completed') {
    return (
      <Screen contentStyle={styles.completionContent}>
        <View style={styles.completionIcon}>
          <Text style={styles.completionIconText}>✅</Text>
        </View>
        <Text style={styles.completionTitle}>{t('volunteerJob.completion.title')}</Text>
        <Text style={styles.completionMessage}>{t('volunteerJob.completion.message')}</Text>

        {completionStats ? (
          <>
            <View style={styles.statsCard}>
              <Text style={styles.statsPoints}>{t('volunteerJob.completion.pointsEarned', { points: completionStats.points })}</Text>
              <Text style={styles.statsCount}>{t('points.completedCount', { count: completionStats.completedCount })}</Text>
            </View>
            {completionStats.leveledUpTo ? (
              <View style={[styles.levelUpBanner, dir.row]}>
                <Star size={18} color={ACTIVITY_LEVEL_COLORS[completionStats.leveledUpTo]} weight="fill" />
                <Text style={styles.levelUpText}>
                  {t('activityLevel.levelUpMessage', { levelName: t(ACTIVITY_LEVEL_LABEL_KEYS[completionStats.leveledUpTo]) })}
                </Text>
              </View>
            ) : null}
            <PrimaryButton title={t('volunteerJob.completion.backHome')} onPress={onDone} />
          </>
        ) : (
          <ActivityIndicator color={colors.forest} style={{ marginTop: space.lg }} />
        )}
      </Screen>
    )
  }

  return (
    <Screen contentStyle={styles.content}>
      <Header title={title} onBack={onBack} />
      <View style={[styles.icon, cancelled && styles.iconFinished]}>
        {awaitingConfirmation ? (
          <ActivityIndicator color={colors.forest} />
        ) : (
          <Text style={styles.iconText}>{cancelled ? '🚫' : '🚗'}</Text>
        )}
      </View>
      {awaitingConfirmation ? (
        <Text style={styles.subtitle}>{t('volunteerJob.awaitingConfirmationText')}</Text>
      ) : !cancelled ? (
        <Text style={styles.subtitle}>{t('volunteerJob.subtitle')}</Text>
      ) : null}

      <View style={styles.card}>
        <Text style={[styles.label, dir.textStart]}>{t('volunteerJob.requestId')}</Text>
        <Text style={[styles.value, dir.textStart]}>{request.id.slice(0, 8).toUpperCase()}</Text>
      </View>

      {requester ? (
        <View style={styles.card}>
          <Text style={[styles.label, dir.textStart]}>{t('volunteerJob.requesterLabel')}</Text>
          <Text style={[styles.value, dir.textStart]}>{requester.full_name || t('volunteerJob.defaultRequesterName')}</Text>
          {!cancelled && requester.phone ? (
            <PrimaryButton title={`📞 ${t('volunteerJob.callButton', { phone: requester.phone })}`} tone="green" onPress={() => Linking.openURL(`tel:${requester.phone}`)} />
          ) : null}
        </View>
      ) : null}

      {request.photo_url ? <Image source={{ uri: request.photo_url }} style={styles.photo} /> : null}

      <SanadMap latitude={request.latitude} longitude={request.longitude} />

      {awaitingConfirmation ? null : !cancelled ? (
        <>
          <PrimaryButton title={t('volunteerJob.openInGoogleMaps')} tone="light" onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${request.latitude},${request.longitude}`)} />
          <PrimaryButton title={t('volunteerJob.onMyWay')} onPress={() => setStatus('on_the_way')} disabled={request.status !== 'accepted' || busy} loading={busy && request.status === 'accepted'} />
          <PrimaryButton title={t('volunteerJob.arrivedButton')} tone="green" onPress={() => setStatus('arrived')} disabled={request.status !== 'on_the_way' || busy} loading={busy && request.status === 'on_the_way'} />
          <PrimaryButton title={t('volunteerJob.completeButton')} tone="green" onPress={() => setStatus('awaiting_confirmation')} disabled={request.status !== 'arrived' || busy} loading={busy && request.status === 'arrived'} />

          {confirmingRelease ? (
            <View style={styles.releaseCard}>
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
            </View>
          ) : (
            <Tactile onPress={() => setConfirmingRelease(true)} style={styles.releaseLink}>
              <Text style={styles.releaseLinkText}>{t('volunteerJob.release.button')}</Text>
            </Tactile>
          )}
        </>
      ) : (
        <PrimaryButton title={t('volunteerJob.back')} onPress={onBack} />
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, gap: 10 },
  icon: { width: 94, height: 94, borderRadius: 30, backgroundColor: colors.greenSoft, alignSelf: 'center', alignItems: 'center', justifyContent: 'center' },
  iconFinished: { backgroundColor: colors.blueSoft },
  iconText: { fontSize: 42 },
  subtitle: { color: colors.muted, textAlign: 'center', lineHeight: 22, marginBottom: 14 },
  card: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 20, padding: 16, marginBottom: 10, gap: 8 },
  photo: { width: '100%', height: 150, borderRadius: 18, marginBottom: 10 },
  label: { color: colors.muted },
  value: { color: colors.text, fontWeight: '900', fontSize: 17, marginTop: 5 },

  releaseLink: { alignItems: 'center', paddingVertical: space.md, marginTop: space.xs },
  releaseLinkText: { color: colors.muted, fontFamily: font.medium, fontSize: 13, textDecorationLine: 'underline' },
  releaseCard: { backgroundColor: colors.dangerSoft, borderRadius: radius.lg, padding: space.lg, marginTop: space.sm, gap: space.md },
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
  completionIcon: { width: 86, height: 86, borderRadius: 43, backgroundColor: colors.successSoft, alignItems: 'center', justifyContent: 'center' },
  completionIconText: { fontSize: 38 },
  completionTitle: { color: colors.text, fontFamily: font.extraBold, fontSize: 22, textAlign: 'center' },
  completionMessage: { color: colors.muted, fontFamily: font.regular, fontSize: 14.5, textAlign: 'center', lineHeight: 22 },
  statsCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, paddingVertical: space.xl, paddingHorizontal: space.xxl, alignItems: 'center', gap: 6, width: '100%' },
  statsPoints: { color: colors.forest, fontFamily: font.extraBold, fontSize: 28 },
  statsCount: { color: colors.muted, fontFamily: font.medium, fontSize: 13.5 },
  levelUpBanner: { alignItems: 'center', gap: 8, backgroundColor: colors.sageSoft, borderRadius: radius.pill, paddingVertical: 10, paddingHorizontal: space.lg },
  levelUpText: { color: colors.forest, fontFamily: font.bold, fontSize: 13.5 }
})
