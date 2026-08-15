import { useCallback, useEffect, useState } from 'react'
import { Alert, Image, Linking, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { getCurrentCoords, distanceKm } from '../lib/location'
import { supabase } from '../lib/supabase'
import { colors } from '../lib/theme'
import type { HelpRequest, ServiceType } from '../types'
import { Header } from '../components/Header'
import { PrimaryButton } from '../components/PrimaryButton'
import { Screen } from '../components/Screen'
import { MapPreview } from '../components/MapPreview'

const serviceLabels: Record<string, string> = { battery: '🔋 بطارية', tire: '🛞 بنشر', fuel: '⛽ وقود', locked_car: '🔑 سيارة مقفلة', other: '🧰 مساعدة أخرى' }

const services: { key: ServiceType; label: string }[] = [
  { key: 'battery', label: '🔋 بطارية' },
  { key: 'tire', label: '🛞 بنشر' },
  { key: 'fuel', label: '⛽ وقود' },
  { key: 'locked_car', label: '🔑 سيارة مقفلة' },
  { key: 'other', label: '🧰 شيء آخر' }
]

type Nearby = HelpRequest & { distance: number }

export function VolunteerScreen({ userId, onBack, onAccepted }: { userId: string; onBack: () => void; onAccepted: (request: HelpRequest) => void }) {
  const [available, setAvailable] = useState(false)
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null)
  const [requests, setRequests] = useState<Nearby[]>([])
  const [myServices, setMyServices] = useState<ServiceType[]>([])
  const [expandedMap, setExpandedMap] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const loadRequests = useCallback(async (position = coords) => {
    if (!position) return
    const { data, error } = await supabase.from('help_requests').select('*').eq('status', 'open').order('created_at', { ascending: false }).limit(100)
    if (error) {
      Alert.alert('خطأ', error.message)
      return
    }
    const nearby = (data as HelpRequest[])
      .filter(item => item.requester_id !== userId)
      .map(item => ({ ...item, distance: distanceKm(position.latitude, position.longitude, item.latitude, item.longitude) }))
      .filter(item => item.distance <= 20)
      .sort((a, b) => a.distance - b.distance)
    setRequests(nearby)
  }, [coords, userId])

  useEffect(() => {
    if (!available || !coords) return
    loadRequests(coords)
    const channel = supabase.channel('open-help-requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'help_requests' }, () => loadRequests(coords))
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [available, coords, loadRequests])

  function toggleService(key: ServiceType) {
    setMyServices(current => current.includes(key) ? current.filter(s => s !== key) : [...current, key])
  }

  async function toggleAvailability() {
    setLoading(true)
    try {
      if (!available) {
        const position = await getCurrentCoords()
        const { error } = await supabase.from('volunteer_profiles').upsert({
          user_id: userId,
          is_available: true,
          latitude: position.latitude,
          longitude: position.longitude,
          services: myServices,
          updated_at: new Date().toISOString()
        })
        if (error) throw error
        setCoords(position)
        setAvailable(true)
        await loadRequests(position)
      } else {
        const { error } = await supabase.from('volunteer_profiles').upsert({ user_id: userId, is_available: false, updated_at: new Date().toISOString() })
        if (error) throw error
        setAvailable(false)
        setRequests([])
      }
    } catch (error: any) {
      Alert.alert('ما زبطت العملية', error.message ?? 'حدث خطأ')
    } finally {
      setLoading(false)
    }
  }

  async function onRefresh() {
    if (!available) return
    setRefreshing(true)
    await loadRequests()
    setRefreshing(false)
  }

  async function accept(request: Nearby) {
    setLoading(true)
    try {
      const { data, error } = await supabase.rpc('accept_help_request', { p_request_id: request.id })
      if (error) throw error
      const accepted = Array.isArray(data) ? data[0] : data
      if (!accepted) {
        Alert.alert('سبقك متطوع', 'هذا الطلب انأخذ قبل لحظات.')
        await loadRequests()
        return
      }
      onAccepted(accepted as HelpRequest)
    } catch (error: any) {
      Alert.alert('ما قدرنا نستلم الطلب', error.message ?? 'حدث خطأ')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.blue} colors={[colors.blue]} />}>
      <Header title="بدي أساعد" subtitle="فعّل توفرّك حتى نشوف الطلبات القريبة من موقعك." onBack={onBack} />

      {!available ? (
        <View style={styles.skillsCard}>
          <Text style={styles.skillsTitle}>شو بتقدر تساعد فيه؟ (اختياري)</Text>
          <View style={styles.skillsGrid}>
            {services.map(item => (
              <Pressable key={item.key} onPress={() => toggleService(item.key)} style={[styles.skillChip, myServices.includes(item.key) && styles.skillChipActive]}>
                <Text style={[styles.skillChipText, myServices.includes(item.key) && styles.skillChipTextActive]}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      <View style={styles.availability}>
        <View style={styles.availabilityText}>
          <Text style={styles.availabilityTitle}>{available ? 'أنت متاح الآن 🟢' : 'أنت غير متاح حالياً'}</Text>
          <Text style={styles.small}>{available ? 'الطلبات ضمن 20 كم تظهر تحت.' : 'موقعك لا يُرسل إلا عند تفعيل التوفر.'}</Text>
        </View>
        <PrimaryButton title={available ? 'إيقاف' : 'تفعيل'} tone={available ? 'light' : 'green'} onPress={toggleAvailability} loading={loading} />
      </View>

      {available ? (
        <>
          <View style={styles.sectionRow}><Text style={styles.sectionTitle}>طلبات قريبة</Text><Text onPress={() => loadRequests()} style={styles.refresh}>تحديث</Text></View>
          {requests.length === 0 ? <View style={styles.empty}><Text style={styles.emptyIcon}>🤍</Text><Text style={styles.emptyTitle}>ما في طلبات قريبة هلق</Text><Text style={styles.small}>إذا ظهر طلب جديد، Realtime يحدث القائمة تلقائياً.</Text></View> : null}
          {requests.map(request => (
            <View key={request.id} style={styles.requestCard}>
              <View style={styles.requestTop}>
                <Text style={styles.service}>{serviceLabels[request.service_type]}</Text>
                <Text style={styles.distance}>{request.distance.toFixed(1)} كم</Text>
              </View>
              {myServices.includes(request.service_type) ? <Text style={styles.matchBadge}>✓ ضمن مهاراتك</Text> : null}
              {request.note ? <Text style={styles.note}>{request.note}</Text> : null}
              {request.photo_url ? <Image source={{ uri: request.photo_url }} style={styles.photo} /> : null}
              <View style={styles.actions}>
                <Pressable onPress={() => setExpandedMap(expandedMap === request.id ? null : request.id)} style={styles.mapButton}><Text style={styles.mapText}>🗺️ الخريطة</Text></Pressable>
                <Pressable onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${request.latitude},${request.longitude}`)} style={styles.mapButton}><Text style={styles.mapText}>فتح خارجي</Text></Pressable>
                <Pressable onPress={() => accept(request)} style={styles.acceptButton}><Text style={styles.acceptText}>استلام المهمة</Text></Pressable>
              </View>
              {expandedMap === request.id ? <MapPreview latitude={request.latitude} longitude={request.longitude} /> : null}
            </View>
          ))}
        </>
      ) : null}
    </Screen>
  )
}

const styles = StyleSheet.create({
  skillsCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 22, padding: 16, marginBottom: 14 },
  skillsTitle: { color: colors.text, fontWeight: '900', textAlign: 'right', marginBottom: 10 },
  skillsGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 },
  skillChip: { backgroundColor: colors.blueSoft, borderRadius: 12, paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: 'transparent' },
  skillChipActive: { backgroundColor: colors.blue },
  skillChipText: { color: colors.blueDark, fontWeight: '800', fontSize: 13 },
  skillChipTextActive: { color: '#fff' },
  availability: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 22, padding: 16, gap: 14 },
  availabilityText: { alignItems: 'flex-end' },
  availabilityTitle: { color: colors.text, fontWeight: '900', fontSize: 17 },
  small: { color: colors.muted, textAlign: 'right', lineHeight: 20, marginTop: 5 },
  sectionRow: { marginTop: 24, marginBottom: 10, flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { color: colors.text, fontSize: 20, fontWeight: '900' },
  refresh: { color: colors.blueDark, fontWeight: '800' },
  empty: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 22, padding: 24, alignItems: 'center' },
  emptyIcon: { fontSize: 32 },
  emptyTitle: { marginTop: 8, color: colors.text, fontWeight: '900', fontSize: 17 },
  requestCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 22, padding: 16, marginBottom: 12 },
  requestTop: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  service: { color: colors.text, fontSize: 17, fontWeight: '900' },
  distance: { color: colors.blueDark, fontWeight: '900', backgroundColor: colors.blueSoft, paddingVertical: 6, paddingHorizontal: 9, borderRadius: 10 },
  matchBadge: { color: colors.green, fontWeight: '800', textAlign: 'right', marginTop: 8, fontSize: 13 },
  note: { color: colors.muted, textAlign: 'right', marginTop: 10, lineHeight: 20 },
  photo: { width: '100%', height: 140, borderRadius: 14, marginTop: 10 },
  actions: { flexDirection: 'row-reverse', gap: 8, marginTop: 14 },
  acceptButton: { flex: 1.6, backgroundColor: colors.blue, borderRadius: 14, alignItems: 'center', paddingVertical: 13 },
  acceptText: { color: '#fff', fontWeight: '900' },
  mapButton: { flex: 1, backgroundColor: colors.blueSoft, borderRadius: 14, alignItems: 'center', paddingVertical: 13 },
  mapText: { color: colors.blueDark, fontWeight: '900', fontSize: 13 }
})
