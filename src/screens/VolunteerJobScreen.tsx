import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, AppState, Image, Linking, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { translateActionError } from '../lib/rpcErrors'
import { supabase } from '../lib/supabase'
import { colors } from '../lib/theme'
import { dirStyles, useIsRTL } from '../lib/direction'
import type { HelpRequest, Profile, RequestStatus } from '../types'
import { Header } from '../components/Header'
import { PrimaryButton } from '../components/PrimaryButton'
import { Screen } from '../components/Screen'
import { SanadMap } from '../components/SanadMap'

export function VolunteerJobScreen({ request: initialRequest, onBack, onDone }: { request: HelpRequest; onBack: () => void; onDone: () => void }) {
  const { t } = useTranslation()
  const dir = dirStyles(useIsRTL())
  const [request, setRequest] = useState(initialRequest)
  const [requester, setRequester] = useState<Profile | null>(null)
  const [busy, setBusy] = useState(false)

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
  // 'completed' now happens on the requester's side, delivered here via the
  // realtime subscription above, so this is where onDone actually fires.
  useEffect(() => {
    if (request.status === 'completed') onDone()
  }, [request.status, onDone])

  async function setStatus(status: RequestStatus) {
    setBusy(true)
    try {
      const { error } = await supabase.rpc('update_help_request_status', { p_request_id: request.id, p_status: status })
      if (error) Alert.alert(t('common.error'), translateActionError(t, error))
    } finally {
      setBusy(false)
    }
  }

  const finished = request.status === 'completed' || request.status === 'cancelled'
  const awaitingConfirmation = request.status === 'awaiting_confirmation'
  const title = (['accepted', 'on_the_way', 'arrived', 'awaiting_confirmation', 'completed', 'cancelled'] as const).includes(request.status as any)
    ? t(`volunteerJob.status.${request.status}`)
    : t('volunteerJob.title')

  return (
    <Screen contentStyle={styles.content}>
      <Header title={title} onBack={onBack} />
      <View style={[styles.icon, finished && styles.iconFinished]}>
        {awaitingConfirmation ? (
          <ActivityIndicator color={colors.forest} />
        ) : (
          <Text style={styles.iconText}>{request.status === 'completed' ? '✅' : request.status === 'cancelled' ? '🚫' : '🚗'}</Text>
        )}
      </View>
      {awaitingConfirmation ? (
        <Text style={styles.subtitle}>{t('volunteerJob.awaitingConfirmationText')}</Text>
      ) : !finished ? (
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
          {!finished && requester.phone ? (
            <PrimaryButton title={`📞 ${t('volunteerJob.callButton', { phone: requester.phone })}`} tone="green" onPress={() => Linking.openURL(`tel:${requester.phone}`)} />
          ) : null}
        </View>
      ) : null}

      {request.photo_url ? <Image source={{ uri: request.photo_url }} style={styles.photo} /> : null}

      <SanadMap latitude={request.latitude} longitude={request.longitude} />

      {awaitingConfirmation ? null : !finished ? (
        <>
          <PrimaryButton title={t('volunteerJob.openInGoogleMaps')} tone="light" onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${request.latitude},${request.longitude}`)} />
          <PrimaryButton title={t('volunteerJob.onMyWay')} onPress={() => setStatus('on_the_way')} disabled={request.status !== 'accepted' || busy} loading={busy && request.status === 'accepted'} />
          <PrimaryButton title={t('volunteerJob.arrivedButton')} tone="green" onPress={() => setStatus('arrived')} disabled={request.status !== 'on_the_way' || busy} loading={busy && request.status === 'on_the_way'} />
          <PrimaryButton title={t('volunteerJob.completeButton')} tone="green" onPress={() => setStatus('awaiting_confirmation')} disabled={request.status !== 'arrived' || busy} loading={busy && request.status === 'arrived'} />
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
  value: { color: colors.text, fontWeight: '900', fontSize: 17, marginTop: 5 }
})
