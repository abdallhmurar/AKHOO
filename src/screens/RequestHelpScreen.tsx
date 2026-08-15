import { useState } from 'react'
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { getCurrentCoords } from '../lib/location'
import { supabase } from '../lib/supabase'
import { colors } from '../lib/theme'
import type { HelpRequest, ServiceType } from '../types'
import { Header } from '../components/Header'
import { PrimaryButton } from '../components/PrimaryButton'
import { Screen } from '../components/Screen'

const services: { key: ServiceType; label: string; icon: string }[] = [
  { key: 'battery', label: 'بطارية', icon: '🔋' },
  { key: 'tire', label: 'بنشر', icon: '🛞' },
  { key: 'fuel', label: 'وقود', icon: '⛽' },
  { key: 'locked_car', label: 'سيارة مقفلة', icon: '🔑' },
  { key: 'other', label: 'شيء آخر', icon: '🧰' }
]

export function RequestHelpScreen({ userId, onBack, onCreated }: { userId: string; onBack: () => void; onCreated: (request: HelpRequest) => void }) {
  const [service, setService] = useState<ServiceType | null>(null)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  async function createRequest() {
    if (!service) {
      Alert.alert('اختار المشكلة', 'اختار نوع المساعدة اللي بتحتاجها.')
      return
    }
    setLoading(true)
    try {
      const coords = await getCurrentCoords()
      const { data, error } = await supabase.from('help_requests').insert({
        requester_id: userId,
        service_type: service,
        note: note.trim() || null,
        latitude: coords.latitude,
        longitude: coords.longitude
      }).select('*').single()
      if (error) throw error
      onCreated(data as HelpRequest)
    } catch (error: any) {
      Alert.alert('ما قدرنا نفتح الطلب', error.message ?? 'حدث خطأ')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Screen>
      <Header title="طلب مساعدة" subtitle="اختار المشكلة، وبعدها نحدد موقعك تلقائياً." onBack={onBack} />
      <View style={styles.grid}>
        {services.map(item => (
          <Pressable key={item.key} onPress={() => setService(item.key)} style={[styles.service, service === item.key && styles.selected]}>
            <Text style={styles.serviceIcon}>{item.icon}</Text>
            <Text style={styles.serviceText}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder="ملاحظة للمتطوع (اختياري)"
        placeholderTextColor={colors.muted}
        style={styles.note}
        multiline
        textAlign="right"
      />
      <View style={styles.locationInfo}>
        <Text style={styles.locationTitle}>📍 الموقع</Text>
        <Text style={styles.locationText}>سنطلب إذن الموقع فقط عند إرسال الطلب.</Text>
      </View>
      <PrimaryButton title="إرسال طلب المساعدة" onPress={createRequest} loading={loading} />
    </Screen>
  )
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 11 },
  service: { width: '47.5%', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 20, minHeight: 112, alignItems: 'center', justifyContent: 'center' },
  selected: { borderColor: colors.blue, backgroundColor: colors.blueSoft },
  serviceIcon: { fontSize: 30, marginBottom: 8 },
  serviceText: { color: colors.text, fontWeight: '800', fontSize: 15 },
  note: { backgroundColor: colors.card, minHeight: 100, borderWidth: 1, borderColor: colors.border, borderRadius: 19, padding: 14, color: colors.text, fontSize: 15, marginTop: 16, textAlignVertical: 'top' },
  locationInfo: { backgroundColor: colors.blueSoft, borderRadius: 18, padding: 14, marginVertical: 16 },
  locationTitle: { color: colors.blueDark, fontWeight: '900', textAlign: 'right' },
  locationText: { color: colors.muted, textAlign: 'right', marginTop: 5 }
})
