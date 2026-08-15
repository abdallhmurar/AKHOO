import { Alert, Linking, StyleSheet, Text, View } from 'react-native'
import { supabase } from '../lib/supabase'
import { colors } from '../lib/theme'
import type { HelpRequest, RequestStatus } from '../types'
import { PrimaryButton } from '../components/PrimaryButton'
import { Screen } from '../components/Screen'

export function VolunteerJobScreen({ request, onDone }: { request: HelpRequest; onDone: () => void }) {
  async function setStatus(status: RequestStatus) {
    const { error } = await supabase.rpc('update_help_request_status', { p_request_id: request.id, p_status: status })
    if (error) {
      Alert.alert('خطأ', error.message)
      return
    }
    if (status === 'completed') onDone()
  }

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.icon}><Text style={styles.iconText}>🚗</Text></View>
      <Text style={styles.title}>أنت استلمت المهمة</Text>
      <Text style={styles.subtitle}>حدّث حالة المهمة حتى صاحب الطلب يعرف وين وصلت.</Text>

      <View style={styles.card}>
        <Text style={styles.label}>رقم الطلب</Text>
        <Text style={styles.value}>{request.id.slice(0, 8).toUpperCase()}</Text>
      </View>

      <PrimaryButton title="افتح الموقع" tone="light" onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${request.latitude},${request.longitude}`)} />
      <PrimaryButton title="أنا في الطريق" onPress={() => setStatus('on_the_way')} />
      <PrimaryButton title="وصلت للموقع" tone="green" onPress={() => setStatus('arrived')} />
      <PrimaryButton title="تمت المساعدة ✓" tone="green" onPress={() => setStatus('completed')} />
    </Screen>
  )
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'center', gap: 10 },
  icon: { width: 94, height: 94, borderRadius: 30, backgroundColor: colors.greenSoft, alignSelf: 'center', alignItems: 'center', justifyContent: 'center' },
  iconText: { fontSize: 42 },
  title: { fontSize: 27, fontWeight: '900', color: colors.text, textAlign: 'center', marginTop: 10 },
  subtitle: { color: colors.muted, textAlign: 'center', lineHeight: 22, marginBottom: 14 },
  card: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 20, padding: 16, marginBottom: 5 },
  label: { color: colors.muted, textAlign: 'right' },
  value: { color: colors.text, textAlign: 'right', fontWeight: '900', fontSize: 17, marginTop: 5 }
})
