import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, AppState, Image, Linking, Platform, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowClockwise, ArrowLeft, ArrowRight, BatteryWarning, CaretLeft, CaretRight, Clock, GasPump, GpsFix, Info, Lock, MapPin, Tire, Wrench } from 'phosphor-react-native'
import { useTranslation } from 'react-i18next'
import { directionsHref } from '../../lib/contactLinks'
import { getCurrentCoords, startBackgroundLocationUpdates, stopBackgroundLocationUpdates } from '../../lib/location'
import { syncPushRegistration } from '../../services/pushRegistration'
import { useNavigationApp } from '../../lib/navigationPreference'
import { formatElapsed } from '../../lib/time'
import { translateActionError } from '../../lib/rpcErrors'
import { supabase } from '../../lib/supabase'
import { buildAvailableUpsertPayload } from '../../lib/volunteerAvailability'
import type { NearbyRequest } from '../../lib/nearbyRequests'
import { useAndroidBackHandler } from '../../lib/useAndroidBackHandler'
import { dirStyles, useIsRTL } from '../../lib/direction'
import { radius, space, useSanadTheme } from '../../lib/theme'
import { useAppTypography } from '../../lib/typography'
import { useAuth, useMission } from '../../providers'
import { helperRepository } from '../../repositories/helperRepository'
import { requestRepository } from '../../repositories/requestRepository'
import { missionRepository } from '../../repositories/missionRepository'
import { queryKeys } from '../../services/queryKeys'
import type { ServiceType } from '../../types'
import { AppScreen, ScreenHeader } from '../../components/v2'
import { BottomSheet, Button, Card, IconButton, StatusBadge, Surface, useToast } from '../../components/ui'
import { NavigationAppIcon } from '../../components/NavigationAppIcon'
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

// Real SANAD Help Mode - availability is now fully automatic
// (0020_auto_volunteer_availability.sql): a volunteer is available whenever
// they don't have an active help request of their own, with no manual
// toggle. This screen only handles the client half of that - location and
// notification permissions, starting background tracking - which the
// database can't do on its own; the trigger owns flipping is_available
// off/on around the volunteer's own request lifecycle.
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
  const navigationApp = useNavigationApp()
  const { activeMission, isRequester } = useMission()
  const blockedByOwnRequest = !!activeMission && isRequester

  const [hydrated, setHydrated] = useState(false)
  const [available, setAvailable] = useState(false)
  const [enabling, setEnabling] = useState(false)
  const [enableError, setEnableError] = useState(false)
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null)
  const [requests, setRequests] = useState<NearbyRequest[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [listOpen, setListOpen] = useState(false)
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

  const enable = useCallback(async () => {
    setEnabling(true)
    setEnableError(false)
    try {
      const position = await getCurrentCoords()
      void syncPushRegistration(userId).catch(() => {})
      const { error } = await supabase.from('volunteer_profiles').upsert(buildAvailableUpsertPayload(userId, position, null))
      if (error) throw error
      setCoords(position)
      setAvailable(true)
      await loadRequests(position)
    } catch (cause: any) {
      setEnableError(true)
      toast.show(translateActionError(t, cause), 'error')
    } finally {
      setEnabling(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  // No manual toggle - the moment nothing blocks availability, turn it on
  // without waiting for a button press; the moment the user's own request
  // blocks it, turn it back off (stop background tracking client-side too -
  // the server-side is_available flip already happened via the trigger).
  useEffect(() => {
    if (!hydrated || enabling) return
    if (blockedByOwnRequest && available) {
      stopBackgroundLocationUpdates().catch(() => {})
      setAvailable(false)
      setRequests([])
      setSelectedId(null)
    } else if (!blockedByOwnRequest && !available && !enableError) {
      void enable()
    }
  }, [hydrated, blockedByOwnRequest, available, enabling, enableError, enable])

  useEffect(() => {
    if (!available || blockedByOwnRequest) return
    void startBackgroundLocationUpdates(userId, { title: t('volunteer.backgroundNotification.title'), body: t('volunteer.backgroundNotification.body') }).catch(() => {})
  }, [available, blockedByOwnRequest, userId, t])

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
  const closest = requests[0] ?? null

  if (!hydrated) {
    return (
      <AppScreen header={<ScreenHeader title={t('volunteer.title')} subtitle={t('volunteer.subtitle')} back onBack={() => router.back()} />}>
        <ActivityIndicator color={theme.colors.primary} />
      </AppScreen>
    )
  }

  if (blockedByOwnRequest) {
    return (
      <AppScreen header={<ScreenHeader title={t('volunteer.title')} subtitle={t('volunteer.subtitle')} back onBack={() => router.back()} />} contentStyle={styles.content}>
        <Card tone="community" title={t('volunteer.blocked.title')} subtitle={t('volunteer.blocked.text')}>
          <Button
            label={t('volunteer.blocked.viewRequest')}
            variant="community"
            onPress={() => activeMission && router.push({ pathname: '/mission/[missionId]', params: { missionId: activeMission.id } })}
          />
        </Card>
      </AppScreen>
    )
  }

  if (!available) {
    return (
      <AppScreen header={<ScreenHeader title={t('volunteer.title')} subtitle={t('volunteer.subtitle')} back onBack={() => router.back()} />} contentStyle={styles.content}>
        {enableError ? (
          <Card tone="community" title={t('volunteer.errors.enableFailedTitle')}>
            <Button label={t('common.retry')} variant="community" loading={enabling} onPress={enable} />
          </Card>
        ) : (
          <View style={styles.enablingWrap}>
            <ActivityIndicator color={theme.colors.primary} />
            <Text style={[typography.body, { color: theme.colors.textSecondary }]}>{t('volunteer.enabling')}</Text>
          </View>
        )}
      </AppScreen>
    )
  }

  const CaretIcon = isRTL ? CaretLeft : CaretRight

  return (
    <SafeAreaView style={[styles.fill, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        {/* The brand group (back button + logo) stays physically on the left
            and the status pill on the right regardless of language - a fixed
            brand layout, not a reading-direction row. Web's ambient
            dir="rtl" already mirrors a plain row for free, so it has to be
            explicitly counter-mirrored back with row-reverse; native never
            mirrors on its own. */}
        <View style={[styles.headerTopRow, { flexDirection: isRTL && Platform.OS === 'web' ? 'row-reverse' : 'row' }]}>
          <View style={[styles.brandGroup, { flexDirection: isRTL && Platform.OS === 'web' ? 'row-reverse' : 'row' }]}>
            <IconButton label={t('common.back')} size={38} icon={<BackIcon size={18} color={theme.colors.textPrimary} />} onPress={() => router.back()} />
            <Image source={require('../../../assets/images/icon.png')} style={styles.logo} resizeMode="contain" />
          </View>
          <StatusBadge tone="success" dot label={t('volunteer.availableNow')} />
        </View>
        <Text style={[typography.h1, { color: theme.colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{t('volunteer.title')}</Text>
        <Text style={[typography.small, { color: theme.colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{t('volunteer.subtitle')}</Text>
      </View>

      <View style={[styles.mapCard, { borderColor: theme.colors.border }]}>
        {coords ? (
          <>
            <SanadMap ref={mapRef} latitude={coords.latitude} longitude={coords.longitude} zoom={13} interactive markers={requestMarkers} selectedId={selectedId} onMarkerPress={setSelectedId} style={styles.mapFill} />
            <IconButton
              label={t('volunteer.title')}
              size={40}
              style={{ ...styles.locateButton, [isRTL ? 'left' : 'right']: space.md }}
              icon={<GpsFix size={18} color={theme.colors.primary} />}
              onPress={() => mapRef.current?.recenter(coords.latitude, coords.longitude, 13)}
            />
          </>
        ) : null}
      </View>

      <Surface elevation="floating" style={styles.bottomPanel}>
        <View style={[styles.bottomHeaderRow, dirStyles(isRTL).row]}>
          <Text style={[typography.h3, { color: theme.colors.textPrimary }]}>{t('volunteer.closest.title')}</Text>
          <Pressable onPress={() => setListOpen(true)} style={[styles.viewAllButton, dirStyles(isRTL).row]}>
            <Text style={[typography.smallMedium, { color: theme.colors.primary }]}>{t('volunteer.closest.viewAll')}</Text>
            <CaretIcon size={14} color={theme.colors.primary} />
          </Pressable>
        </View>

        {closest ? (
          <ClosestRequestCard request={closest} now={now} onView={() => setSelectedId(closest.id)} />
        ) : (
          <Text style={[typography.caption, { color: theme.colors.textSecondary, textAlign: 'center', paddingVertical: space.md }]}>{t('volunteer.emptyBanner')}</Text>
        )}

        <View style={[styles.noticeRow, dirStyles(isRTL).row, { backgroundColor: theme.colors.infoSoft }]}>
          <Info size={14} color={theme.colors.info} />
          <Text style={[typography.caption, { color: theme.colors.info, flex: 1, textAlign: isRTL ? 'right' : 'left' }]}>{t('volunteer.autoUnavailableNotice')}</Text>
        </View>

        <View style={[styles.footerRow, dirStyles(isRTL).row]}>
          <ArrowClockwise size={12} color={theme.colors.textMuted} />
          <Text style={[typography.caption, { color: theme.colors.textMuted }]}>{t('volunteer.autoUpdateNotice')}</Text>
        </View>
      </Surface>

      <BottomSheet visible={listOpen} onClose={() => setListOpen(false)} title={t('volunteer.allNearby.title')}>
        {requests.map(request => (
          <NearbyRequestListRow key={request.id} request={request} onPress={() => { setListOpen(false); setSelectedId(request.id) }} />
        ))}
      </BottomSheet>

      <BottomSheet visible={!!selectedRequest} onClose={() => setSelectedId(null)}>
        {selectedRequest ? (
          <>
            <StatusBadge tone="success" dot label={t('volunteer.sheet.newNearby')} />
            <View style={[styles.sheetTop, dirStyles(isRTL).row]}>
              <View style={[styles.sheetIcon, { backgroundColor: theme.colors.primarySoft }]}>
                {(() => { const Svc = serviceByKey[selectedRequest.service_type].Icon; return <Svc size={26} color={theme.colors.primary} weight="duotone" /> })()}
              </View>
              <Text style={[typography.h3, { color: theme.colors.textPrimary, flex: 1, textAlign: isRTL ? 'right' : 'left' }]}>{t(serviceByKey[selectedRequest.service_type].labelKey)}</Text>
            </View>
            <View style={[styles.tagsRow, dirStyles(isRTL).row]}>
              <View style={[styles.tag, { backgroundColor: theme.colors.primarySoft, ...dirStyles(isRTL).row }]}>
                <MapPin size={12} color={theme.colors.primary} weight="fill" />
                <Text style={[typography.caption, { color: theme.colors.primary }]}>{t('volunteer.distanceKm', { distance: selectedRequest.distance.toFixed(1) })}</Text>
              </View>
              <View style={[styles.tag, { backgroundColor: theme.colors.primarySoft, ...dirStyles(isRTL).row }]}>
                <Clock size={12} color={theme.colors.primary} weight="fill" />
                <Text style={[typography.caption, { color: theme.colors.primary }]}>{formatElapsed(now - new Date(selectedRequest.created_at).getTime(), t)}</Text>
              </View>
            </View>
            {selectedRequest.note ? <Text style={[typography.body, { color: theme.colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{selectedRequest.note}</Text> : null}
            {selectedRequest.photo_url ? <Image source={{ uri: selectedRequest.photo_url }} style={styles.sheetPhoto} /> : null}
            <View style={[styles.sheetActions, dirStyles(isRTL).row]}>
              <Pressable onPress={() => Linking.openURL(directionsHref(selectedRequest.latitude, selectedRequest.longitude, navigationApp))} style={[styles.mapButton, { backgroundColor: theme.colors.primarySoft, ...dirStyles(isRTL).row }]}>
                <NavigationAppIcon app={navigationApp} size={16} />
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

function ClosestRequestCard({ request, now, onView }: { request: NearbyRequest; now: number; onView: () => void }) {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const { t } = useTranslation()
  const Svc = serviceByKey[request.service_type].Icon
  const urgent = request.urgency === 'urgent' || request.urgency === 'emergency_redirected'
  return (
    <View style={styles.closestCard}>
      <View style={[styles.closestTopRow, dirStyles(isRTL).row]}>
        <View style={[styles.closestTitleGroup, dirStyles(isRTL).row]}>
          <View style={[styles.closestIcon, { backgroundColor: theme.colors.communitySoft }]}>
            <Svc size={20} color={theme.colors.community} weight="duotone" />
          </View>
          <Text style={[typography.bodyMedium, { color: theme.colors.textPrimary }]}>{t(serviceByKey[request.service_type].labelKey)}</Text>
        </View>
        {urgent ? <StatusBadge tone="danger" dot label={t('volunteer.urgent')} /> : null}
      </View>
      <View style={[styles.closestMetaRow, dirStyles(isRTL).row]}>
        <View style={[styles.closestMetaGroup, dirStyles(isRTL).row]}>
          <View style={[styles.closestMetaItem, dirStyles(isRTL).row]}>
            <MapPin size={13} color={theme.colors.textMuted} />
            <Text style={[typography.caption, { color: theme.colors.textMuted }]}>{t('volunteer.distanceKm', { distance: request.distance.toFixed(1) })}</Text>
          </View>
          <View style={[styles.closestMetaItem, dirStyles(isRTL).row]}>
            <Clock size={13} color={theme.colors.textMuted} />
            <Text style={[typography.caption, { color: theme.colors.textMuted }]}>{formatElapsed(now - new Date(request.created_at).getTime(), t)}</Text>
          </View>
          {request.location_label ? (
            <View style={[styles.closestMetaItem, dirStyles(isRTL).row]}>
              <MapPin size={13} color={theme.colors.textMuted} weight="fill" />
              <Text style={[typography.caption, { color: theme.colors.textMuted }]}>{request.location_label}</Text>
            </View>
          ) : null}
        </View>
        <Pressable onPress={onView} style={[styles.viewRequestButton, dirStyles(isRTL).row, { backgroundColor: theme.colors.primary }]}>
          <Text style={[typography.smallMedium, { color: theme.colors.onPrimary }]}>{t('volunteer.closest.viewRequest')}</Text>
          {isRTL ? <CaretLeft size={14} color={theme.colors.onPrimary} /> : <CaretRight size={14} color={theme.colors.onPrimary} />}
        </Pressable>
      </View>
    </View>
  )
}

function NearbyRequestListRow({ request, onPress }: { request: NearbyRequest; onPress: () => void }) {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const { t } = useTranslation()
  const Svc = serviceByKey[request.service_type].Icon
  const urgent = request.urgency === 'urgent' || request.urgency === 'emergency_redirected'
  return (
    <Pressable onPress={onPress} style={[styles.listRow, dirStyles(isRTL).row, { borderColor: theme.colors.border }]}>
      <View style={[styles.closestIcon, { backgroundColor: theme.colors.communitySoft }]}>
        <Svc size={18} color={theme.colors.community} weight="duotone" />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[typography.smallMedium, { color: theme.colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{t(serviceByKey[request.service_type].labelKey)}</Text>
        <Text style={[typography.caption, { color: theme.colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>{t('volunteer.distanceKm', { distance: request.distance.toFixed(1) })}</Text>
      </View>
      {urgent ? <StatusBadge tone="danger" dot label={t('volunteer.urgent')} /> : null}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { gap: space.xl },
  enablingWrap: { alignItems: 'center', gap: space.md, paddingVertical: space.xxl },

  header: { paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: space.sm, gap: 2 },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.sm },
  brandGroup: { alignItems: 'center', gap: space.sm },
  logo: { width: 32, height: 32 },

  mapCard: { flex: 1, marginHorizontal: space.lg, borderRadius: radius.lg, borderWidth: 1, overflow: 'hidden', position: 'relative' },
  mapFill: { flex: 1, marginTop: 0, borderRadius: 0, borderWidth: 0 },
  locateButton: { position: 'absolute', bottom: space.md },

  bottomPanel: { margin: space.lg, marginTop: space.md, gap: space.md, borderRadius: radius.lg },
  bottomHeaderRow: { alignItems: 'center', justifyContent: 'space-between' },
  viewAllButton: { alignItems: 'center', gap: 2 },

  closestCard: { gap: space.md },
  closestTopRow: { alignItems: 'center', justifyContent: 'space-between' },
  closestTitleGroup: { alignItems: 'center', gap: space.sm, flex: 1 },
  closestIcon: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  closestMetaRow: { alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: space.sm },
  closestMetaGroup: { alignItems: 'center', gap: space.md, flexWrap: 'wrap', flex: 1 },
  closestMetaItem: { alignItems: 'center', gap: 4 },
  viewRequestButton: { alignItems: 'center', gap: 4, borderRadius: radius.pill, paddingVertical: 8, paddingHorizontal: space.md },

  noticeRow: { alignItems: 'center', gap: space.sm, borderRadius: radius.md, padding: space.sm },
  footerRow: { alignItems: 'center', justifyContent: 'center', gap: 6 },

  listRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: space.sm, borderBottomWidth: StyleSheet.hairlineWidth },

  sheetTop: { alignItems: 'center', gap: space.md, marginTop: space.md },
  sheetIcon: { width: 52, height: 52, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  tagsRow: { gap: space.sm, marginTop: space.md, flexWrap: 'wrap' },
  tag: { alignItems: 'center', gap: 5, borderRadius: radius.pill, paddingVertical: 6, paddingHorizontal: space.md },
  sheetPhoto: { width: '100%', height: 150, borderRadius: radius.md, marginTop: space.md },
  sheetActions: { gap: space.sm, marginTop: space.lg },
  acceptButton: { flex: 1.6 },
  mapButton: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: radius.sm, minHeight: 54 }
})
