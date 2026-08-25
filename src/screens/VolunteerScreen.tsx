import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, Alert, AppState, SafeAreaView, StyleSheet, Text, View } from 'react-native'
import * as Haptics from 'expo-haptics'
import { ArrowLeft, ArrowRight, BatteryWarning, GasPump, GpsFix, HandHeart, Lock, MapPin, Star, Tire, Wrench } from 'phosphor-react-native'
import { useTranslation } from 'react-i18next'
import { getCurrentCoords, startBackgroundLocationUpdates, stopBackgroundLocationUpdates } from '../lib/location'
import { filterNearbyRequests } from '../lib/nearbyRequests'
import type { NearbyRequest } from '../lib/nearbyRequests'
import { registerForPushNotificationsAsync } from '../lib/notifications'
import { translateActionError } from '../lib/rpcErrors'
import { supabase } from '../lib/supabase'
import { buildAvailableUpsertPayload } from '../lib/volunteerAvailability'
import { colors, font, radius, space, shadow, type } from '../lib/theme'
import { dirStyles, useIsRTL } from '../lib/direction'
import { useAndroidBackHandler } from '../lib/useAndroidBackHandler'
import type { HelpRequest, ServiceType } from '../types'
import { BottomSheet } from '../components/BottomSheet'
import { PrimaryButton } from '../components/PrimaryButton'
import { Header } from '../components/Header'
import { Screen } from '../components/Screen'
import { Skeleton } from '../components/Skeleton'
import { Surface } from '../components/Surface'
import { StatusPill } from '../components/StatusPill'
import { SanadMap } from '../components/SanadMap'
import type { SanadMapRef } from '../components/SanadMap.types'
import { SanadRequestSheet } from '../components/SanadRequestSheet'
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
const NEARBY_POLL_MS = 15 * 1000

export function VolunteerScreen({ userId, onBack, onAccepted }: { userId: string; onBack: () => void; onAccepted: (request: HelpRequest) => void }) {
  const { t } = useTranslation()
  const isRTL = useIsRTL()
  const dir = dirStyles(isRTL)
  const BackIcon = isRTL ? ArrowRight : ArrowLeft
  const [hydrated, setHydrated] = useState(false)
  const [available, setAvailable] = useState(false)
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null)
  const [requests, setRequests] = useState<NearbyRequest[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [now, setNow] = useState(Date.now())
  const mapRef = useRef<SanadMapRef>(null)

  // System back goes Home like the visible back arrow does - availability
  // is server-side state (volunteer_profiles.is_available) untouched by
  // navigating away; only the explicit disable button turns it off.
  useAndroidBackHandler(onBack)

  const loadRequests = useCallback(async (position?: { latitude: number; longitude: number } | null) => {
    const at = position ?? coords
    if (!at) return
    const { data, error } = await supabase.from('help_requests').select('*').eq('status', 'open').order('created_at', { ascending: false }).limit(100)
    if (error) {
      Alert.alert(t('common.error'), translateActionError(t, error))
      return
    }
    setRequests(filterNearbyRequests(data as HelpRequest[], userId, at))
  }, [coords, userId, t])

  // Restore state from the DB on mount instead of assuming a fresh session -
  // if the app was killed while still available server-side, pick that back
  // up rather than forcing the user to re-toggle.
  useEffect(() => {
    let cancelled = false
    supabase.from('volunteer_profiles').select('is_available, latitude, longitude').eq('user_id', userId).maybeSingle().then(async ({ data }) => {
      if (cancelled) return
      if (data) {
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

  // Confirmed on a real device: a brand-new nearby request never arrived
  // through the realtime channel above - only a manual availability
  // off/on retoggle (a fresh loadRequests() call) picked it up. Realtime's
  // RLS-gated broadcast has to re-evaluate "request read relevant"
  // (0007_volunteer_staleness.sql) per event, which is a Haversine-distance
  // join against this volunteer's own volunteer_profiles row - unlike the
  // simple id-equality policies the request-detail screens' channels rely
  // on, that's exactly the kind of non-trivial policy Realtime's broadcast
  // evaluation doesn't reliably re-check. Rather than trust realtime as the
  // source of truth (or weaken the policy to "fix" this), poll the same
  // authoritative loadRequests() on a short interval as a floor under
  // whatever realtime does or doesn't deliver.
  useEffect(() => {
    if (!available || !coords) return
    const interval = setInterval(() => loadRequests(coords), NEARBY_POLL_MS)
    return () => clearInterval(interval)
  }, [available, coords, loadRequests])

  // Realtime alone isn't a reliable source of truth here: an UPDATE that
  // flips a request to 'accepted' for a different volunteer can fall outside
  // this volunteer's own SELECT RLS policy on the new row, so they may never
  // receive that event and would otherwise keep showing an already-claimed
  // request until unrelated traffic happens to trigger a re-fetch. Re-query
  // authoritative state whenever the app comes back to the foreground.
  useEffect(() => {
    if (!available || !coords) return
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') loadRequests(coords)
    })
    return () => subscription.remove()
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

  // Keep the volunteer's own position plus every nearby request visible as
  // the list changes, instead of a fixed zoom that could crop out requests.
  useEffect(() => {
    if (!coords || requests.length === 0) return
    mapRef.current?.fitToMarkers([coords, ...requests.map(item => ({ latitude: item.latitude, longitude: item.longitude }))])
  }, [coords, requests])

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

  async function toggleAvailability() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
    setLoading(true)
    try {
      if (!available) {
        const position = await getCurrentCoords()
        const pushToken = await registerForPushNotificationsAsync().catch(() => null)
        const { error } = await supabase.from('volunteer_profiles').upsert(buildAvailableUpsertPayload(userId, position, pushToken))
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
      Alert.alert(t('volunteer.errors.toggleFailedTitle'), translateActionError(t, error))
    } finally {
      setLoading(false)
    }
  }

  async function accept(request: NearbyRequest) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {})
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
      Alert.alert(t('volunteer.errors.acceptFailedTitle'), translateActionError(t, error))
    } finally {
      setLoading(false)
    }
  }

  const selectedRequest = requests.find(item => item.id === selectedId) ?? null
  // Recomputed only when requests actually change, not on every render (e.g.
  // the 30s `now` tick) - SanadMap's marker-diffing effect keys off this
  // array's reference, so a fresh array each render would re-run it for no
  // reason.
  const requestMarkers = useMemo(() => requests.map(item => ({ id: item.id, latitude: item.latitude, longitude: item.longitude })), [requests])

  if (!hydrated) {
    return (
      <Screen>
        <Header title={t('volunteer.title')} subtitle={t('volunteer.subtitle')} onBack={onBack} />
        <Surface elevation="soft" padding="xl" style={[styles.availability, dir.alignStart]}>
          <Skeleton width={110} height={22} radius={radius.pill} />
          <Skeleton width="90%" height={14} style={styles.skeletonGap} />
          <Skeleton width="100%" height={48} radius={radius.md} style={styles.skeletonGapLg} />
        </Surface>
      </Screen>
    )
  }

  if (!available) {
    return (
      <Screen>
        <Header title={t('volunteer.title')} subtitle={t('volunteer.subtitle')} onBack={onBack} />

        <Surface elevation="soft" padding="xl" style={[styles.availability, dir.alignStart]}>
          <StatusPill label={t('volunteer.notAvailableTitle')} tone="warning" />
          <Text style={[styles.small, dir.textStart]}>{t('volunteer.notAvailableText')}</Text>
          <PrimaryButton title={t('volunteer.enable')} onPress={toggleAvailability} loading={loading} />
        </Surface>

        <Text style={[styles.howItWorksTitle, dir.textStart]}>{t('volunteer.howItWorks.title')}</Text>
        <View style={styles.howItWorksList}>
          <HowItWorksRow index={1} Icon={MapPin} text={t('volunteer.howItWorks.mapItem')} last={false} />
          <HowItWorksRow index={2} Icon={HandHeart} text={t('volunteer.howItWorks.chooseItem')} last={false} />
          <HowItWorksRow index={3} Icon={Star} text={t('volunteer.howItWorks.starItem')} last />
        </View>
      </Screen>
    )
  }

  return (
    <SafeAreaView style={styles.fill}>
      {coords ? (
        <SanadMap
          ref={mapRef}
          latitude={coords.latitude}
          longitude={coords.longitude}
          zoom={13}
          interactive
          markers={requestMarkers}
          selectedId={selectedId}
          onMarkerPress={setSelectedId}
          style={styles.map}
        />
      ) : null}

      {/* One unified floating pill bar (back / live status / stop) instead
          of three separate floating circles - reuses the exact pill
          container language ported into TabBar.tsx from 21st.dev's Bottom
          Nav Bar (actual source fetched), so the map screens and the
          bottom navigation now share one floating-control identity. */}
      <View style={[styles.topBar, dir.row]}>
        <Tactile onPress={onBack} style={styles.topBarIconButton} scaleTo={0.92}>
          <BackIcon size={18} color={colors.text} />
        </Tactile>
        <View style={styles.statusPillWrap}>
          <StatusPill
            tone="success"
            pulse
            label={requests.length ? `${t('volunteer.availableNow')} · ${t('volunteer.nearbyCount', { count: requests.length })}` : t('volunteer.availableNow')}
          />
        </View>
        <Tactile onPress={toggleAvailability} style={styles.topBarTextButton} scaleTo={0.94}>
          {loading ? <ActivityIndicator color={colors.text} size="small" /> : <Text style={styles.stopText}>{t('volunteer.disable')}</Text>}
        </Tactile>
      </View>

      {coords ? (
        <Tactile
          onPress={() => mapRef.current?.recenter(coords.latitude, coords.longitude, 13)}
          style={[styles.locateButton, { [isRTL ? 'left' : 'right']: space.lg }]}
          scaleTo={0.9}
        >
          <GpsFix size={20} color={colors.forest} />
        </Tactile>
      ) : null}

      {requests.length === 0 ? (
        <Surface elevation="floating" padding="md" style={styles.emptyBanner} tone="surface">
          <Text style={styles.emptyBannerText}>{t('volunteer.emptyBanner')}</Text>
        </Surface>
      ) : null}

      <BottomSheet visible={!!selectedRequest} onClose={() => setSelectedId(null)}>
        {selectedRequest ? (
          <SanadRequestSheet
            Icon={serviceByKey[selectedRequest.service_type].Icon}
            serviceLabel={t(serviceByKey[selectedRequest.service_type].labelKey)}
            createdAt={selectedRequest.created_at}
            now={now}
            distanceKm={selectedRequest.distance}
            note={selectedRequest.note}
            photoUrl={selectedRequest.photo_url}
            latitude={selectedRequest.latitude}
            longitude={selectedRequest.longitude}
            onAccept={() => accept(selectedRequest)}
            loading={loading}
          />
        ) : null}
      </BottomSheet>
    </SafeAreaView>
  )
}

// Fills the (otherwise near-empty) not-available state with real,
// static information about what helping actually involves, reinforcing
// the community framing this mode is meant to have - never gig-worker
// assignment language. Rendered as a connected numbered rail (same visual
// language as the Request Help step rail and StatusTimeline) instead of
// three unrelated icon rows, so "how this works" reads as one sequence.
function HowItWorksRow({ index, Icon, text, last }: { index: number; Icon: typeof MapPin; text: string; last: boolean }) {
  const dir = dirStyles(useIsRTL())
  return (
    <View style={[styles.howItWorksRow, dir.row]}>
      <View style={styles.howItWorksRailCol}>
        <View style={styles.howItWorksNode}>
          <Icon size={16} color={colors.forest} weight="duotone" />
        </View>
        {!last ? <View style={styles.howItWorksLine} /> : null}
      </View>
      <Text style={[styles.howItWorksText, dir.textStart]}>{text}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
  map: { flex: 1, marginTop: 0, borderRadius: 0, borderWidth: 0 },

  availability: { gap: space.md },
  skeletonGap: { marginTop: space.xs },
  skeletonGapLg: { marginTop: space.md },
  small: { color: colors.muted, fontFamily: font.regular, fontSize: 13.5, lineHeight: 20 },

  howItWorksTitle: { ...type.eyebrow, color: colors.sage, textTransform: 'uppercase', marginTop: space.xxl, marginBottom: space.lg },
  howItWorksList: { gap: 0 },
  howItWorksRow: { gap: space.md },
  howItWorksRailCol: { alignItems: 'center', width: 36 },
  howItWorksNode: { width: 36, height: 36, borderRadius: radius.pill, backgroundColor: colors.sageSoft, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  howItWorksLine: { width: 2, flex: 1, minHeight: 20, backgroundColor: colors.border, marginVertical: 4 },
  howItWorksText: { flex: 1, color: colors.text, fontFamily: font.medium, fontSize: 13.5, lineHeight: 19, paddingBottom: space.lg, paddingTop: 6 },

  topBar: {
    position: 'absolute', top: space.lg, left: space.lg, right: space.lg,
    alignItems: 'center', gap: space.sm,
    backgroundColor: colors.surface, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border,
    padding: 6, ...shadow.floating
  },
  topBarIconButton: { width: 36, height: 36, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  topBarTextButton: { minWidth: 56, height: 36, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.md },
  statusPillWrap: { flex: 1, alignItems: 'center' },
  stopText: { color: colors.danger, fontFamily: font.bold, fontSize: 12.5 },

  locateButton: { position: 'absolute', bottom: space.xxl + 70, width: 44, height: 44, borderRadius: radius.pill, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...shadow.floating },

  emptyBanner: { position: 'absolute', left: space.lg, right: space.lg, bottom: space.xl },
  emptyBannerText: { color: colors.muted, fontFamily: font.medium, fontSize: 12.5, textAlign: 'center', lineHeight: 18 }
})
