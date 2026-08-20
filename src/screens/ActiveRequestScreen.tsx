import { useEffect, useRef, useState } from 'react'
import { Alert, Animated, Easing, Image, Linking, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { colors, font, radius, space } from '../lib/theme'
import { formatElapsed } from '../lib/time'
import { dirStyles, useIsRTL } from '../lib/direction'
import type { HelpRequest, Profile } from '../types'
import { Header } from '../components/Header'
import { PrimaryButton } from '../components/PrimaryButton'
import { Screen } from '../components/Screen'
import { SanadMap } from '../components/SanadMap'

export function ActiveRequestScreen({ initialRequest, onBack, onDone }: { initialRequest: HelpRequest; onBack: () => void; onDone: () => void }) {
  const { t } = useTranslation()
  const dir = dirStyles(useIsRTL())
  const [request, setRequest] = useState(initialRequest)
  const [volunteer, setVolunteer] = useState<Profile | null>(null)
  const [busy, setBusy] = useState(false)
  const [confirmingCancel, setConfirmingCancel] = useState(false)
  const [respondingToCompletion, setRespondingToCompletion] = useState(false)
  const [now, setNow] = useState(Date.now())
  const pulseAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    const channel = supabase.channel(`request-${request.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'help_requests', filter: `id=eq.${request.id}` }, payload => {
        setRequest(payload.new as HelpRequest)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [request.id])

  useEffect(() => {
    if (!request.volunteer_id) {
      setVolunteer(null)
      return
    }
    supabase.from('profiles').select('id,full_name,phone,avatar_url,is_admin,is_banned').eq('id', request.volunteer_id).single().then(({ data }) => {
      if (data) setVolunteer(data as Profile)
    })
  }, [request.volunteer_id])

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (request.status !== 'open') {
      pulseAnim.setValue(1)
      return
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
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
    setBusy(true)
    const { error } = await supabase.rpc('cancel_help_request', { p_request_id: request.id })
    setBusy(false)
    setConfirmingCancel(false)
    if (error) Alert.alert(t('common.error'), error.message)
  }

  async function respondToCompletion(confirmed: boolean) {
    setRespondingToCompletion(true)
    const { error } = await supabase.rpc('confirm_help_request_completion', { p_request_id: request.id, p_confirmed: confirmed })
    setRespondingToCompletion(false)
    if (error) Alert.alert(t('common.error'), error.message)
  }

  const finished = request.status === 'completed' || request.status === 'cancelled'
  const awaitingConfirmation = request.status === 'awaiting_confirmation'
  const elapsedSince = request.status === 'open' ? request.created_at : request.accepted_at ?? request.created_at
  const elapsedLabel = request.status === 'open' ? t('activeRequest.waitingSince') : t('activeRequest.volunteerSince')
  const subtitle = request.status === 'open'
    ? t('activeRequest.subtitleSearching')
    : request.status === 'completed'
      ? t('activeRequest.subtitleCompleted')
      : awaitingConfirmation
        ? t('activeRequest.subtitleAwaitingConfirmation')
        : t('activeRequest.subtitleTracking')

  return (
    <Screen contentStyle={styles.content}>
      <Header title={t('activeRequest.title')} onBack={onBack} />
      <Animated.View style={[styles.pulse, request.status === 'open' ? styles.searching : styles.found, { transform: [{ scale: pulseAnim }] }]}>
        <Text style={styles.pulseIcon}>{request.status === 'open' ? '📡' : request.status === 'completed' ? '✅' : awaitingConfirmation ? '🙋' : '🤝'}</Text>
      </Animated.View>
      <Text style={styles.title}>{t(`activeRequest.status.${request.status}`)}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      {awaitingConfirmation ? (
        <View style={styles.confirmCard}>
          <Text style={styles.confirmTitle}>{t('activeRequest.confirmPrompt')}</Text>
          <View style={[styles.confirmRow, dir.row]}>
            <PrimaryButton title={t('activeRequest.confirmReject')} tone="light" onPress={() => respondToCompletion(false)} loading={respondingToCompletion} style={styles.confirmButton} />
            <PrimaryButton title={t('activeRequest.confirmAccept')} tone="green" onPress={() => respondToCompletion(true)} loading={respondingToCompletion} style={styles.confirmButton} />
          </View>
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={[styles.label, dir.textStart]}>{t('activeRequest.requestId')}</Text><Text style={[styles.value, dir.textStart]}>{request.id.slice(0, 8).toUpperCase()}</Text>
        {!finished ? (
          <>
            <View style={styles.line} />
            <Text style={[styles.label, dir.textStart]}>{elapsedLabel}</Text><Text style={[styles.value, dir.textStart]}>{formatElapsed(now - new Date(elapsedSince).getTime(), t)}</Text>
          </>
        ) : null}
      </View>

      {volunteer ? (
        <View style={styles.card}>
          <Text style={[styles.label, dir.textStart]}>{t('activeRequest.volunteerLabel')}</Text>
          <Text style={[styles.value, dir.textStart]}>{volunteer.full_name || t('activeRequest.defaultVolunteerName')}</Text>
          {volunteer.phone ? (
            <PrimaryButton title={`📞 ${t('activeRequest.callButton', { phone: volunteer.phone })}`} tone="green" onPress={() => Linking.openURL(`tel:${volunteer.phone}`)} />
          ) : null}
        </View>
      ) : null}

      {request.photo_url ? <Image source={{ uri: request.photo_url }} style={styles.photo} /> : null}

      <SanadMap latitude={request.latitude} longitude={request.longitude} />

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
    </Screen>
  )
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'center' },
  pulse: { width: 100, height: 100, borderRadius: 50, alignSelf: 'center', alignItems: 'center', justifyContent: 'center' },
  searching: { backgroundColor: colors.blueSoft },
  found: { backgroundColor: colors.greenSoft },
  pulseIcon: { fontSize: 42 },
  title: { color: colors.text, fontSize: 27, fontWeight: '900', textAlign: 'center', marginTop: 20 },
  subtitle: { color: colors.muted, textAlign: 'center', lineHeight: 22, marginTop: 8, marginBottom: 24 },
  confirmCard: { backgroundColor: colors.sageSoft, borderRadius: radius.lg, padding: space.lg, marginBottom: 16, gap: space.md },
  confirmTitle: { color: colors.forest, fontFamily: font.extraBold, fontSize: 16, textAlign: 'center' },
  card: { backgroundColor: colors.card, borderRadius: 22, borderWidth: 1, borderColor: colors.border, padding: 18, marginBottom: 16, gap: 10 },
  photo: { width: '100%', height: 160, borderRadius: 18, marginBottom: 16 },
  label: { color: colors.muted, fontSize: 13 },
  value: { color: colors.text, fontSize: 17, fontWeight: '900', marginTop: 4 },
  line: { height: 1, backgroundColor: colors.border, marginVertical: 14 },
  confirmRow: { gap: 10 },
  confirmButton: { flex: 1 }
})
