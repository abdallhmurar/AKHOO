import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Image, Linking, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native'
import { ArrowLeft, ArrowRight, BatteryWarning, GasPump, Lock, MapPin, Tire, Wrench } from 'phosphor-react-native'
import { useTranslation } from 'react-i18next'
import { getCurrentCoords, distanceKm, startBackgroundLocationUpdates, stopBackgroundLocationUpdates } from '../lib/location'
import { registerForPushNotificationsAsync } from '../lib/notifications'
import { supabase } from '../lib/supabase'
import { colors, font, radius, space, shadow } from '../lib/theme'
import { formatElapsed } from '../lib/time'
import { dirStyles, useIsRTL } from '../lib/direction'
import type { HelpRequest, ServiceType } from '../types'
import { BottomSheet } from '../components/BottomSheet'
import { PrimaryButton } from '../components/PrimaryButton'
import { Header } from '../components/Header'
import { Screen } from '../components/Screen'
import { SanadMap } from '../components/SanadMap'
import { Tactile } from '../components/Tactile'

const services: { key: ServiceType; labelKey: string; Icon: typeof BatteryWarning }[] = [
  { key: 'battery', labelKey: 'request.battery', Icon: BatteryWarning },
  { key: 'tire', labelKey: 'request.tire', Icon: Tire },
  { key: 'fuel', labelKey: 'request.fuel', Icon: GasPump },
  { key: 'locked_car', labelKey: 'request.lockedCar', Icon: Lock },
  { key: 'other', labelKey: 'request.other', Icon: Wrench }
]
const serviceByKey = Object.fromEntries(services.map(item => [item.key, item])) as Record<ServiceType, (typeof services)[number]>

const HEARTBEAT_MS = 5 * 60 * 1000

type Nearby = HelpRequest & { distance: number }

export function VolunteerScreen({ userId, onBack, onAccepted }: { userId: string; onBack: () => void; onAccepted: (request: HelpRequest) => void }) {
  const { t } = useTranslation()
  const isRTL = useIsRTL()
  const dir = dirStyles(isRTL)
  const BackIcon = isRTL ? ArrowRight : ArrowLeft
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
      Alert.alert(t('common.error'), error.message)
      return
    }
    const nearby = (data as HelpRequest[])
      .filter(item => item.requester_id !== userId)
      .map(item => ({ ...item, distance: distanceKm(at.latitude, at.longitude, item.latitude, item.longitude) }))
      .filter(item => item.distance <= 20)
      .sort((a, b) => a.distance - b.distance)
    setRequests(nearby)
  }, [coords, userId, t])

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
      Alert.alert(t('volunteer.errors.claimedTitle'), t('volunteer.errors.claimedMessage'))
    }
  }, [requests, selectedId, t])

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
        await startBackgroundLocationUpdates(userId, { title: t('volunteer.backgroundNotification.title'), body: t('volunteer.backgroundNotification.body') }).catch(() => {})
      } else {
        await stopBackgroundLocationUpdates().catch(() => {})
        const { error } = await supabase.from('volunteer_profiles').upsert({ user_id: userId, is_available: false, updated_at: new Date().toISOString() })
        if (error) throw error
        setAvailable(false)
        setRequests([])
        setSelectedId(null)
      }
    } catch (error: any) {
      Alert.alert(t('volunteer.errors.toggleFailedTitle'), error.message ?? t('common.error'))
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
        Alert.alert(t('volunteer.errors.claimedTitle'), t('volunteer.errors.claimedMessage'))
        await loadRequests()
        return
      }
      onAccepted(accepted as HelpRequest)
    } catch (error: any) {
      Alert.alert(t('volunteer.errors.acceptFailedTitle'), error.message ?? t('common.error'))
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
        <Header title={t('volunteer.title')} subtitle={t('volunteer.subtitle')} onBack={onBack} />

        <View style={styles.skillsCard}>
          <Text style={[styles.skillsTitle, dir.textStart]}>{t('volunteer.capabilitiesTitle')}</Text>
          <View style={[styles.skillsGrid, dir.row]}>
            {services.map(item => {
              const active = myServices.includes(item.key)
              return (
                <Tactile key={item.key} onPress={() => toggleService(item.key)} style={[styles.skillChip, dir.row, active && styles.skillChipActive]}>
                  <item.Icon size={16} color={active ? '#fff' : colors.forest} weight={active ? 'fill' : 'regular'} />
                  <Text style={[styles.skillChipText, active && styles.skillChipTextActive]}>{t(item.labelKey)}</Text>
                </Tactile>
              )
            })}
          </View>
        </View>

        <View style={[styles.availability, dir.alignStart]}>
          <Text style={[styles.availabilityTitle, dir.textStart]}>{t('volunteer.notAvailableTitle')}</Text>
          <Text style={[styles.small, dir.textStart]}>{t('volunteer.notAvailableText')}</Text>
          <PrimaryButton title={t('volunteer.enable')} onPress={toggleAvailability} loading={loading} />
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

      <View style={[styles.topBar, dir.row]}>
        <Tactile onPress={onBack} style={styles.backButton} scaleTo={0.92}>
          <BackIcon size={18} color={colors.text} />
        </Tactile>
        <View style={[styles.statusPill, dir.row]}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText} numberOfLines={1}>
            {requests.length ? `${t('volunteer.availableNow')} · ${t('volunteer.nearbyCount', { count: requests.length })}` : t('volunteer.availableNow')}
          </Text>
        </View>
        <Tactile onPress={toggleAvailability} style={styles.stopButton} scaleTo={0.94}>
          {loading ? <ActivityIndicator color={colors.text} size="small" /> : <Text style={styles.stopText}>{t('volunteer.disable')}</Text>}
        </Tactile>
      </View>

      {requests.length === 0 ? (
        <View pointerEvents="none" style={styles.emptyBanner}>
          <Text style={styles.emptyBannerText}>{t('volunteer.emptyBanner')}</Text>
        </View>
      ) : null}

      <BottomSheet visible={!!selectedRequest} onClose={() => setSelectedId(null)}>
        {selectedRequest ? (
          <>
            <View style={[styles.sheetTop, dir.row]}>
              <View style={styles.sheetIcon}>
                <ServiceIcon type={selectedRequest.service_type} />
              </View>
              <View style={[styles.sheetTopText, dir.alignStart]}>
                <Text style={[styles.sheetTitle, dir.textStart]}>{t(serviceByKey[selectedRequest.service_type].labelKey)}</Text>
                <Text style={[styles.sheetMeta, dir.textStart]}>
                  {t('volunteer.distanceKm', { distance: selectedRequest.distance.toFixed(1) })} · {t('volunteer.since', { time: formatElapsed(now - new Date(selectedRequest.created_at).getTime(), t) })}
                </Text>
              </View>
            </View>
            {myServices.includes(selectedRequest.service_type) ? <Text style={[styles.matchBadge, dir.textStart]}>{t('volunteer.matchBadge')}</Text> : null}
            {selectedRequest.note ? <Text style={[styles.note, dir.textStart]}>{selectedRequest.note}</Text> : null}
            {selectedRequest.photo_url ? <Image source={{ uri: selectedRequest.photo_url }} style={styles.photo} /> : null}
            <View style={[styles.sheetActions, dir.row]}>
              <Pressable onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${selectedRequest.latitude},${selectedRequest.longitude}`)} style={[styles.mapButton, dir.row]}>
                <MapPin size={16} color={colors.forest} />
                <Text style={styles.mapText}>{t('volunteer.openExternal')}</Text>
              </Pressable>
              <PrimaryButton title={t('volunteer.accept')} onPress={() => accept(selectedRequest)} loading={loading} style={styles.acceptButton} />
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
  skillsTitle: { color: colors.text, fontFamily: font.bold, fontSize: 15, marginBottom: space.md },
  skillsGrid: { flexWrap: 'wrap', gap: space.sm },
  skillChip: { alignItems: 'center', gap: 6, backgroundColor: colors.sageSoft, borderRadius: radius.pill, paddingVertical: 9, paddingHorizontal: space.md },
  skillChipActive: { backgroundColor: colors.forest },
  skillChipText: { color: colors.forest, fontFamily: font.bold, fontSize: 13 },
  skillChipTextActive: { color: '#fff' },

  availability: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: space.lg, gap: space.md },
  availabilityTitle: { color: colors.text, fontFamily: font.extraBold, fontSize: 18 },
  small: { color: colors.muted, fontFamily: font.regular, fontSize: 13.5, lineHeight: 20 },

  topBar: { position: 'absolute', top: space.lg, left: space.lg, right: space.lg, alignItems: 'center', gap: space.sm },
  backButton: { width: 42, height: 42, borderRadius: radius.pill, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...shadow.soft },
  statusPill: { flex: 1, alignItems: 'center', gap: 7, backgroundColor: colors.surface, borderRadius: radius.pill, paddingVertical: 10, paddingHorizontal: space.md, ...shadow.soft },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success },
  statusText: { color: colors.text, fontFamily: font.bold, fontSize: 13 },
  stopButton: { minWidth: 60, height: 42, borderRadius: radius.pill, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.md, ...shadow.soft },
  stopText: { color: colors.danger, fontFamily: font.bold, fontSize: 13 },

  emptyBanner: { position: 'absolute', left: space.lg, right: space.lg, bottom: space.xl, backgroundColor: colors.surface, borderRadius: radius.lg, padding: space.md, ...shadow.soft },
  emptyBannerText: { color: colors.muted, fontFamily: font.medium, fontSize: 12.5, textAlign: 'center', lineHeight: 18 },

  sheetTop: { alignItems: 'center', gap: space.md },
  sheetIcon: { width: 52, height: 52, borderRadius: radius.md, backgroundColor: colors.sageSoft, alignItems: 'center', justifyContent: 'center' },
  sheetTopText: { flex: 1 },
  sheetTitle: { color: colors.text, fontFamily: font.extraBold, fontSize: 18 },
  sheetMeta: { color: colors.muted, fontFamily: font.regular, fontSize: 12.5, marginTop: 3 },
  matchBadge: { color: colors.success, fontFamily: font.bold, fontSize: 12.5, marginTop: space.md },
  note: { color: colors.text, fontFamily: font.regular, fontSize: 14, lineHeight: 21, marginTop: space.md },
  photo: { width: '100%', height: 150, borderRadius: radius.md, marginTop: space.md },
  sheetActions: { gap: space.sm, marginTop: space.lg },
  acceptButton: { flex: 1.6 },
  mapButton: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.sageSoft, borderRadius: radius.sm, minHeight: 54 },
  mapText: { color: colors.forest, fontFamily: font.bold, fontSize: 13 }
})
