import { useEffect, useRef, useState } from 'react'
import { Alert, Animated, AppState, Easing, Image, Linking, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native'
import * as Haptics from 'expo-haptics'
import { ArrowLeft, ArrowRight } from 'phosphor-react-native'
import { useTranslation } from 'react-i18next'
import { translateActionError } from '../lib/rpcErrors'
import { supabase } from '../lib/supabase'
import { colors, font, radius, shadow, space, type } from '../lib/theme'
import { formatElapsed } from '../lib/time'
import { dirStyles, useIsRTL } from '../lib/direction'
import { useStaggeredReveal } from '../lib/useStaggeredReveal'
import type { HelpRequest, Profile } from '../types'
import { PrimaryButton } from '../components/PrimaryButton'
import { Surface } from '../components/Surface'
import { StatusTimeline } from '../components/StatusTimeline'
import { SanadMap } from '../components/SanadMap'
import { SuccessCheckmark } from '../components/SuccessCheckmark'
import { Tactile } from '../components/Tactile'
import { VolunteerActivityBadge } from '../components/VolunteerActivityBadge'

const TIMELINE_STATUSES = ['accepted', 'on_the_way', 'arrived', 'awaiting_confirmation', 'completed'] as const

export function ActiveRequestScreen({ initialRequest, onBack, onDone }: { initialRequest: HelpRequest; onBack: () => void; onDone: () => void }) {
  const { t } = useTranslation()
  const isRTL = useIsRTL()
  const dir = dirStyles(isRTL)
  const BackIcon = isRTL ? ArrowRight : ArrowLeft
  const [request, setRequest] = useState(initialRequest)
  const [volunteer, setVolunteer] = useState<Profile | null>(null)
  const [volunteerCompletedCount, setVolunteerCompletedCount] = useState(0)
  const [justReleased, setJustReleased] = useState(false)
  const [busy, setBusy] = useState(false)
  const [confirmingCancel, setConfirmingCancel] = useState(false)
  const [respondingToCompletion, setRespondingToCompletion] = useState(false)
  const [now, setNow] = useState(Date.now())
  const pulseAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const channel = supabase.channel(`request-${request.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'help_requests', filter: `id=eq.${request.id}` }, payload => {
        const next = payload.new as HelpRequest
        setRequest(prev => {
          // A volunteer released this mission if it had one and just
          // reverted to 'open' with no assignment - distinct from a
          // brand-new request, which starts 'open' from its very first
          // fetch and never makes this transition.
          if (prev.volunteer_id && !next.volunteer_id && next.status === 'open' && prev.status !== 'open') {
            setJustReleased(true)
          }
          return next
        })
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [request.id])

  // Realtime UPDATE events aren't guaranteed to arrive (missed during a
  // network drop, or filtered out by RLS re-evaluating against the new row)
  // - re-fetch this specific request's authoritative status whenever the app
  // returns to the foreground so a finished mission can never look "stuck".
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
    if (!request.volunteer_id) {
      setVolunteer(null)
      setVolunteerCompletedCount(0)
      return
    }
    setJustReleased(false)
    supabase.from('profiles').select('id,full_name,phone,avatar_url,is_admin,is_banned').eq('id', request.volunteer_id).single().then(({ data }) => {
      if (data) setVolunteer(data as Profile)
    })
    supabase.rpc('get_volunteer_completed_count', { p_volunteer_id: request.volunteer_id }).then(({ data }) => {
      setVolunteerCompletedCount((data as number | null) ?? 0)
    })
  }, [request.volunteer_id])

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(interval)
  }, [])

  // Radar-style pulse drawn over the map's own center while searching -
  // more spatially meaningful than a generic pulsing icon in a text sheet
  // (design brief section 18).
  useEffect(() => {
    if (request.status !== 'open') {
      pulseAnim.setValue(0)
      return
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1600, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 0, useNativeDriver: true })
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [request.status, pulseAnim])

  async function cancel() {
    if (request.status !== 'open') return
    if (!confirmingCancel) {
      setConfirmingCancel(true)
      return
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {})
    setBusy(true)
    const { error } = await supabase.rpc('cancel_help_request', { p_request_id: request.id })
    setBusy(false)
    setConfirmingCancel(false)
    if (error) Alert.alert(t('common.error'), translateActionError(t, error))
  }

  async function respondToCompletion(confirmed: boolean) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {})
    setRespondingToCompletion(true)
    const { error } = await supabase.rpc('confirm_help_request_completion', { p_request_id: request.id, p_confirmed: confirmed })
    setRespondingToCompletion(false)
    if (error) Alert.alert(t('common.error'), translateActionError(t, error))
  }

  const finished = request.status === 'completed' || request.status === 'cancelled'
  const awaitingConfirmation = request.status === 'awaiting_confirmation'
  const searching = request.status === 'open'
  const timelineIndex = request.status === 'completed' ? TIMELINE_STATUSES.length : TIMELINE_STATUSES.indexOf(request.status as any)
  const showTimeline = timelineIndex !== -1
  const elapsedSince = searching ? request.created_at : request.accepted_at ?? request.created_at
  const elapsedLabel = searching ? t('activeRequest.waitingSince') : t('activeRequest.volunteerSince')
  const subtitle = searching
    ? t('activeRequest.subtitleSearching')
    : request.status === 'completed'
      ? t('activeRequest.subtitleCompleted')
      : awaitingConfirmation
        ? t('activeRequest.subtitleAwaitingConfirmation')
        : t('activeRequest.subtitleTracking')

  const ringScale = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.6] })
  const ringOpacity = pulseAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.5, 0.15, 0] })

  return (
    <SafeAreaView style={styles.fill}>
      <View style={styles.mapArea}>
        <SanadMap latitude={request.latitude} longitude={request.longitude} style={styles.map} />
        {searching ? (
          <View pointerEvents="none" style={styles.radarWrap}>
            <Animated.View style={[styles.radarRing, { opacity: ringOpacity, transform: [{ scale: ringScale }] }]} />
          </View>
        ) : null}
        <Tactile onPress={onBack} style={[styles.backButton, { [isRTL ? 'right' : 'left']: space.lg }]} scaleTo={0.92}>
          <BackIcon size={18} color={colors.text} />
        </Tactile>
      </View>

      <View style={styles.sheet}>
        <ScrollView contentContainerStyle={styles.sheetContent} showsVerticalScrollIndicator={false}>
          {request.status === 'completed' ? (
            <CompletedHeader title={t(`activeRequest.status.${request.status}`)} subtitle={subtitle} />
          ) : (
            <>
              <Text style={styles.title}>{t(`activeRequest.status.${request.status}`)}</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
            </>
          )}

          {showTimeline ? (
            <View style={styles.timelineWrap}>
              <StatusTimeline
                steps={TIMELINE_STATUSES.map(key => ({ key, label: t(`common.timeline.${key}`) }))}
                currentIndex={timelineIndex}
              />
            </View>
          ) : null}

          {justReleased && request.status === 'open' ? (
            <Surface tone="muted" elevation="none" padding="lg" style={styles.releasedNotice}>
              <Text style={styles.releasedNoticeTitle}>{t('activeRequest.releasedNotice.title')}</Text>
              <Text style={styles.releasedNoticeMessage}>{t('activeRequest.releasedNotice.message')}</Text>
            </Surface>
          ) : null}

          {awaitingConfirmation ? (
            <Surface tone="accent" elevation="none" padding="lg" style={styles.confirmCard}>
              <Text style={styles.confirmTitle}>{t('activeRequest.confirmPrompt')}</Text>
              <View style={[styles.confirmRow, dir.row]}>
                <PrimaryButton title={t('activeRequest.confirmReject')} tone="light" onPress={() => respondToCompletion(false)} loading={respondingToCompletion} style={styles.confirmButton} />
                <PrimaryButton title={t('activeRequest.confirmAccept')} tone="green" onPress={() => respondToCompletion(true)} loading={respondingToCompletion} style={styles.confirmButton} />
              </View>
            </Surface>
          ) : null}

          {volunteer ? (
            <Surface elevation="soft" padding="lg" style={styles.card}>
              <Text style={[styles.label, dir.textStart]}>{t('activeRequest.volunteerLabel')}</Text>
              <View style={[styles.volunteerNameRow, dir.row]}>
                <Text style={[styles.value, dir.textStart]}>{volunteer.full_name || t('activeRequest.defaultVolunteerName')}</Text>
                <VolunteerActivityBadge completedCount={volunteerCompletedCount} />
              </View>
              <Text style={[styles.volunteerCompletedCount, dir.textStart]}>{t('points.completedCount', { count: volunteerCompletedCount })}</Text>
              {volunteer.phone ? (
                <PrimaryButton title={`📞 ${t('activeRequest.callButton', { phone: volunteer.phone })}`} tone="green" onPress={() => Linking.openURL(`tel:${volunteer.phone}`)} />
              ) : null}
            </Surface>
          ) : null}

          <Surface elevation="soft" padding="lg" style={styles.card}>
            <Text style={[styles.label, dir.textStart]}>{t('activeRequest.requestId')}</Text>
            <Text style={[styles.value, dir.textStart]}>{request.id.slice(0, 8).toUpperCase()}</Text>
            {!finished ? (
              <>
                <View style={styles.line} />
                <Text style={[styles.label, dir.textStart]}>{elapsedLabel}</Text>
                <Text style={[styles.value, dir.textStart]}>{formatElapsed(now - new Date(elapsedSince).getTime(), t)}</Text>
              </>
            ) : null}
          </Surface>

          {request.photo_url ? <Image source={{ uri: request.photo_url }} style={styles.photo} /> : null}

          {finished ? <PrimaryButton title={t('activeRequest.backToHome')} onPress={onDone} /> : null}

          {request.status === 'open' ? (
            confirmingCancel ? (
              <View style={[styles.confirmRow, dir.row]}>
                <PrimaryButton title={t('activeRequest.cancelBack')} tone="light" onPress={() => setConfirmingCancel(false)} style={styles.confirmButton} />
                <PrimaryButton title={t('activeRequest.cancelConfirm')} tone="red" onPress={cancel} loading={busy} style={styles.confirmButton} />
              </View>
            ) : (
              <PrimaryButton title={t('activeRequest.cancel')} tone="light" onPress={cancel} />
            )
          ) : null}
        </ScrollView>
      </View>
    </SafeAreaView>
  )
}

// Its own component (not inline JSX above) so the staggered reveal mounts
// fresh exactly when the request finishes - see the identical note on
// VolunteerJobScreen's CompletionCelebration for why that matters.
function CompletedHeader({ title, subtitle }: { title: string; subtitle: string }) {
  const { stageStyle } = useStaggeredReveal(2)
  return (
    <>
      <SuccessCheckmark tone="success" />
      <Animated.Text style={[styles.title, stageStyle(0)]}>{title}</Animated.Text>
      <Animated.Text style={[styles.subtitle, stageStyle(1)]}>{subtitle}</Animated.Text>
    </>
  )
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
  mapArea: { height: 300 },
  map: { flex: 1, marginTop: 0, borderRadius: 0, borderWidth: 0 },
  backButton: { position: 'absolute', top: space.lg, width: 42, height: 42, borderRadius: radius.pill, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...shadow.floating },
  radarWrap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  radarRing: { width: 90, height: 90, borderRadius: 45, backgroundColor: colors.forest },

  sheet: { flex: 1, backgroundColor: colors.surface, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, marginTop: -radius.sheet, ...shadow.elevated },
  sheetContent: { padding: space.xl, paddingTop: space.xxl, gap: space.md },

  title: { ...type.h1, color: colors.text, textAlign: 'center' },
  subtitle: { color: colors.muted, textAlign: 'center', lineHeight: 22, fontFamily: font.regular, fontSize: 14 },
  timelineWrap: { marginTop: space.sm, marginBottom: space.xs },

  confirmCard: { gap: space.md },
  confirmTitle: { color: colors.forest, fontFamily: font.extraBold, fontSize: 16, textAlign: 'center' },
  releasedNotice: { gap: 4 },
  releasedNoticeTitle: { color: colors.text, fontFamily: font.bold, fontSize: 14, textAlign: 'center' },
  releasedNoticeMessage: { color: colors.muted, fontFamily: font.regular, fontSize: 12.5, textAlign: 'center' },
  card: { gap: 10 },
  photo: { width: '100%', height: 160, borderRadius: radius.md },
  label: { color: colors.muted, fontSize: 13 },
  value: { color: colors.text, fontSize: 17, fontWeight: '900', marginTop: 4 },
  volunteerNameRow: { alignItems: 'center', gap: 6, marginTop: 4 },
  volunteerCompletedCount: { color: colors.muted, fontSize: 12.5, marginTop: -4 },
  line: { height: 1, backgroundColor: colors.border, marginVertical: 4 },
  confirmRow: { gap: 10 },
  confirmButton: { flex: 1 }
})
