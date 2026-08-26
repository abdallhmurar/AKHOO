import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, AppState, Image, Linking, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ArrowRight, BatteryWarning, Clock, GasPump, GpsFix, HandHeart, Lock, MapPin, Star, Tire, Wrench } from 'phosphor-react-native'
import type { Icon } from 'phosphor-react-native'
import { useTranslation } from 'react-i18next'
import { getCurrentCoords, startBackgroundLocationUpdates, stopBackgroundLocationUpdates } from '../../lib/location'
import { registerForPushNotificationsAsync } from '../../lib/notifications'
import { formatElapsed } from '../../lib/time'
import { translateActionError } from '../../lib/rpcErrors'
import { supabase } from '../../lib/supabase'
import { buildAvailableUpsertPayload } from '../../lib/volunteerAvailability'
import type { NearbyRequest } from '../../lib/nearbyRequests'
import { useAndroidBackHandler } from '../../lib/useAndroidBackHandler'
import { useIsRTL } from '../../lib/direction'
import { radius, shadow, space, useSanadTheme } from '../../lib/theme'
import { useAppTypography } from '../../lib/typography'
import { useAuth } from '../../providers'
import { helperRepository } from '../../repositories/helperRepository'
import { requestRepository } from '../../repositories/requestRepository'
import { missionRepository } from '../../repositories/missionRepository'
import { queryKeys } from '../../services/queryKeys'
import type { ServiceType } from '../../types'
import { AppScreen, ScreenHeader, SectionHeading } from '../../components/v2'
import { BottomSheet, Button, Card, IconButton, StatusBadge, useToast } from '../../components/ui'
import { SanadMap } from '../../components/SanadMap'
import type { SanadMapRef } from '../../components/SanadMap.types'

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

// Real SANAD Help Mode - the same single-screen toggle+map+accept-sheet flow
// as the intact src/screens/VolunteerScreen.tsx, ported onto Expo Router and
// the Civic Signal component set. Not ccodex's invented skills/languages
// onboarding wizard: there is no helper "setup" in the real product, only an
// availability toggle.
export function HelperHomeScreen() {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const BackIcon = isRTL ? ArrowRight : ArrowLeft
  const { t } = useTranslation()
  const router = useRouter()
  const toast = useToast()
  const queryClient = useQueryClient()
  const { session } = useAuth()
  const userId = session!.user.id

  const [hydrated, setHydrated] = useState(false)
  const [available, setAvailable] = useState(false)
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null)
  const [requests, setRequests] = useState<NearbyRequest[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [accepting, setAccepting] = useState(false)
  const [now, setNow] = useState(Date.now())
  const mapRef = useRef<SanadMapRef>(null)

  useAndroidBackHandler(() => router.back())

  const loadRequests = useCallback(async (position?: { latitude: number; longitude: number } | null) => {
    const at = position ?? coords
    if (!at) return
    try {
      setRequests(await requestRepository.listNearby(userId, at))
    } catch (cause: any) {
      toast.show(translateActionError(t, cause), 'error')
    }
  }, [coords, userId, t, toast])

  useEffect(() => {
    let cancelled = false
    helperRepository.getProfile(userId).then(async profile => {
      if (cancelled) return
      if (profile?.is_available && profile.latitude != null && profile.longitude != null) {
        const position = { latitude: profile.latitude, longitude: profile.longitude }
        setCoords(position)
        setAvailable(true)
        await loadRequests(position)
      }
      if (!cancelled) setHydrated(true)
    })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  useEffect(() => {
    if (!available || !coords) return
    loadRequests(coords)
    return missionRepository.subscribeToOpenRequests(() => loadRequests(coords))
  }, [available, coords, loadRequests])

  useEffect(() => {
    if (!available || !coords) return
    const interval = setInterval(() => loadRequests(coords), NEARBY_POLL_MS)
    return () => clearInterval(interval)
  }, [available, coords, loadRequests])

  useEffect(() => {
    if (!available || !coords) return
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') loadRequests(coords) })
    return () => subscription.remove()
  }, [available, coords, loadRequests])

  useEffect(() => {
    if (!available) return
    const interval = setInterval(() => { void helperRepository.heartbeat(userId) }, HEARTBEAT_MS)
    return () => clearInterval(interval)
  }, [available, userId])

  useEffect(() => {
    if (!available) return
    const interval = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(interval)
  }, [available])

  useEffect(() => {
    if (!coords || requests.length === 0) return
    mapRef.current?.fitToMarkers([coords, ...requests.map(item => ({ latitude: item.latitude, longitude: item.longitude }))])
  }, [coords, requests])

  useEffect(() => {
    if (!selectedId) return
    if (!requests.some(item => item.id === selectedId)) {
      setSelectedId(null)
      toast.show(t('volunteer.errors.claimedMessage'), 'error')
    }
  }, [requests, selectedId, t, toast])

  async function toggleAvailability() {
    setLoading(true)
    try {
      if (!available) {
        const position = await getCurrentCoords()
        const pushToken = await registerForPushNotificationsAsync().catch(() => null)
        await supabase.from('volunteer_profiles').upsert(buildAvailableUpsertPayload(userId, position, pushToken))
        setCoords(position)
        setAvailable(true)
        await loadRequests(position)
        await startBackgroundLocationUpdates(userId, { title: t('volunteer.backgroundNotification.title'), body: t('volunteer.backgroundNotification.body') }).catch(() => {})
      } else {
        await stopBackgroundLocationUpdates().catch(() => {})
        await helperRepository.setAvailability(userId, false)
        setAvailable(false)
        setRequests([])
        setSelectedId(null)
      }
    } catch (cause: any) {
      toast.show(translateActionError(t, cause), 'error')
    } finally {
      setLoading(false)
    }
  }

  async function accept(request: NearbyRequest) {
    setAccepting(true)
    try {
      const mission = await missionRepository.accept(request.id)
      await queryClient.invalidateQueries({ queryKey: queryKeys.activeMission(userId) })
      router.replace({ pathname: '/mission/[missionId]', params: { missionId: mission.id } })
    } catch (cause: any) {
      setSelectedId(null)
      toast.show(translateActionError(t, cause), 'error')
      await loadRequests()
    } finally {
      setAccepting(false)
    }
  }

  const selectedRequest = requests.find(item => item.id === selectedId) ?? null
  const requestMarkers = useMemo(() => requests.map(item => ({ id: item.id, latitude: item.latitude, longitude: item.longitude })), [requests])

  if (!hydrated) {
    return (
      <AppScreen header={<ScreenHeader title={t('volunteer.title')} subtitle={t('volunteer.subtitle')} back onBack={() => router.back()} />}>
        <ActivityIndicator color={theme.colors.primary} />
      </AppScreen>
    )
  }

  if (!available) {
    return (
      <AppScreen header={<ScreenHeader title={t('volunteer.title')} subtitle={t('volunteer.subtitle')} back onBack={() => router.back()} />} contentStyle={styles.content}>
        <Card tone="community" title={t('volunteer.notAvailableTitle')} subtitle={t('volunteer.notAvailableText')}>
          <Button label={t('volunteer.enable')} variant="community" loading={loading} onPress={toggleAvailability} />
        </Card>
        <SectionHeading title={t('volunteer.howItWorks.title')} />
        <View style={styles.howItWorksList}>
          <HowItWorksRow index={1} Icon={MapPin} text={t('volunteer.howItWorks.mapItem')} last={false} />
          <HowItWorksRow index={2} Icon={HandHeart} text={t('volunteer.howItWorks.chooseItem')} last={false} />
          <HowItWorksRow index={3} Icon={Star} text={t('volunteer.howItWorks.starItem')} last />
        </View>
      </AppScreen>
    )
  }

  return (
    <SafeAreaView style={styles.fill}>
      {coords ? (
        <SanadMap ref={mapRef} latitude={coords.latitude} longitude={coords.longitude} zoom={13} interactive markers={requestMarkers} selectedId={selectedId} onMarkerPress={setSelectedId} style={styles.map} />
      ) : null}

      <View style={[styles.topBar, shadow.floating, { top: space.lg, backgroundColor: theme.colors.surface, borderColor: theme.colors.border, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <IconButton label={t('common.back')} size={36} icon={<BackIcon size={18} color={theme.colors.textPrimary} />} onPress={() => router.back()} />
        <View style={styles.statusPillWrap}>
          <StatusBadge tone="success" dot label={requests.length ? `${t('volunteer.availableNow')} · ${t('volunteer.nearbyCount', { count: requests.length })}` : t('volunteer.availableNow')} />
        </View>
        <Pressable onPress={toggleAvailability} style={styles.topBarTextButton}>
          {loading ? <ActivityIndicator color={theme.colors.danger} size="small" /> : <Text style={[typography.smallMedium, { color: theme.colors.danger }]}>{t('volunteer.disable')}</Text>}
        </Pressable>
      </View>

      {coords ? (
        <IconButton
          label={t('volunteer.title')}
          size={44}
          style={{ ...styles.locateButton, [isRTL ? 'left' : 'right']: space.lg }}
          icon={<GpsFix size={20} color={theme.colors.primary} />}
          onPress={() => mapRef.current?.recenter(coords.latitude, coords.longitude, 13)}
        />
      ) : null}

      {requests.length === 0 ? (
        <View style={[styles.emptyBanner, shadow.floating, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Text style={[typography.caption, { color: theme.colors.textSecondary, textAlign: 'center' }]}>{t('volunteer.emptyBanner')}</Text>
        </View>
      ) : null}

      <BottomSheet visible={!!selectedRequest} onClose={() => setSelectedId(null)}>
        {selectedRequest ? (
          <>
            <StatusBadge tone="success" dot label={t('volunteer.sheet.newNearby')} />
            <View style={[styles.sheetTop, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={[styles.sheetIcon, { backgroundColor: theme.colors.primarySoft }]}>
                {(() => { const Svc = serviceByKey[selectedRequest.service_type].Icon; return <Svc size={26} color={theme.colors.primary} weight="duotone" /> })()}
              </View>
              <Text style={[typography.h3, { color: theme.colors.textPrimary, flex: 1, textAlign: isRTL ? 'right' : 'left' }]}>{t(serviceByKey[selectedRequest.service_type].labelKey)}</Text>
            </View>
            <View style={[styles.tagsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={[styles.tag, { backgroundColor: theme.colors.primarySoft, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <MapPin size={12} color={theme.colors.primary} weight="fill" />
                <Text style={[typography.caption, { color: theme.colors.primary }]}>{t('volunteer.distanceKm', { distance: selectedRequest.distance.toFixed(1) })}</Text>
              </View>
              <View style={[styles.tag, { backgroundColor: theme.colors.primarySoft, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Clock size={12} color={theme.colors.primary} weight="fill" />
                <Text style={[typography.caption, { color: theme.colors.primary }]}>{formatElapsed(now - new Date(selectedRequest.created_at).getTime(), t)}</Text>
              </View>
            </View>
            {selectedRequest.note ? <Text style={[typography.body, { color: theme.colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{selectedRequest.note}</Text> : null}
            {selectedRequest.photo_url ? <Image source={{ uri: selectedRequest.photo_url }} style={styles.sheetPhoto} /> : null}
            <View style={[styles.sheetActions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Pressable onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${selectedRequest.latitude},${selectedRequest.longitude}`)} style={[styles.mapButton, { backgroundColor: theme.colors.primarySoft, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <MapPin size={16} color={theme.colors.primary} />
                <Text style={[typography.smallMedium, { color: theme.colors.primary }]}>{t('volunteer.openExternal')}</Text>
              </Pressable>
              <Button label={t('volunteer.accept')} variant="community" loading={accepting} onPress={() => accept(selectedRequest)} style={styles.acceptButton} />
            </View>
          </>
        ) : null}
      </BottomSheet>
    </SafeAreaView>
  )
}

function HowItWorksRow({ index, Icon, text, last }: { index: number; Icon: Icon; text: string; last: boolean }) {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  void index
  return (
    <View style={[styles.howItWorksRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
      <View style={styles.howItWorksRailCol}>
        <View style={[styles.howItWorksNode, { backgroundColor: theme.colors.communitySoft, borderColor: theme.colors.border }]}>
          <Icon size={16} color={theme.colors.community} weight="duotone" />
        </View>
        {!last ? <View style={[styles.howItWorksLine, { backgroundColor: theme.colors.border }]} /> : null}
      </View>
      <Text style={[typography.smallMedium, { color: theme.colors.textPrimary, flex: 1, textAlign: isRTL ? 'right' : 'left', paddingTop: 6, paddingBottom: space.lg }]}>{text}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  map: { flex: 1, marginTop: 0, borderRadius: 0, borderWidth: 0 },
  content: { gap: space.xl },

  howItWorksList: { gap: 0 },
  howItWorksRow: { gap: space.md },
  howItWorksRailCol: { alignItems: 'center', width: 36 },
  howItWorksNode: { width: 36, height: 36, borderRadius: radius.pill, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  howItWorksLine: { width: 2, flex: 1, minHeight: 20, marginVertical: 4 },

  topBar: { position: 'absolute', left: space.lg, right: space.lg, alignItems: 'center', gap: space.sm, borderRadius: radius.pill, borderWidth: 1, padding: 6 },
  statusPillWrap: { flex: 1, alignItems: 'center' },
  topBarTextButton: { minWidth: 56, height: 36, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.md },

  locateButton: { position: 'absolute', bottom: space.xxl + 70 },

  emptyBanner: { position: 'absolute', left: space.lg, right: space.lg, bottom: space.xl, borderRadius: radius.lg, borderWidth: 1, padding: space.md },

  sheetTop: { alignItems: 'center', gap: space.md, marginTop: space.md },
  sheetIcon: { width: 52, height: 52, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  tagsRow: { gap: space.sm, marginTop: space.md, flexWrap: 'wrap' },
  tag: { alignItems: 'center', gap: 5, borderRadius: radius.pill, paddingVertical: 6, paddingHorizontal: space.md },
  sheetPhoto: { width: '100%', height: 150, borderRadius: radius.md, marginTop: space.md },
  sheetActions: { gap: space.sm, marginTop: space.lg },
  acceptButton: { flex: 1.6 },
  mapButton: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: radius.sm, minHeight: 54 }
})
