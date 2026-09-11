import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { ArrowClockwise, ArrowRight, BatteryWarning, CheckCircle, GasPump, HandHeart, Images, MapPin, Pencil, Plus, Tire, Warning, Wrench } from 'phosphor-react-native'
import { useTranslation } from 'react-i18next'
import { getActivePilotZones, getCurrentCoords, isWithinAnyZone } from '../../lib/location'
import type { PilotZone } from '../../lib/location'
import { searchAddress, reverseGeocode } from '../../lib/geocoding'
import type { GeocodeResult } from '../../lib/geocoding'
import { MAP_FALLBACK_CENTER } from '../../lib/mapProvider'
import { resolveRequestHelpBack } from '../../lib/backNavigation'
import type { RequestHelpStep } from '../../lib/backNavigation'
import { translateActionError } from '../../lib/rpcErrors'
import { supabase } from '../../lib/supabase'
import { dirStyles, useIsRTL } from '../../lib/direction'
import { radius, shadow, space, useSanadTheme } from '../../lib/theme'
import { useAppTypography } from '../../lib/typography'
import { useAuth } from '../../providers'
import { AppScreen, MapPanel, ScreenHeader } from '../../components/v2'
import { Button, TextArea, TextField } from '../../components/ui'
import type { ServiceType } from '../../types'

type Locale = 'ar' | 'he' | 'en'

// Every service now has its own title/description baked into the image per
// language (a wide illustrated banner, not just an icon), so each needs its
// own per-locale require map. Metro needs static string literals to resolve
// requires, same reason WelcomeScreen/LaunchScreen require each language's
// video separately.
const SERVICES: { key: ServiceType; byLocale: Record<Locale, number> }[] = [
  {
    key: 'battery',
    byLocale: {
      ar: require('../../../assets/images/service-battery-ar.png'),
      he: require('../../../assets/images/service-battery-he.png'),
      en: require('../../../assets/images/service-battery-en.png')
    }
  },
  {
    key: 'fuel',
    byLocale: {
      ar: require('../../../assets/images/service-fuel-ar.png'),
      he: require('../../../assets/images/service-fuel-he.png'),
      en: require('../../../assets/images/service-fuel-en.png')
    }
  },
  {
    key: 'other',
    byLocale: {
      ar: require('../../../assets/images/service-other-ar.png'),
      he: require('../../../assets/images/service-other-he.png'),
      en: require('../../../assets/images/service-other-en.png')
    }
  },
  {
    key: 'tire',
    byLocale: {
      ar: require('../../../assets/images/service-tire-ar.png'),
      he: require('../../../assets/images/service-tire-he.png'),
      en: require('../../../assets/images/service-tire-en.png')
    }
  }
]

// Small icon + label shown in the details step's "selected problem" summary
// card - distinct from the big per-locale banners used for selection itself.
const SERVICE_SUMMARY: Partial<Record<ServiceType, { labelKey: string; Icon: typeof Tire }>> = {
  battery: { labelKey: 'request.battery', Icon: BatteryWarning },
  fuel: { labelKey: 'request.fuel', Icon: GasPump },
  other: { labelKey: 'request.other', Icon: Wrench },
  tire: { labelKey: 'request.tire', Icon: Tire }
}

// Safety-tip banner shown at the end of the location step, same per-locale
// baked-in-text illustration pattern as the service banners above.
const LOCATION_BANNER_BY_LOCALE: Record<Locale, number> = {
  ar: require('../../../assets/images/service-location-ar.png'),
  he: require('../../../assets/images/service-location-he.png'),
  en: require('../../../assets/images/service-location-en.png')
}

const STEPS: RequestHelpStep[] = ['type', 'details', 'location']
const MAX_IMAGE_BYTES = 10 * 1024 * 1024

// Real SANAD Request Help flow - the same 3-step type/details/location
// sequence as the intact src/screens/RequestHelpScreen.tsx, ported onto
// Expo Router + the Civic Signal component set as a single route instead of
// ccodex's 9-screen wizard. Only these 5 service types are real (confirmed
// against the shipped UI); there is no "civic category" taxonomy.
export function RequestFlowScreen() {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const { t, i18n } = useTranslation()
  const locale: Locale = i18n.language.startsWith('he') ? 'he' : i18n.language.startsWith('en') ? 'en' : 'ar'
  const router = useRouter()
  const { session } = useAuth()
  const userId = session!.user.id

  const [step, setStep] = useState<RequestHelpStep>('type')
  const [service, setService] = useState<ServiceType | null>(null)
  const [note, setNote] = useState('')
  const [photoUri, setPhotoUri] = useState<string | null>(null)
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null)
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [pilotZones, setPilotZones] = useState<PilotZone[]>([])

  // A manually-picked location takes over from the GPS-detected one -
  // they're mutually exclusive, never merged, so submit() and the pilot
  // zone check only ever need to look at one point: activeCoords.
  const [manualLocation, setManualLocation] = useState<{ latitude: number; longitude: number; address: string | null } | null>(null)
  const [locationAddress, setLocationAddress] = useState<string | null>(null)
  const [resolvingAddress, setResolvingAddress] = useState(false)

  const [manualLocationOpen, setManualLocationOpen] = useState(false)
  const [pickerPoint, setPickerPoint] = useState<{ latitude: number; longitude: number } | null>(null)
  const [pickerAddress, setPickerAddress] = useState<string | null>(null)
  const [pickerResolvingAddress, setPickerResolvingAddress] = useState(false)
  const [pickerQuery, setPickerQuery] = useState('')
  const [pickerResults, setPickerResults] = useState<GeocodeResult[]>([])
  const [pickerSearching, setPickerSearching] = useState(false)

  const stepIndex = STEPS.indexOf(step)
  const activeCoords = manualLocation ?? coords
  const outsideZone = !!activeCoords && pilotZones.length > 0 && !isWithinAnyZone(activeCoords.latitude, activeCoords.longitude, pilotZones)
  const selectedSummary = service ? SERVICE_SUMMARY[service] : undefined

  useEffect(() => { getActivePilotZones().then(setPilotZones).catch(() => {}) }, [])

  useEffect(() => {
    if (!activeCoords) { setLocationAddress(null); return }
    if (manualLocation?.address) { setLocationAddress(manualLocation.address); return }
    let cancelled = false
    setResolvingAddress(true)
    reverseGeocode(activeCoords.latitude, activeCoords.longitude).then(address => {
      if (!cancelled) { setLocationAddress(address); setResolvingAddress(false) }
    })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCoords?.latitude, activeCoords?.longitude, manualLocation?.address])

  useEffect(() => {
    if (!manualLocationOpen) return
    const query = pickerQuery.trim()
    if (query.length < 3) { setPickerResults([]); return }
    const controller = new AbortController()
    const timeout = setTimeout(() => {
      setPickerSearching(true)
      searchAddress(query, controller.signal)
        .then(setPickerResults)
        .catch(() => {})
        .finally(() => setPickerSearching(false))
    }, 500)
    return () => { clearTimeout(timeout); controller.abort() }
  }, [pickerQuery, manualLocationOpen])

  async function fetchLocation() {
    setLocating(true)
    setLocationError(null)
    setManualLocation(null)
    try {
      setCoords(await getCurrentCoords())
    } catch (error: any) {
      setLocationError(error.message === 'LOCATION_PERMISSION_DENIED' ? t('request.errors.locationFailed') : (error.message ?? t('request.errors.locationFailed')))
    } finally {
      setLocating(false)
    }
  }

  function openManualLocationPicker() {
    const seed = manualLocation ?? activeCoords ?? MAP_FALLBACK_CENTER
    setPickerPoint(seed)
    setPickerAddress(manualLocation?.address ?? locationAddress)
    setPickerQuery('')
    setPickerResults([])
    setManualLocationOpen(true)
  }

  async function handlePickerMapPress(point: { latitude: number; longitude: number }) {
    setPickerPoint(point)
    setPickerAddress(null)
    setPickerResolvingAddress(true)
    const address = await reverseGeocode(point.latitude, point.longitude)
    setPickerAddress(address)
    setPickerResolvingAddress(false)
  }

  function selectSearchResult(result: GeocodeResult) {
    setPickerPoint({ latitude: result.latitude, longitude: result.longitude })
    setPickerAddress(result.label)
    setPickerQuery(result.label)
    setPickerResults([])
  }

  function confirmManualLocation() {
    if (!pickerPoint) return
    setManualLocation({ ...pickerPoint, address: pickerAddress })
    setManualLocationOpen(false)
  }

  function goToStep(next: RequestHelpStep) {
    if (next === 'location' && !coords && !locating) fetchLocation()
    setStep(next)
  }

  async function pickPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (permission.status !== 'granted') {
      Alert.alert(t('auth.signup.permissionPhotos.title'), t('auth.signup.permissionPhotos.message'))
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6 })
    if (result.canceled || !result.assets[0]) return
    const asset = result.assets[0]
    if (asset.fileSize && asset.fileSize > MAX_IMAGE_BYTES) {
      Alert.alert(t('common.error'), t('account.errors.imageTooLarge'))
      return
    }
    setPhotoUri(asset.uri)
  }

  function selectService(key: ServiceType) {
    setService(key)
    setTimeout(() => goToStep('details'), 180)
  }

  function next() {
    if (step === 'type') {
      if (!service) { Alert.alert(t('request.errors.selectType'), t('request.errors.selectTypeMessage')); return }
      goToStep('details')
    } else if (step === 'details') {
      goToStep('location')
    }
  }

  function back() {
    const target = resolveRequestHelpBack(step)
    if (target.kind === 'home') router.back()
    else setStep(target.step)
  }

  async function submit() {
    if (!service || !activeCoords || outsideZone) return
    setLoading(true)
    try {
      let photoUrl: string | null = null
      if (photoUri) {
        const response = await fetch(photoUri)
        const blob = await response.blob()
        const path = `${userId}/${Date.now()}.jpg`
        const { error: uploadError } = await supabase.storage.from('request-photos').upload(path, blob, { contentType: 'image/jpeg' })
        if (uploadError) throw uploadError
        photoUrl = supabase.storage.from('request-photos').getPublicUrl(path).data.publicUrl
      }
      const { data, error } = await supabase.from('help_requests').insert({
        requester_id: userId,
        service_type: service,
        note: note.trim() || null,
        latitude: activeCoords.latitude,
        longitude: activeCoords.longitude,
        photo_url: photoUrl
      }).select('id').single()
      if (error) throw error
      router.replace({ pathname: '/mission/[missionId]', params: { missionId: data.id as string } })
    } catch (error: any) {
      Alert.alert(t('request.errors.createFailedTitle'), translateActionError(t, error))
    } finally {
      setLoading(false)
    }
  }

  function renderServiceBanner(item: { key: ServiceType; byLocale: Record<Locale, number> }) {
    const selected = service === item.key
    return (
      <Pressable
        key={item.key}
        onPress={() => selectService(item.key)}
        style={[styles.serviceBanner, { borderColor: selected ? theme.colors.primary : theme.colors.border, borderWidth: selected ? 2 : 1 }]}
      >
        <Image source={item.byLocale[locale]} style={styles.serviceBannerImage} resizeMode="cover" />
      </Pressable>
    )
  }

  function renderStepCircles() {
    const current = stepIndex + 1
    const nodes = []
    for (let n = 1; n <= STEPS.length; n++) {
      if (n > 1) {
        nodes.push(<View key={`line-${n}`} style={[styles.stepLine, { backgroundColor: current >= n ? theme.colors.primary : theme.colors.border }]} />)
      }
      const isCurrent = current === n
      nodes.push(
        <View key={`circle-${n}`} style={[styles.stepCircle, { backgroundColor: isCurrent ? theme.colors.primary : theme.colors.surface, borderColor: isCurrent ? theme.colors.primary : theme.colors.border }]}>
          <Text style={[typography.smallMedium, { color: isCurrent ? theme.colors.onPrimary : theme.colors.textMuted }]}>{n}</Text>
        </View>
      )
    }
    return nodes
  }

  if (manualLocationOpen) {
    return (
      <AppScreen
        header={<ScreenHeader title={t('request.location.addManualButton')} back onBack={() => setManualLocationOpen(false)} />}
        footer={<Button label={t('request.location.confirmButton')} onPress={confirmManualLocation} disabled={!pickerPoint} />}
      >
        <TextField
          value={pickerQuery}
          onChangeText={setPickerQuery}
          placeholder={t('request.location.searchPlaceholder')}
          autoFocus
        />
        {pickerSearching ? (
          <ActivityIndicator color={theme.colors.primary} />
        ) : pickerResults.length > 0 ? (
          <View style={[styles.searchResultsList, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            {pickerResults.map((result, index) => (
              <Pressable
                key={`${result.latitude},${result.longitude}`}
                onPress={() => selectSearchResult(result)}
                style={[styles.searchResultRow, dirStyles(isRTL).row, index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.border }]}
              >
                <MapPin size={16} color={theme.colors.textMuted} />
                <Text numberOfLines={2} style={[typography.small, styles.searchResultLabel, { color: theme.colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{result.label}</Text>
              </Pressable>
            ))}
          </View>
        ) : pickerQuery.trim().length >= 3 ? (
          <Text style={[typography.small, { color: theme.colors.textMuted, textAlign: 'center' }]}>{t('request.location.noResults')}</Text>
        ) : null}

        {pickerPoint ? (
          <MapPanel latitude={pickerPoint.latitude} longitude={pickerPoint.longitude} height={280} interactive overlay={null} onMapPress={handlePickerMapPress} />
        ) : null}
        <Text style={[typography.caption, { color: theme.colors.textMuted, textAlign: 'center' }]}>{t('request.location.tapMapHint')}</Text>
        <Text style={[typography.smallMedium, { color: theme.colors.textPrimary, textAlign: 'center' }]}>
          {pickerResolvingAddress ? t('request.location.resolvingAddress') : pickerAddress}
        </Text>
      </AppScreen>
    )
  }

  return (
    <AppScreen
      header={<ScreenHeader title="" back onBack={back} />}
      footer={step === 'location'
        ? <Button label={t('request.submit')} onPress={submit} loading={loading} disabled={!activeCoords || outsideZone} />
        : step === 'details'
          ? <Button label={t('common.next')} trailing={<ArrowRight size={18} color={theme.colors.onPrimary} weight="bold" />} onPress={next} />
          : <Button label={t('common.next')} onPress={next} />}
    >
      {step === 'type' ? (
        <>
          <Text style={[typography.h1, styles.typeHeading, { color: theme.colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{t('request.step.type.subtitle')}</Text>
          <View style={styles.list}>
            {SERVICES.map(item => renderServiceBanner(item))}
          </View>
        </>
      ) : null}

      {step === 'details' ? (
        <View style={styles.detailsGroup}>
          <View style={styles.detailsBadgeWrap}>
            <View style={[styles.detailsBadge, dirStyles(isRTL).row, { backgroundColor: theme.colors.primarySoft }]}>
              <Text style={[typography.caption, { color: theme.colors.primary }]}>{t('request.step.details.badge')}</Text>
              <HandHeart size={14} color={theme.colors.primary} weight="fill" />
            </View>
          </View>
          <Text style={[typography.h1, { color: theme.colors.textPrimary, textAlign: 'center' }]}>{t('request.step.details.title')}</Text>
          <Text style={[typography.body, { color: theme.colors.textSecondary, textAlign: 'center' }]}>{t('request.step.details.subtitle')}</Text>

          <View style={[styles.stepCirclesRow, dirStyles(isRTL).row]}>{renderStepCircles()}</View>
          <Text style={[typography.small, styles.stepOfText, { color: theme.colors.textSecondary, textAlign: 'center' }]}>
            {t('request.step.details.stepOf', { current: stepIndex + 1, total: STEPS.length })}
          </Text>

          {selectedSummary ? (
            <View style={[styles.summaryCard, dirStyles(isRTL).row, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <View style={[styles.summaryIconCircle, { backgroundColor: theme.colors.primarySoft }]}>
                <selectedSummary.Icon size={26} color={theme.colors.primary} weight="duotone" />
              </View>
              <View style={styles.summaryTextWrap}>
                <Text style={[typography.caption, { color: theme.colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{t('request.step.details.selectedProblem')}</Text>
                <Text style={[typography.h3, { color: theme.colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{t(selectedSummary.labelKey)}</Text>
              </View>
            </View>
          ) : null}

          <View style={[styles.noteCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={[styles.noteLabelRow, dirStyles(isRTL).row]}>
              <Text style={[typography.smallMedium, { color: theme.colors.textPrimary }]}>{t('request.noteLabel')}</Text>
              <Pencil size={16} color={theme.colors.textMuted} />
            </View>
            <TextArea value={note} onChangeText={setNote} placeholder={t('request.notePlaceholder')} maxLength={500} />
            <Text style={[typography.caption, styles.charCounter, { color: theme.colors.textMuted, alignSelf: isRTL ? 'flex-start' : 'flex-end' }]}>{note.length}/500</Text>
          </View>

          <Pressable onPress={pickPhoto} style={[styles.photoPicker, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
            {photoUri ? <Image source={{ uri: photoUri }} style={styles.photoPreview} /> : (
              <View style={styles.photoPlaceholder}>
                <View style={styles.photoIconWrap}>
                  <Images size={26} color={theme.colors.primary} weight="duotone" />
                  <View style={[styles.photoPlusBadge, { backgroundColor: theme.colors.primary, borderColor: theme.colors.surface }]}>
                    <Plus size={10} color={theme.colors.onPrimary} weight="bold" />
                  </View>
                </View>
                <Text style={[typography.bodyMedium, { color: theme.colors.textPrimary }]}>{t('request.step.details.addPhotoTitle')}</Text>
                <Text style={[typography.small, styles.photoSubtitle, { color: theme.colors.textMuted }]}>{t('request.step.details.addPhotoSubtitle')}</Text>
              </View>
            )}
          </Pressable>
        </View>
      ) : null}

      {step === 'location' ? (
        <View style={styles.detailsGroup}>
          <Text style={[typography.h1, { color: theme.colors.textPrimary, textAlign: 'center' }]}>{t('request.step.location.title')}</Text>
          <Text style={[typography.body, { color: theme.colors.textSecondary, textAlign: 'center' }]}>{t('request.step.location.subtitle')}</Text>

          <View style={[styles.stepCirclesRow, dirStyles(isRTL).row]}>{renderStepCircles()}</View>
          <Text style={[typography.small, styles.stepOfText, { color: theme.colors.textSecondary, textAlign: 'center' }]}>
            {t('request.step.details.stepOf', { current: stepIndex + 1, total: STEPS.length })}
          </Text>

          {locating ? (
            <View style={styles.locationState}>
              <ActivityIndicator color={theme.colors.primary} />
              <Text style={[typography.small, { color: theme.colors.textSecondary }]}>{t('request.locating')}</Text>
            </View>
          ) : locationError ? (
            <View style={styles.locationState}>
              <Text style={[typography.smallMedium, { color: theme.colors.danger, textAlign: 'center' }]}>{locationError}</Text>
              <Button label={t('request.retryLocation')} variant="outline" onPress={fetchLocation} />
            </View>
          ) : activeCoords && outsideZone ? (
            <View style={styles.locationState}>
              <Warning size={32} color={theme.colors.reward} weight="fill" />
              <Text style={[typography.h3, { color: theme.colors.textPrimary, textAlign: 'center' }]}>{t('request.pilotZone.title')}</Text>
              <Text style={[typography.small, { color: theme.colors.textSecondary, textAlign: 'center' }]}>{t('request.pilotZone.message')}</Text>
              <Button label={t('request.retryLocation')} variant="outline" onPress={fetchLocation} />
            </View>
          ) : activeCoords ? (
            <>
              <MapPanel latitude={activeCoords.latitude} longitude={activeCoords.longitude} height={260} overlay={null} />

              <View style={[styles.summaryCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                <View style={[styles.noteLabelRow, dirStyles(isRTL).row]}>
                  <Text style={[typography.smallMedium, { color: theme.colors.textPrimary }]}>{t('request.location.selectedLabel')}</Text>
                  <MapPin size={16} color={theme.colors.textMuted} />
                </View>
                <View style={[styles.noteLabelRow, dirStyles(isRTL).row]}>
                  <Text style={[typography.h3, { color: theme.colors.textPrimary }]}>{manualLocation ? t('request.location.manualValue') : t('request.currentLocation')}</Text>
                  <CheckCircle size={18} color={theme.colors.community} weight="fill" />
                </View>
                <Text style={[typography.small, { color: theme.colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
                  {resolvingAddress ? t('request.location.resolvingAddress') : (locationAddress ?? '')}
                </Text>
                <Text style={[typography.caption, { color: theme.colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>{t('request.location.privacyNote')}</Text>
              </View>

              <View style={[styles.locationActionsRow, dirStyles(isRTL).row]}>
                <Button label={t('request.refreshLocation')} variant="outline" leading={<ArrowClockwise size={16} color={theme.colors.primary} />} onPress={fetchLocation} style={styles.locationActionButton} />
                <Button label={t('request.location.addManualButton')} variant="outline" leading={<MapPin size={16} color={theme.colors.primary} />} onPress={openManualLocationPicker} style={styles.locationActionButton} />
              </View>
            </>
          ) : null}

          <Image source={LOCATION_BANNER_BY_LOCALE[locale]} style={styles.serviceBannerImage} resizeMode="cover" />
        </View>
      ) : null}
    </AppScreen>
  )
}

const styles = StyleSheet.create({
  typeHeading: { marginBottom: space.xs },
  list: { gap: space.sm },
  serviceBanner: { borderRadius: radius.lg, overflow: 'hidden' },
  serviceBannerImage: { width: '100%', height: 120 },
  detailsGroup: { gap: space.lg },
  detailsBadgeWrap: { alignItems: 'center' },
  detailsBadge: { alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: space.md, borderRadius: radius.pill },
  stepCirclesRow: { alignItems: 'center', justifyContent: 'center', gap: space.sm },
  stepCircle: { width: 32, height: 32, borderRadius: radius.pill, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  stepLine: { width: 36, height: 2 },
  stepOfText: { marginTop: -space.xs },
  summaryCard: { alignItems: 'center', gap: space.md, padding: space.lg, borderRadius: radius.lg, borderWidth: 1, ...shadow.soft },
  summaryIconCircle: { width: 52, height: 52, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  summaryTextWrap: { flex: 1, gap: 2 },
  noteCard: { gap: space.sm, padding: space.lg, borderRadius: radius.lg, borderWidth: 1, ...shadow.soft },
  noteLabelRow: { alignItems: 'center', gap: 6 },
  charCounter: {},
  photoPicker: { minHeight: 100, borderRadius: radius.lg, borderWidth: 1, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', ...shadow.soft },
  photoPlaceholder: { alignItems: 'center', gap: 6, paddingVertical: space.lg, paddingHorizontal: space.lg },
  photoIconWrap: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center', marginBottom: space.xs },
  photoPlusBadge: { position: 'absolute', bottom: -2, right: -2, width: 18, height: 18, borderRadius: radius.pill, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  photoSubtitle: { textAlign: 'center' },
  photoPreview: { width: '100%', height: 170 },
  locationState: { alignItems: 'center', gap: space.md, paddingVertical: space.xxl },
  locationActionsRow: { gap: space.sm },
  locationActionButton: { flex: 1 },
  searchResultsList: { borderRadius: radius.lg, borderWidth: 1, overflow: 'hidden' },
  searchResultRow: { alignItems: 'center', gap: space.sm, padding: space.md },
  searchResultLabel: { flex: 1 }
})
