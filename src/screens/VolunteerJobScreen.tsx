import { useEffect, useState } from 'react'
import { Alert, Image, Linking, StyleSheet, Text, View } from 'react-native'
import { supabase } from '../lib/supabase'
import { colors } from '../lib/theme'
import type { HelpRequest, Profile, RequestStatus } from '../types'
import { Header } from '../components/Header'
import { PrimaryButton } from '../components/PrimaryButton'
import { Screen } from '../components/Screen'
import { MapPreview } from '../components/MapPreview'

const statusLabels: Record<string, string> = {
  accepted: 'استلمت المهمة',
  on_the_way: 'أنت بالطريق',
  arrived: 'أنت وصلت',
  completed: 'تمت المساعدة',
  cancelled: 'أُلغي الطلب'
}

export function VolunteerJobScreen({ request: initialRequest, onBack, onDone }: { request: HelpRequest; onBack: () => void; onDone: () => void }) {
  const [request, setRequest] = useState(initialRequest)
  const [requester, setRequester] = useState<Profile | null>(null)

  useEffect(() => {
    const channel = supabase.channel(`volunteer-job-${request.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'help_requests', filter: `id=eq.${request.id}` }, payload => {
        setRequest(payload.new as HelpRequest)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [request.id])

  useEffect(() => {
    supabase.from('profiles').select('id,full_name,phone,is_admin,is_banned').eq('id', request.requester_id).single().then(({ data }) => {
      if (data) setRequester(data as Profile)
    })
  }, [request.requester_id])

  async function setStatus(status: RequestStatus) {
    const { error } = await supabase.rpc('update_help_request_status', { p_request_id: request.id, p_status: status })
    if (error) {
      Alert.alert('خطأ', error.message)
      return
    }
    if (status === 'completed') onDone()
  }

  const finished = request.status === 'completed' || request.status === 'cancelled'

  return (
    <Screen contentStyle={styles.content}>
      <Header title={statusLabels[request.status] ?? 'المهمة'} onBack={onBack} />
      <View style={[styles.icon, finished && styles.iconFinished]}><Text style={styles.iconText}>{request.status === 'completed' ? '✅' : request.status === 'cancelled' ? '🚫' : '🚗'}</Text></View>
      {!finished ? <Text style={styles.subtitle}>حدّث حالة المهمة حتى صاحب الطلب يعرف وين وصلت.</Text> : null}

      <View style={styles.card}>
        <Text style={styles.label}>رقم الطلب</Text>
        <Text style={styles.value}>{request.id.slice(0, 8).toUpperCase()}</Text>
      </View>

      {requester ? (
        <View style={styles.card}>
          <Text style={styles.label}>صاحب الطلب</Text>
          <Text style={styles.value}>{requester.full_name || 'مستخدم'}</Text>
          {!finished && requester.phone ? (
            <PrimaryButton title={`📞 اتصل بـ ${requester.phone}`} tone="green" onPress={() => Linking.openURL(`tel:${requester.phone}`)} />
          ) : null}
        </View>
      ) : null}

      {request.photo_url ? <Image source={{ uri: request.photo_url }} style={styles.photo} /> : null}

      <MapPreview latitude={request.latitude} longitude={request.longitude} />

      {!finished ? (
        <>
          <PrimaryButton title="افتح الموقع بخرائط جوجل" tone="light" onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${request.latitude},${request.longitude}`)} />
          <PrimaryButton title="أنا في الطريق" onPress={() => setStatus('on_the_way')} disabled={request.status !== 'accepted'} />
          <PrimaryButton title="وصلت للموقع" tone="green" onPress={() => setStatus('arrived')} disabled={request.status !== 'on_the_way'} />
          <PrimaryButton title="تمت المساعدة ✓" tone="green" onPress={() => setStatus('completed')} disabled={request.status !== 'arrived'} />
        </>
      ) : (
        <PrimaryButton title="رجوع" onPress={onBack} />
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
  label: { color: colors.muted, textAlign: 'right' },
  value: { color: colors.text, textAlign: 'right', fontWeight: '900', fontSize: 17, marginTop: 5 }
})
