import { useEffect, useRef, useState } from 'react'
import { Alert, Animated, Easing, Image, Linking, StyleSheet, Text, View } from 'react-native'
import { supabase } from '../lib/supabase'
import { colors } from '../lib/theme'
import type { HelpRequest, Profile } from '../types'
import { Header } from '../components/Header'
import { PrimaryButton } from '../components/PrimaryButton'
import { Screen } from '../components/Screen'
import { MapPreview } from '../components/MapPreview'

const labels: Record<string, string> = {
  open: 'نبحث عن متطوع',
  accepted: 'متطوع استلم الطلب',
  on_the_way: 'المتطوع في الطريق',
  arrived: 'المتطوع وصل',
  completed: 'تمت المساعدة',
  cancelled: 'تم إلغاء الطلب'
}

function formatElapsed(ms: number) {
  const minutes = Math.max(0, Math.floor(ms / 60000))
  if (minutes < 1) return 'أقل من دقيقة'
  if (minutes < 60) return `${minutes} دقيقة`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest === 0 ? `${hours} ساعة` : `${hours} ساعة و${rest} دقيقة`
}

export function ActiveRequestScreen({ initialRequest, onBack, onDone }: { initialRequest: HelpRequest; onBack: () => void; onDone: () => void }) {
  const [request, setRequest] = useState(initialRequest)
  const [volunteer, setVolunteer] = useState<Profile | null>(null)
  const [busy, setBusy] = useState(false)
  const [confirmingCancel, setConfirmingCancel] = useState(false)
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
    if (error) Alert.alert('خطأ', error.message)
  }

  const finished = request.status === 'completed' || request.status === 'cancelled'
  const elapsedSince = request.status === 'open' ? request.created_at : request.accepted_at ?? request.created_at
  const elapsedLabel = request.status === 'open' ? 'بتنتظر منذ' : 'المتطوع معك منذ'

  return (
    <Screen contentStyle={styles.content}>
      <Header title="طلب المساعدة" onBack={onBack} />
      <Animated.View style={[styles.pulse, request.status === 'open' ? styles.searching : styles.found, { transform: [{ scale: pulseAnim }] }]}>
        <Text style={styles.pulseIcon}>{request.status === 'open' ? '📡' : request.status === 'completed' ? '✅' : '🤝'}</Text>
      </Animated.View>
      <Text style={styles.title}>{labels[request.status]}</Text>
      <Text style={styles.subtitle}>{request.status === 'open' ? 'أي متطوع متاح وقريب يقدر يشوف طلبك ويستلمه.' : request.status === 'completed' ? 'شكراً لاستخدام سَنَد ❤️' : 'حالة الطلب تتحدث مباشرة بينك وبين المتطوع.'}</Text>

      <View style={styles.card}>
        <Text style={styles.label}>رقم الطلب</Text><Text style={styles.value}>{request.id.slice(0, 8).toUpperCase()}</Text>
        {!finished ? (
          <>
            <View style={styles.line} />
            <Text style={styles.label}>{elapsedLabel}</Text><Text style={styles.value}>{formatElapsed(now - new Date(elapsedSince).getTime())}</Text>
          </>
        ) : null}
      </View>

      {volunteer ? (
        <View style={styles.card}>
          <Text style={styles.label}>المتطوع</Text>
          <Text style={styles.value}>{volunteer.full_name || 'متطوع'}</Text>
          {volunteer.phone ? (
            <PrimaryButton title={`📞 اتصل بـ ${volunteer.phone}`} tone="green" onPress={() => Linking.openURL(`tel:${volunteer.phone}`)} />
          ) : null}
        </View>
      ) : null}

      {request.photo_url ? <Image source={{ uri: request.photo_url }} style={styles.photo} /> : null}

      <MapPreview latitude={request.latitude} longitude={request.longitude} />

      {finished ? <PrimaryButton title="العودة لاختيار الدور" onPress={onDone} /> : null}

      {request.status === 'open' ? (
        confirmingCancel ? (
          <View style={styles.confirmRow}>
            <PrimaryButton title="تراجع" tone="light" onPress={() => setConfirmingCancel(false)} style={styles.confirmButton} />
            <PrimaryButton title="نعم، ألغي الطلب" tone="red" onPress={cancel} loading={busy} style={styles.confirmButton} />
          </View>
        ) : (
          <PrimaryButton title="إلغاء الطلب" tone="light" onPress={cancel} />
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
  card: { backgroundColor: colors.card, borderRadius: 22, borderWidth: 1, borderColor: colors.border, padding: 18, marginBottom: 16, gap: 10 },
  photo: { width: '100%', height: 160, borderRadius: 18, marginBottom: 16 },
  label: { color: colors.muted, textAlign: 'right', fontSize: 13 },
  value: { color: colors.text, textAlign: 'right', fontSize: 17, fontWeight: '900', marginTop: 4 },
  line: { height: 1, backgroundColor: colors.border, marginVertical: 14 },
  confirmRow: { flexDirection: 'row-reverse', gap: 10 },
  confirmButton: { flex: 1 }
})
