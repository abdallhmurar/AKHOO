import { GuideTarget, useGuidePage, GuideScrollView } from '../guide/GuideProvider'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, AppState, Image, Linking, Platform, Pressable, SafeAreaView, useWindowDimensions, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ArrowRight, BatteryWarning, CaretLeft, CaretRight, Clock, GasPump, GpsFix, Lock, MapPin, Minus, Plus, Tire, Wrench } from 'phosphor-react-native'
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
import { Button, Card, IconButton, StatusBadge, Surface, useToast } from '../../components/ui'
import { HelperSheet } from './HelperSheet.web'
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

// Keep these presentation changes confined to the Vercel/web screen.
const webCopy = {
  ar: { details: 'تفاصيل الطلب', openMap: 'فتح بالخريطة', under100m: 'أقل من 100 م', meters: 'م' },
  en: { details: 'Request details', openMap: 'Open in maps', under100m: 'Under 100 m', meters: 'm' },
  he: { details: 'פרטי הבקשה', openMap: 'פתיחה במפה', under100m: 'פחות מ־100 מ׳', meters: 'מ׳' }
}

function useHelperCopy() {
  const { i18n } = useTranslation()
  const language = (i18n.resolvedLanguage ?? i18n.language).split('-')[0]
  return webCopy[language as keyof typeof webCopy] ?? webCopy.ar
}

function useRequestDistance(distance: number) {
  const { t } = useTranslation()
  const copy = useHelperCopy()
  if (distance < 0.1) return copy.under100m
  if (distance < 1) return `${Math.round(distance * 1000 / 10) * 10} ${copy.meters}`
  return t('volunteer.distanceKm', { distance: distance.toFixed(1) })
}

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
  const { height: windowHeight } = useWindowDimensions()
  const BackIcon = isRTL ? ArrowRight : ArrowLeft
  const { t } = useTranslation()
  const copy = useHelperCopy()
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
  const [requestsLoaded, setRequestsLoaded] = useState(false)
  const [requestsError, setRequestsError] = useState(false)
  const [requests, setRequests] = useState<NearbyRequest[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [listOpen, setListOpen] = useState(false)
  const [accepting, setAccepting] = useState(false)
  const [now, setNow] = useState(Date.now())
  useGuidePage('helper', hydrated && available && !blockedByOwnRequest && !listOpen && !selectedId)
  const mapRef = useRef<SanadMapRef>(null)

  useAndroidBackHandler(() => router.back())

  const loadRequests = useCallback(async (position?: { latitude: number; longitude: number } | null) => {
    const at = position ?? coords
    if (!at) return
    try {
      setRequests(await requestRepository.listNearby(userId, at))
      setRequestsError(false)
      setRequestsLoaded(true)
    } catch (cause: any) {
      setRequestsError(true)
      setRequestsLoaded(true)
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
      <GuideScrollView contentContainerStyle={styles.pageContent} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        {/* Keep the back control in its familiar physical position. */}
        <View style={[styles.headerTopRow, { flexDirection: isRTL && Platform.OS === 'web' ? 'row-reverse' : 'row' }]}>
          <IconButton label={t('common.back')} size={44} icon={<BackIcon size={21} color={theme.colors.textPrimary} />} onPress={() => router.back()} />
          <GuideTarget id="helper.availability"><StatusBadge tone="success" dot label={t('volunteer.availableNow')} /></GuideTarget>
        </View>
        <Text accessibilityRole="header" style={[typography.h1, styles.pageTitle, { color: theme.colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{t('volunteer.title')}</Text>
        <Text style={[typography.small, { color: theme.colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{t('volunteer.subtitle')}</Text>
      </View>

      <GuideTarget id="helper.map"><View style={[styles.mapCard, { height: Math.max(250, Math.min(400, windowHeight * 0.42)), borderColor: theme.colors.border }]}>
        {coords ? (
          <>
            <SanadMap ref={mapRef} latitude={coords.latitude} longitude={coords.longitude} zoom={13} interactive markers={requestMarkers} selectedId={selectedId} onMarkerPress={setSelectedId} style={styles.mapFill} />
            <View style={[styles.zoomControls, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, [isRTL ? 'left' : 'right']: space.md }]}>
              <IconButton size={44} label={t('volunteer.mapControls.zoomIn')} icon={<Plus size={22} color={theme.colors.textPrimary} />} onPress={() => mapRef.current?.zoomBy(1)} />
              <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: theme.colors.border }} />
              <IconButton size={44} label={t('volunteer.mapControls.zoomOut')} icon={<Minus size={22} color={theme.colors.textPrimary} />} onPress={() => mapRef.current?.zoomBy(-1)} />
            </View>
            <IconButton
              label={t('volunteer.mapControls.locate')}
              size={48}
              style={{ ...styles.locateButton, [isRTL ? 'left' : 'right']: space.md }}
              icon={<GpsFix size={18} color={theme.colors.primary} />}
              onPress={() => mapRef.current?.recenter(coords.latitude, coords.longitude, 13)}
            />
          </>
        ) : null}
      </View></GuideTarget>

      <GuideTarget id="helper.nearby"><Surface elevation="soft" style={styles.bottomPanel}>
        <View style={[styles.bottomHeaderRow, dirStyles(isRTL).row]}>
          <Text accessibilityRole="header" style={[typography.h3, { color: theme.colors.textPrimary, flex: 1, textAlign: isRTL ? 'right' : 'left' }]}>{t('volunteer.closest.title')}</Text>
          {requests.length > 1 ? <Pressable accessibilityRole="button" onPress={() => setListOpen(true)} style={[styles.viewAllButton, dirStyles(isRTL).row]}>
            <Text style={[typography.smallMedium, { color: theme.colors.primary }]}>{t('volunteer.closest.viewAll')} ({requests.length})</Text>
            <CaretIcon size={14} color={theme.colors.primary} />
          </Pressable> : null}
        </View>

        {requestsError ? <Button label={t('perks.retry')} variant="outline" onPress={() => void loadRequests()} /> : !requestsLoaded ? <ActivityIndicator accessibilityLabel={t('common.loading')} color={theme.colors.primary} /> : closest ? (
          <ClosestRequestCard request={closest} now={now} onView={() => setSelectedId(closest.id)} />
        ) : (
          <View style={styles.emptyState}>
            <View accessible={false} style={[styles.emptyIllustration, { backgroundColor: theme.colors.primarySoft }]}>
              <View style={[styles.emptyRipple, { borderColor: theme.colors.primary }]} />
              <MapPin size={48} color={theme.colors.primary} weight="fill" />
            </View>
            <Text style={[typography.h3, { color: theme.colors.textPrimary, textAlign: 'center' }]}>{t('volunteer.emptyState.title')}</Text>
            <Text style={[typography.small, { color: theme.colors.textSecondary, textAlign: 'center' }]}>{t('volunteer.emptyState.message')}</Text>
          </View>
        )}
      </Surface></GuideTarget>
      </GuideScrollView>

      <HelperSheet visible={listOpen} onClose={() => setListOpen(false)} title={t('volunteer.allNearby.title')}>
        {requests.length === 0 ? <Text style={[typography.body, { color: theme.colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{t(requestsError ? 'perks.retry' : 'volunteer.emptyState.title')}</Text> : null}
        {requests.map(request => (
          <NearbyRequestListRow key={request.id} request={request} onPress={() => { setListOpen(false); setSelectedId(request.id) }} />
        ))}
      </HelperSheet>

      <HelperSheet
        visible={!!selectedRequest}
        onClose={() => setSelectedId(null)}
        title={copy.details}
        dismissible={!accepting}
        footer={selectedRequest ? (
          <>
            <Button label={t('volunteer.accept')} variant="community" loading={accepting} onPress={() => accept(selectedRequest)} />
            <Button
              label={copy.openMap}
              variant="ghost"
              disabled={accepting}
              leading={<NavigationAppIcon app={navigationApp} size={18} />}
              onPress={() => Linking.openURL(directionsHref(selectedRequest.latitude, selectedRequest.longitude, navigationApp))}
            />
          </>
        ) : undefined}
      >
        {selectedRequest ? (
          <>
            <RequestSummary request={selectedRequest} now={now} />
            {selectedRequest.note ? <Text style={[typography.body, { color: theme.colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{selectedRequest.note}</Text> : null}
            {selectedRequest.photo_url ? <Image source={{ uri: selectedRequest.photo_url }} style={styles.sheetPhoto} resizeMode="contain" /> : null}
          </>
        ) : null}
      </HelperSheet>
    </SafeAreaView>
  )
}

function ClosestRequestCard({ request, now, onView }: { request: NearbyRequest; now: number; onView: () => void }) {
  const { t } = useTranslation()
  const theme = useSanadTheme()
  const isRTL = useIsRTL()
  const CaretIcon = isRTL ? CaretLeft : CaretRight
  return (
    <View style={styles.closestCard}>
      <RequestSummary request={request} now={now} />
      <Button label={t('volunteer.closest.viewRequest')} onPress={onView} trailing={<CaretIcon size={17} color={theme.colors.onPrimary} />} />
    </View>
  )
}

function RequestSummary({ request, now }: { request: NearbyRequest; now: number }) {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const { t } = useTranslation()
  const distance = useRequestDistance(request.distance)
  const Svc = serviceByKey[request.service_type].Icon
  const urgent = request.urgency === 'urgent' || request.urgency === 'emergency_redirected'
  return (
    <View style={styles.closestCard}>
      <View style={[styles.closestTopRow, dirStyles(isRTL).row]}>
        <View style={[styles.closestTitleGroup, dirStyles(isRTL).row]}>
          <View style={[styles.closestIcon, { backgroundColor: theme.colors.communitySoft }]}>
            <Svc size={25} color={theme.colors.community} weight="duotone" />
          </View>
          <Text style={[typography.h2, { color: theme.colors.textPrimary, flexShrink: 1, textAlign: isRTL ? 'right' : 'left' }]}>{t(serviceByKey[request.service_type].labelKey)}</Text>
        </View>
        {urgent ? <StatusBadge tone="danger" dot label={t('volunteer.urgent')} /> : null}
      </View>
      <View style={[styles.closestMetaGroup, dirStyles(isRTL).row, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.closestMetaItem, dirStyles(isRTL).row]}>
          <MapPin size={16} color={theme.colors.textSecondary} />
          <Text style={[typography.small, { color: theme.colors.textSecondary, flexShrink: 1 }]}>{distance}</Text>
        </View>
        <View style={[styles.closestMetaItem, dirStyles(isRTL).row]}>
          <Clock size={16} color={theme.colors.textSecondary} />
          <Text style={[typography.small, { color: theme.colors.textSecondary, flexShrink: 1 }]}>{formatElapsed(now - new Date(request.created_at).getTime(), t)}</Text>
        </View>
      </View>
      {request.location_label ? (
        <View style={[styles.closestMetaItem, dirStyles(isRTL).row]}>
          <MapPin size={16} color={theme.colors.textSecondary} />
          <Text style={[typography.small, { color: theme.colors.textSecondary, flex: 1, textAlign: isRTL ? 'right' : 'left' }]}>{request.location_label}</Text>
        </View>
      ) : null}
    </View>
  )
}

function NearbyRequestListRow({ request, onPress }: { request: NearbyRequest; onPress: () => void }) {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const { t } = useTranslation()
  const distance = useRequestDistance(request.distance)
  const Svc = serviceByKey[request.service_type].Icon
  const urgent = request.urgency === 'urgent' || request.urgency === 'emergency_redirected'
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.listRow, dirStyles(isRTL).row, { borderColor: theme.colors.border, opacity: pressed ? 0.7 : 1 }]}>
      <View style={[styles.closestIcon, { backgroundColor: theme.colors.communitySoft }]}>
        <Svc size={18} color={theme.colors.community} weight="duotone" />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[typography.bodyMedium, { color: theme.colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{t(serviceByKey[request.service_type].labelKey)}</Text>
        <Text style={[typography.small, { color: theme.colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{distance}</Text>
      </View>
      {urgent ? <StatusBadge tone="danger" dot label={t('volunteer.urgent')} /> : null}
      {isRTL ? <CaretLeft size={18} color={theme.colors.textMuted} /> : <CaretRight size={18} color={theme.colors.textMuted} />}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { gap: space.xl },
  enablingWrap: { alignItems: 'center', gap: space.md, paddingVertical: space.xxl },

  pageContent: { width: '100%', maxWidth: 620, alignSelf: 'center', paddingBottom: space.lg },
  pageTitle: { fontSize: 26, lineHeight: 36 },
  header: { paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: space.lg, gap: 4 },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },

  mapCard: { marginHorizontal: space.lg, borderRadius: radius.lg, borderWidth: 1, overflow: 'hidden', position: 'relative' },
  mapFill: { flex: 1, marginTop: 0, borderRadius: 0, borderWidth: 0 },
  zoomControls: { position: 'absolute', top: space.md, borderRadius: radius.md, borderWidth: 1, overflow: 'hidden' },
  locateButton: { position: 'absolute', bottom: 36 },

  bottomPanel: { margin: space.lg, marginTop: space.lg, gap: space.lg, borderRadius: radius.xl },
  bottomHeaderRow: { alignItems: 'center', justifyContent: 'space-between', gap: space.md },
  viewAllButton: { alignItems: 'center', gap: 2, minHeight: 44 },
  emptyState: { alignItems: 'center', gap: space.sm, paddingVertical: space.md },
  emptyIllustration: { width: 88, height: 70, borderRadius: 44, alignItems: 'center', justifyContent: 'center' },
  emptyRipple: { position: 'absolute', bottom: 6, width: 52, height: 18, borderRadius: 26, borderWidth: 2, opacity: 0.25 },

  closestCard: { gap: space.lg },
  closestTopRow: { alignItems: 'center', justifyContent: 'space-between', gap: space.sm, flexWrap: 'wrap' },
  closestTitleGroup: { alignItems: 'center', gap: space.md, flex: 1, minWidth: 120 },
  closestIcon: { width: 48, height: 48, flexShrink: 0, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  closestMetaGroup: { alignItems: 'center', gap: space.lg, flexWrap: 'wrap', padding: space.md, borderRadius: radius.md },
  closestMetaItem: { alignItems: 'center', gap: 6, maxWidth: '100%' },
  listRow: { alignItems: 'center', gap: space.md, paddingVertical: space.md, borderBottomWidth: StyleSheet.hairlineWidth },
  sheetPhoto: { width: '100%', height: 200, borderRadius: radius.md }
})
