import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Image, Linking, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native'
import { ArrowLeft, BatteryWarning, GasPump, Lock, MapPin, Tire, Wrench } from 'phosphor-react-native'
import { getCurrentCoords, distanceKm, startBackgroundLocationUpdates, stopBackgroundLocationUpdates } from '../lib/location'
import { registerForPushNotificationsAsync } from '../lib/notifications'
import { supabase } from '../lib/supabase'
import { colors, font, radius, space, shadow } from '../lib/theme'
import { formatElapsed } from '../lib/time'
import type { HelpRequest, ServiceType } from '../types'
import { BottomSheet } from '../components/BottomSheet'
import { Header } from '../components/Header'
import { PrimaryButton } from '../components/PrimaryButton'
import { Screen } from '../components/Screen'
import { SanadMap } from '../components/SanadMap'
import { Tactile } from '../components/Tactile'

const services: { key: ServiceType; label: string; Icon: typeof BatteryWarning }[] = [
  { key: 'battery', label: 'بطارية', Icon: BatteryWarning },
  { key: 'tire', label: 'بنشر', Icon: Tire },
  { key: 'fuel', label: 'وقود', Icon: GasPump },
  { key: 'locked_car', label: 'سيارة مقفلة', Icon: Lock },
  { key: 'other', label: 'شيء آخر', Icon: Wrench }
]
const serviceByKey = Object.fromEntries(services.map(item => [item.key, item])) as Record<ServiceType, (typeof services)[number]>

const HEARTBEAT_MS = 5 * 60 * 1000

type Nearby = HelpRequest & { distance: number }

export function VolunteerScreen({ userId, onBack, onAccepted }: { userId: string; onBack: () => void; onAccepted: (request: HelpRequest) => void }) {
  const [hydrated, setHydrated] = useState(false)
  const [available, setAvailable] = useState(false)
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null)
  const [requests, setRequests] = useState<Nearby[]>([])
  const [myServices, setMyServices] = useState<ServiceType[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [now, setNow] = useState(Date.now())

  const loadRequests = useCallback(async (position?: { latitude: number; longitude: number } | null) => {
    const at = position ?? coords
    if (!at) return
    const { data, error } = await supabase.from('help_requests').select('*').eq('status', 'open').order('created_at', { ascending: false }).limit(100)
    if (error) {
      Alert.alert('خطأ', error.message)
      return
    }
    const nearby = (data as HelpRequest[])
      .filter(item => item.requester_id !== userId)
      .map(item => ({ ...item, distance: distanceKm(at.latitude, at.longitude, item.latitude, item.longitude) }))
      .filter(item => item.distance <= 20)
      .sort((a, b) => a.distance - b.distance)
    setRequests(nearby)
  }, [coords, userId])

  // Restore state from the DB on mount instead of assuming a fresh session -
  // if the app was killed while still available server-side, pick that back
  // up rather than forcing the user to re-toggle.
  useEffect(() => {
    let cancelled = false
    supabase.from('volunteer_profiles').select('is_available, services, latitude, longitude').eq('user_id', userId).maybeSingle().then(async ({ data }) => {
      if (cancelled) return
      if (data) {
        setMyServices(((data.services ?? []) as ServiceType[]))
        if (data.is_available && data.latitude != null && data.longitude != null) {
          const position = { latitude: data.latitude, longitude: data.longitude }
          setCoords(position)
          setAvailable(true)
          await loadRequests(position)
        }
      }
      if (!cancelled) setHydrated(true)
    })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  useEffect(() => {
    if (!available || !coords) return
    loadRequests(coords)
    const channel = supabase.channel('open-help-requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'help_requests' }, () => loadRequests(coords))
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [available, coords, loadRequests])

  // Foreground heartbeat: keeps this volunteer's presence fresh for the RLS
  // staleness bound even without background-location permission granted.
  useEffect(() => {
    if (!available) return
    const interval = setInterval(() => {
      supabase.from('volunteer_profiles').update({ updated_at: new Date().toISOString() }).eq('user_id', userId)
    }, HEARTBEAT_MS)
    return () => clearInterval(interval)
  }, [available, userId])

  useEffect(() => {
    if (!available) return
    const interval = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(interval)
  }, [available])

  // If the currently open sheet's request disappears (another volunteer
  // accepted it - realtime already refreshes `requests`), close it instead
  // of leaving it open on stale data.
  useEffect(() => {
    if (!selectedId) return
    if (!requests.some(item => item.id === selectedId)) {
      setSelectedId(null)
      Alert.alert('سبقك متطوع', 'هذا الطلب انأخذ قبل لحظات.')
    }
  }, [requests, selectedId])

  function toggleService(key: ServiceType) {
    setMyServices(current => {
      const next = current.includes(key) ? current.filter(item => item !== key) : [...current, key]
      if (available) supabase.from('volunteer_profiles').update({ services: next }).eq('user_id', userId).then(() => {})
      return next
    })
  }

  async function toggleAvailability() {
    setLoading(true)
    try {
      if (!available) {
        const position = await getCurrentCoords()
        const pushToken = await registerForPushNotificationsAsync().catch(() => null)
        const { error } = await supabase.from('volunteer_profiles').upsert({
          user_id: userId,
          is_available: true,
          latitude: position.latitude,
          longitude: position.longitude,
          services: myServices,
          push_token: pushToken,
          updated_at: new Date().toISOString()
        })
        if (error) throw error
        setCoords(position)
        setAvailable(true)
        await loadRequests(position)
        await startBackgroundLocationUpdates(userId).catch(() => {})
      } else {
        await stopBackgroundLocationUpdates().catch(() => {})
        const { error } = await supabase.from('volunteer_profiles').upsert({ user_id: userId, is_available: false, updated_at: new Date().toISOString() })
        if (error) throw error
        setAvailable(false)
        setRequests([])
        setSelectedId(null)
      }
    } catch (error: any) {
      Alert.alert('ما زبطت العملية', error.message ?? 'حدث خطأ')
    } finally {
      setLoading(false)
    }
  }

  async function accept(request: Nearby) {
    setLoading(true)
    try {
      const { data, error } = await supabase.rpc('accept_help_request', { p_request_id: request.id })
      if (error) throw error
      const accepted = Array.isArray(data) ? data[0] : data
      if (!accepted) {
        setSelectedId(null)
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

  const selectedRequest = requests.find(item => item.id === selectedId) ?? null

  if (!hydrated) {
    return (
      <Screen scroll={false} contentStyle={styles.loadingContent}>
        <ActivityIndicator color={colors.forest} />
      </Screen>
    )
  }

  if (!available) {
    return (
      <Screen>
        <Header title="بدي أساعد" subtitle="فعّل توفرّك حتى نشوف الطلبات القريبة من موقعك على الخريطة." onBack={onBack} />

        <View style={styles.skillsCard}>
          <Text style={styles.skillsTitle}>شو بتقدر تساعد فيه؟ (اختياري)</Text>
          <View style={styles.skillsGrid}>
            {services.map(item => {
              const active = myServices.includes(item.key)
              return (
                <Tactile key={item.key} onPress={() => toggleService(item.key)} style={[styles.skillChip, active && styles.skillChipActive]}>
                  <item.Icon size={16} color={active ? '#fff' : colors.forest} weight={active ? 'fill' : 'regular'} />
                  <Text style={[styles.skillChipText, active && styles.skillChipTextActive]}>{item.label}</Text>
                </Tactile>
              )
            })}
          </View>
        </View>

        <View style={styles.availability}>
          <Text style={styles.availabilityTitle}>أنت غير متاح حالياً</Text>
          <Text style={styles.small}>موقعك لا يُرسل إلا عند تفعيل التوفر، وتظهر لك الطلبات القريبة على خريطة مباشرة.</Text>
          <PrimaryButton title="تفعيل التوفر" onPress={toggleAvailability} loading={loading} />
        </View>
      </Screen>
    )
  }

  return (
    <SafeAreaView style={styles.fill}>
      {coords ? (
        <SanadMap
          latitude={coords.latitude}
          longitude={coords.longitude}
          zoom={12}
          interactive
          markers={requests.map(item => ({ id: item.id, latitude: item.latitude, longitude: item.longitude }))}
          onMarkerPress={setSelectedId}
          style={styles.map}
        />
      ) : null}

      <View style={styles.topBar}>
        <Tactile onPress={onBack} style={styles.backButton} scaleTo={0.92}>
          <ArrowLeft size={18} color={colors.text} />
        </Tactile>
        <View style={styles.statusPill}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText} numberOfLines={1}>متاح الآن{requests.length ? ` · ${requests.length} طلب قريب` : ''}</Text>
        </View>
        <Tactile onPress={toggleAvailability} style={styles.stopButton} scaleTo={0.94}>
          {loading ? <ActivityIndicator color={colors.text} size="small" /> : <Text style={styles.stopText}>إيقاف</Text>}
        </Tactile>
      </View>

      {requests.length === 0 ? (
        <View pointerEvents="none" style={styles.emptyBanner}>
          <Text style={styles.emptyBannerText}>ما في طلبات قريبة هلق — رح تظهر تلقائياً أول ما تنفتح.</Text>
        </View>
      ) : null}

      <BottomSheet visible={!!selectedRequest} onClose={() => setSelectedId(null)}>
        {selectedRequest ? (
          <>
            <View style={styles.sheetTop}>
              <View style={styles.sheetIcon}>
                <ServiceIcon type={selectedRequest.service_type} />
              </View>
              <View style={styles.sheetTopText}>
                <Text style={styles.sheetTitle}>{serviceByKey[selectedRequest.service_type].label}</Text>
                <Text style={styles.sheetMeta}>{selectedRequest.distance.toFixed(1)} كم · منذ {formatElapsed(now - new Date(selectedRequest.created_at).getTime())}</Text>
              </View>
            </View>
            {myServices.includes(selectedRequest.service_type) ? <Text style={styles.matchBadge}>✓ ضمن مهاراتك</Text> : null}
            {selectedRequest.note ? <Text style={styles.note}>{selectedRequest.note}</Text> : null}
            {selectedRequest.photo_url ? <Image source={{ uri: selectedRequest.photo_url }} style={styles.photo} /> : null}
            <View style={styles.sheetActions}>
              <Pressable onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${selectedRequest.latitude},${selectedRequest.longitude}`)} style={styles.mapButton}>
                <MapPin size={16} color={colors.forest} />
                <Text style={styles.mapText}>فتح خارجي</Text>
              </Pressable>
              <PrimaryButton title="استلام المهمة" onPress={() => accept(selectedRequest)} loading={loading} style={styles.acceptButton} />
            </View>
          </>
        ) : null}
      </BottomSheet>
    </SafeAreaView>
  )
}

function ServiceIcon({ type }: { type: ServiceType }) {
  const Icon = serviceByKey[type].Icon
  return <Icon size={26} color={colors.forest} weight="duotone" />
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
  loadingContent: { alignItems: 'center', justifyContent: 'center' },
  map: { flex: 1, marginTop: 0, borderRadius: 0, borderWidth: 0 },

  skillsCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: space.lg, marginBottom: space.lg },
  skillsTitle: { color: colors.text, fontFamily: font.bold, fontSize: 15, textAlign: 'right', marginBottom: space.md },
  skillsGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: space.sm },
  skillChip: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, backgroundColor: colors.sageSoft, borderRadius: radius.pill, paddingVertical: 9, paddingHorizontal: space.md },
  skillChipActive: { backgroundColor: colors.forest },
  skillChipText: { color: colors.forest, fontFamily: font.bold, fontSize: 13 },
  skillChipTextActive: { color: '#fff' },

  availability: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: space.lg, gap: space.md, alignItems: 'flex-end' },
  availabilityTitle: { color: colors.text, fontFamily: font.extraBold, fontSize: 18, textAlign: 'right' },
  small: { color: colors.muted, textAlign: 'right', fontFamily: font.regular, fontSize: 13.5, lineHeight: 20 },

  topBar: { position: 'absolute', top: space.lg, left: space.lg, right: space.lg, flexDirection: 'row-reverse', alignItems: 'center', gap: space.sm },
  backButton: { width: 42, height: 42, borderRadius: radius.pill, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...shadow.soft },
  statusPill: { flex: 1, flexDirection: 'row-reverse', alignItems: 'center', gap: 7, backgroundColor: colors.surface, borderRadius: radius.pill, paddingVertical: 10, paddingHorizontal: space.md, ...shadow.soft },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success },
  statusText: { color: colors.text, fontFamily: font.bold, fontSize: 13 },
  stopButton: { minWidth: 60, height: 42, borderRadius: radius.pill, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.md, ...shadow.soft },
  stopText: { color: colors.danger, fontFamily: font.bold, fontSize: 13 },

  emptyBanner: { position: 'absolute', left: space.lg, right: space.lg, bottom: space.xl, backgroundColor: colors.surface, borderRadius: radius.lg, padding: space.md, ...shadow.soft },
  emptyBannerText: { color: colors.muted, fontFamily: font.medium, fontSize: 12.5, textAlign: 'center', lineHeight: 18 },

  sheetTop: { flexDirection: 'row-reverse', alignItems: 'center', gap: space.md },
  sheetIcon: { width: 52, height: 52, borderRadius: radius.md, backgroundColor: colors.sageSoft, alignItems: 'center', justifyContent: 'center' },
  sheetTopText: { flex: 1, alignItems: 'flex-end' },
  sheetTitle: { color: colors.text, fontFamily: font.extraBold, fontSize: 18, textAlign: 'right' },
  sheetMeta: { color: colors.muted, fontFamily: font.regular, fontSize: 12.5, textAlign: 'right', marginTop: 3 },
  matchBadge: { color: colors.success, fontFamily: font.bold, fontSize: 12.5, textAlign: 'right', marginTop: space.md },
  note: { color: colors.text, fontFamily: font.regular, fontSize: 14, textAlign: 'right', lineHeight: 21, marginTop: space.md },
  photo: { width: '100%', height: 150, borderRadius: radius.md, marginTop: space.md },
  sheetActions: { flexDirection: 'row-reverse', gap: space.sm, marginTop: space.lg },
  acceptButton: { flex: 1.6 },
  mapButton: { flex: 1, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.sageSoft, borderRadius: radius.sm, minHeight: 54 },
  mapText: { color: colors.forest, fontFamily: font.bold, fontSize: 13 }
})
