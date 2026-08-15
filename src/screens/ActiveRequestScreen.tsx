import { useEffect, useState } from 'react'
import { Alert, StyleSheet, Text, View } from 'react-native'
import { supabase } from '../lib/supabase'
import { colors } from '../lib/theme'
import type { HelpRequest } from '../types'
import { PrimaryButton } from '../components/PrimaryButton'
import { Screen } from '../components/Screen'

const labels: Record<string, string> = {
  open: 'نبحث عن متطوع',
  accepted: 'متطوع استلم الطلب',
  on_the_way: 'المتطوع في الطريق',
  arrived: 'المتطوع وصل',
  completed: 'تمت المساعدة',
  cancelled: 'تم إلغاء الطلب'
}

export function ActiveRequestScreen({ initialRequest, onDone }: { initialRequest: HelpRequest; onDone: () => void }) {
  const [request, setRequest] = useState(initialRequest)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const channel = supabase.channel(`request-${request.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'help_requests', filter: `id=eq.${request.id}` }, payload => {
        setRequest(payload.new as HelpRequest)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [request.id])

  async function cancel() {
    if (request.status !== 'open') return
    setBusy(true)
    const { error } = await supabase.rpc('cancel_help_request', { p_request_id: request.id })
    setBusy(false)
    if (error) Alert.alert('خطأ', error.message)
  }

  const finished = request.status === 'completed' || request.status === 'cancelled'

  return (
    <Screen contentStyle={styles.content}>
      <View style={[styles.pulse, request.status === 'open' ? styles.searching : styles.found]}><Text style={styles.pulseIcon}>{request.status === 'open' ? '📡' : request.status === 'completed' ? '✅' : '🤝'}</Text></View>
      <Text style={styles.title}>{labels[request.status]}</Text>
      <Text style={styles.subtitle}>{request.status === 'open' ? 'أي متطوع متاح وقريب يقدر يشوف طلبك ويستلمه.' : request.status === 'completed' ? 'شكراً لاستخدام سَنَد ❤️' : 'حالة الطلب تتحدث مباشرة بينك وبين المتطوع.'}</Text>

      <View style={styles.card}>
        <Text style={styles.label}>رقم الطلب</Text><Text style={styles.value}>{request.id.slice(0, 8).toUpperCase()}</Text>
        <View style={styles.line} />
        <Text style={styles.label}>الحالة</Text><Text style={[styles.value, { color: request.status === 'open' ? colors.blue : colors.green }]}>{labels[request.status]}</Text>
      </View>

      {finished ? <PrimaryButton title="العودة لاختيار الدور" onPress={onDone} /> : null}
      {request.status === 'open' ? <PrimaryButton title="إلغاء الطلب" tone="light" onPress={cancel} loading={busy} /> : null}
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
  card: { backgroundColor: colors.card, borderRadius: 22, borderWidth: 1, borderColor: colors.border, padding: 18, marginBottom: 16 },
  label: { color: colors.muted, textAlign: 'right', fontSize: 13 },
  value: { color: colors.text, textAlign: 'right', fontSize: 17, fontWeight: '900', marginTop: 4 },
  line: { height: 1, backgroundColor: colors.border, marginVertical: 14 }
})
