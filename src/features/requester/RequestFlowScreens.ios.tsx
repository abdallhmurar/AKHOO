import { motionImages } from '../../components/motion/media.ios'
import { FlowHeader, RequestHeading, RequestChoice, SelectedProblem, SafetyBanner } from '../../components/motion/RequestPresentation.ios'
import { GuideTarget, useGuidePage } from '../guide/GuideProvider'
import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { ArrowClockwise, ArrowLeft, ArrowRight, BatteryWarning, CheckCircle, Crosshair, GasPump, MapPin, Tire, Warning, Wrench } from 'phosphor-react-native'
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
import { Button, IconButton, TextArea, TextField } from '../../components/ui'
import { SanadMap } from '../../components/SanadMap'
import type { SanadMapRef } from '../../components/SanadMap.types'
import type { ServiceType } from '../../types'

type Locale = 'ar' | 'he' | 'en'

// Approved presentation copy, shared visually with the web flow.
const DETAILS_COPY = {
  ar: {
    title: 'تفاصيل المشكلة', subtitle: 'وصف بسيط بيساعدنا نساعدك أسرع',
    note: 'ملاحظة إضافية', optional: 'اختياري', next: 'التالي: تحديد الموقع',
    photoHint: 'اختياري، بتساعدنا نفهم الحالة أسرع', changePhoto: 'تغيير الصورة', photoReady: 'تمت إضافة الصورة، اضغط لتغييرها',
    placeholders: {
      battery: 'مثال: السيارة ما بتشتغل وبحتاج وصلة بطارية.',
      tire: 'مثال: الإطار الخلفي نازل وبحتاج مساعدة بتغييره.',
      fuel: 'مثال: خلص البنزين والسيارة متوقفة على جانب الطريق.',
      other: 'احكيلنا باختصار شو المشكلة وكيف ممكن نساعدك.'
    }
  },
  en: {
    title: 'Problem details', subtitle: 'A short description helps us help you faster',
    note: 'Additional note', optional: 'Optional', next: 'Next: choose location',
    photoHint: 'Optional, helps us understand the problem faster', changePhoto: 'Change photo', photoReady: 'Photo added. Tap to change it.',
    placeholders: {
      battery: 'e.g. The car will not start and I need a jump-start.',
      tire: 'e.g. The rear tire is flat and I need help changing it.',
      fuel: 'e.g. I ran out of fuel and the car is stopped by the road.',
      other: 'Briefly describe the problem and how we can help.'
    }
  },
  he: {
    title: 'פרטי הבעיה', subtitle: 'תיאור קצר יעזור לנו לעזור לכם מהר יותר',
    note: 'הערה נוספת', optional: 'רשות', next: 'הבא: בחירת מיקום',
    photoHint: 'לא חובה, עוזר לנו להבין את הבעיה מהר יותר', changePhoto: 'החלפת תמונה', photoReady: 'התמונה נוספה. לחצו כדי להחליף אותה.',
    placeholders: {
      battery: 'למשל: הרכב לא מניע וצריך עזרה עם כבלי התנעה.',
      tire: 'למשל: יש תקר בגלגל האחורי וצריך עזרה בהחלפתו.',
      fuel: 'למשל: נגמר הדלק והרכב עומד בצד הדרך.',
      other: 'תארו בקצרה את הבעיה ואיך נוכל לעזור.'
    }
  }
} as const

const LOCATION_COPY = {
  ar: { subtitle: 'تأكد من موقعك حتى يوصل المساعد بسهولة', manual: 'تحديد يدوي', recenter: 'إعادة توسيط الخريطة', privacy: 'يُشارك هذا الموقع مع مقدّم المساعدة فقط', safety: 'حاول الوقوف في مكان آمن إن أمكن', safetyDetail: 'سلامتك هي الأهم بالنسبة لنا' },
  en: { subtitle: 'Check your location so your helper can find you easily', manual: 'Set manually', recenter: 'Recenter map', privacy: 'This location is shared only with your helper', safety: 'Stop somewhere safe if you can', safetyDetail: 'Your safety comes first' },
  he: { subtitle: 'בדקו את המיקום כדי שיוכלו להגיע אליכם בקלות', manual: 'בחירה ידנית', recenter: 'מרכוז המפה מחדש', privacy: 'המיקום משותף רק עם מי שמגיע לעזור', safety: 'אם אפשר, עצרו במקום בטוח', safetyDetail: 'הבטיחות שלכם קודמת לכול' }
} as const

const SERVICES = [{ key: 'battery' }, { key: 'fuel' }, { key: 'other' }, { key: 'tire' }] as const
const APPROVED_DESCRIPTIONS = {
  ar: { battery: 'مساعدة لتشغيل السيارة', fuel: 'بنزينك خلص؟ بنوصلك مساعدة', other: 'مساعدة لمشكلة ثانية بالطريق', tire: 'مساعدة لتبديل إطار السيارة' },
  en: { battery: 'Help starting your car', fuel: 'Out of fuel? Get help nearby', other: 'Help with another road issue', tire: 'Help changing a flat tire' },
  he: { battery: 'עזרה בהתנעת הרכב', fuel: 'נגמר הדלק? עזרה בקרבתך', other: 'עזרה בבעיה אחרת בדרך', tire: 'עזרה בהחלפת גלגל' }
} as const

// Small icon + label shown in the details step's "selected problem" summary
// card, separate from the illustrated selection cards.
const SERVICE_SUMMARY: Partial<Record<ServiceType, { labelKey: string; Icon: typeof Tire }>> = {
  battery: { labelKey: 'request.battery', Icon: BatteryWarning },
  fuel: { labelKey: 'request.fuel', Icon: GasPump },
  other: { labelKey: 'request.other', Icon: Wrench },
  tire: { labelKey: 'request.tire', Icon: Tire }
}

const STEPS: RequestHelpStep[] = ['type', 'details', 'location']
const MAX_IMAGE_BYTES = 10 * 1024 * 1024

// Vercel presentation override. Keep request, photo, and location behavior
// aligned with RequestFlowScreens.tsx; details and location are restyled here.
export function RequestFlowScreen() {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const { t, i18n } = useTranslation()
  const locale: Locale = i18n.language.startsWith('he') ? 'he' : i18n.language.startsWith('en') ? 'en' : 'ar'
  const detailsCopy = DETAILS_COPY[locale]
  const locationCopy = LOCATION_COPY[locale]
  const locationMapRef = useRef<SanadMapRef>(null)
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
  const [pickerSearched, setPickerSearched] = useState(false)
  const pickerVersion = useRef(0)
  const pinVersion = useRef(0)

  const stepIndex = STEPS.indexOf(step)
  const activeCoords = manualLocation ?? coords
  const outsideZone = !!activeCoords && pilotZones.length > 0 && !isWithinAnyZone(activeCoords.latitude, activeCoords.longitude, pilotZones)
  useGuidePage(step === 'type' ? 'request' : step, !manualLocationOpen && (step !== 'location' || (!locating && !!activeCoords && !outsideZone && !locationError)))
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

  async function searchPicker() {
    if (pickerSearching || pickerQuery.trim().length < 3) return
    setPickerSearching(true)
    const version = ++pickerVersion.current
    setLocationError(null)
    setPickerSearched(true)
    try { const results = await searchAddress(pickerQuery); if (version === pickerVersion.current) setPickerResults(results) }
    catch { setLocationError(t('request.errors.locationFailed')) }
    finally { setPickerSearching(false) }
  }

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
    pickerVersion.current++
    pinVersion.current++
    setPickerSearched(false)
    setLocationError(null)
    const seed = manualLocation ?? activeCoords ?? MAP_FALLBACK_CENTER
    setPickerPoint(seed)
    setPickerAddress(manualLocation?.address ?? locationAddress)
    setPickerQuery('')
    setPickerResults([])
    setManualLocationOpen(true)
  }

  async function handlePickerMapPress(point: { latitude: number; longitude: number }) {
    const version = ++pinVersion.current
    setPickerPoint(point)
    setPickerAddress(null)
    setPickerResolvingAddress(true)
    const address = await reverseGeocode(point.latitude, point.longitude)
    if (version !== pinVersion.current) return
    setPickerAddress(address)
    setPickerResolvingAddress(false)
  }

  function selectSearchResult(result: GeocodeResult) {
    pinVersion.current++
    pickerVersion.current++
    setPickerResolvingAddress(false)
    setPickerSearched(false)
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
        const bytes = await response.arrayBuffer()
        const path = `${userId}/${Date.now()}.jpg`
        const { error: uploadError } = await supabase.storage.from('request-photos').upload(path, bytes, { contentType: 'image/jpeg' })
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

  if (manualLocationOpen) {
    return (
      <AppScreen
        header={<ScreenHeader title={t('request.location.addManualButton')} back onBack={() => setManualLocationOpen(false)} />}
        footer={<Button label={t('request.location.confirmButton')} onPress={confirmManualLocation} disabled={!pickerPoint} />}
      >
        <TextField
          value={pickerQuery}
          onChangeText={value => { pickerVersion.current++; setPickerQuery(value); setPickerSearched(false); setPickerResults([]) }}
          placeholder={t('request.location.searchPlaceholder')}
          onSubmitEditing={() => void searchPicker()}
        />
        <Button label={t('common.search')} loading={pickerSearching} disabled={pickerQuery.trim().length < 3} onPress={searchPicker} />
        {locationError ? <Text style={[typography.small, { color: theme.colors.danger }]}>{locationError}</Text> : null}
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
        ) : pickerSearched && !locationError ? (
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
      key={step}
      header={<FlowHeader onBack={back} step={stepIndex + 1} />}
      footer={step === 'location'
        ? <Button label={t('request.submit')} onPress={submit} loading={loading} disabled={!activeCoords || outsideZone} style={styles.footerAction} />
        : step === 'details'
          ? <Button label={detailsCopy.next} trailing={isRTL ? <ArrowLeft size={18} color={theme.colors.onPrimary} weight="bold" /> : <ArrowRight size={18} color={theme.colors.onPrimary} weight="bold" />} onPress={next} style={styles.footerAction} />
          : <Button label={t('common.next')} disabled={!service} trailing={isRTL ? <ArrowLeft size={18} color={theme.colors.onPrimary} weight="bold" /> : <ArrowRight size={18} color={theme.colors.onPrimary} weight="bold" />} onPress={next} />}
      guideFooterId="request.next"
      contentStyle={step === 'type' ? styles.typeContent : undefined}
    >
      {step === 'type' ? (
        <>
          <RequestHeading selection title={t('request.step.type.title')} subtitle={t('request.step.type.subtitle')} />
          <GuideTarget id="request.services"><View accessibilityRole="radiogroup" accessibilityLabel={t('request.step.type.title')} style={styles.list}>
            {SERVICES.map(item => <RequestChoice key={item.key} kind={item.key} title={t(`request.serviceCards.${item.key}.title`)} description={APPROVED_DESCRIPTIONS[locale][item.key]} selected={service === item.key} onSelect={() => selectService(item.key)} />)}
          </View></GuideTarget>
          {/* Hidden on iOS only; Android keeps the SAND rescue contact card. */}
        </>
      ) : null}

      {step === 'details' ? (
        <View style={styles.detailsGroup}>
          <RequestHeading title={detailsCopy.title} subtitle={detailsCopy.subtitle} />

          {selectedSummary && service ? <SelectedProblem kind={service} title={t(selectedSummary.labelKey)} label={t('request.step.details.selectedProblem')} /> : null}

          <GuideTarget id="details.note"><View style={[styles.noteCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={[styles.noteLabelRow, dirStyles(isRTL).row]}>
              <Text style={[typography.bodyMedium, { color: theme.colors.textPrimary }]}>{detailsCopy.note}</Text>
              <Text style={[typography.caption, { color: theme.colors.textMuted }]}>{detailsCopy.optional}</Text>
            </View>
            <TextArea value={note} onChangeText={setNote} accessibilityLabel={t('request.noteLabel')} placeholder={detailsCopy.placeholders[service && service !== 'locked_car' ? service : 'other']} maxLength={500} numberOfLines={4} style={styles.noteInput} />
            <Text style={[typography.caption, styles.charCounter, { color: theme.colors.textMuted, alignSelf: isRTL ? 'flex-start' : 'flex-end' }]}>{note.length}/500</Text>
          </View></GuideTarget>

          <GuideTarget id="details.photo"><Pressable accessibilityRole="button" accessibilityLabel={photoUri ? detailsCopy.changePhoto : t('request.step.details.addPhotoTitle')} accessibilityHint={photoUri ? detailsCopy.photoReady : detailsCopy.photoHint} onPress={pickPhoto} style={({ pressed }) => [styles.photoPicker, dirStyles(isRTL).row, { borderColor: theme.colors.border, backgroundColor: pressed ? theme.colors.primarySoft : theme.colors.surface }]}>
            <View style={styles.photoCopy}>
              <Text style={[typography.bodyMedium, { color: theme.colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{photoUri ? detailsCopy.changePhoto : t('request.step.details.addPhotoTitle')}</Text>
              <Text style={[typography.small, { color: theme.colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>{photoUri ? detailsCopy.photoReady : detailsCopy.photoHint}</Text>
              <View style={{ marginTop: 10, paddingVertical: 7, paddingHorizontal: 14, borderRadius: 24, borderWidth: 1, borderColor: theme.colors.primary, alignSelf: 'flex-start' }}><Text style={[typography.smallMedium, { color: theme.colors.primary }]}>{photoUri ? detailsCopy.changePhoto : locale === 'ar' ? 'إضافة صورة' : locale === 'he' ? 'הוספת תמונה' : 'Add photo'}</Text></View>
            </View>
            <Image accessible={false} source={photoUri ? { uri: photoUri } : motionImages.camera} style={{ width: 116, height: 116, borderRadius: photoUri ? 17 : 0 }} resizeMode={photoUri ? 'cover' : 'contain'} />
          </Pressable></GuideTarget>
        </View>
      ) : null}

      {step === 'location' ? (
        <View style={styles.detailsGroup}>
          <RequestHeading title={t('request.step.location.title')} subtitle={locationCopy.subtitle} />

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
            <View style={[styles.locationCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <View style={styles.locationMapFrame}>
                <SanadMap ref={locationMapRef} latitude={activeCoords.latitude} longitude={activeCoords.longitude} zoom={13} height={255} interactive style={styles.locationMap} />
                <IconButton label={locationCopy.recenter} icon={<Crosshair size={20} color={theme.colors.primary} />} onPress={() => locationMapRef.current?.recenter(activeCoords.latitude, activeCoords.longitude, 13)} style={{ ...styles.locationMapControl, [isRTL ? 'left' : 'right']: space.xxl }} />
              </View>
              <View style={[styles.locationSummary, dirStyles(isRTL).row]}>
                <CheckCircle size={22} color={theme.colors.community} weight="fill" />
                <View style={styles.locationCopy}>
                  <Text style={[typography.h3, { color: theme.colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{manualLocation ? t('request.location.manualValue') : t('request.currentLocation')}</Text>
                  {resolvingAddress || locationAddress ? (
                    <Text style={[typography.small, { color: theme.colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
                      {resolvingAddress ? t('request.location.resolvingAddress') : locationAddress}
                    </Text>
                  ) : null}
                  <Text style={[typography.caption, { color: theme.colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>{locationCopy.privacy}</Text>
                </View>
              </View>
              <GuideTarget id="location.position"><View style={[styles.locationActionsRow, dirStyles(isRTL).row, { borderColor: theme.colors.border }]}>
                <View style={styles.locationActionCell}><Button label={t('request.refreshLocation')} variant="ghost" leading={<ArrowClockwise size={18} color={theme.colors.primary} />} onPress={fetchLocation} style={styles.locationActionButton} /></View>
                <View style={[styles.locationActionDivider, { backgroundColor: theme.colors.border }]} />
                <View style={styles.locationActionCell}><Button label={locationCopy.manual} variant="ghost" leading={<MapPin size={18} color={theme.colors.primary} />} onPress={openManualLocationPicker} style={styles.locationActionButton} /></View>
              </View></GuideTarget>
            </View>
          ) : null}

          <SafetyBanner title={locationCopy.safety} subtitle={locationCopy.safetyDetail} />
        </View>
      ) : null}
    </AppScreen>
  )
}

const styles = StyleSheet.create({
  typeContent: { paddingHorizontal: space.lg, gap: space.lg },
  typeHeader: { alignItems: 'center', gap: space.sm },
  typeCopy: { flex: 1, minWidth: 0, gap: space.sm },
  typeHeading: { alignSelf: 'stretch', flexShrink: 1 },
  headerArt: { width: '27%', overflow: 'hidden', borderRadius: radius.md },
  list: { gap: space.md },
  serviceBanner: { minHeight: 120, borderRadius: radius.lg, borderWidth: 1.5, alignItems: 'center', gap: space.sm, padding: space.sm, overflow: 'hidden' },
  serviceRadio: { width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  serviceCopy: { flex: 1, minWidth: 0, gap: space.sm },
  serviceArt: { width: '43%', overflow: 'hidden', borderRadius: radius.md },
  serviceBannerImage: { width: '100%', height: 120 },
  detailsGroup: { gap: space.lg },
  detailsHeader: { gap: 6, paddingTop: space.xs, paddingBottom: space.xs },
  detailsProgress: { gap: space.sm, marginTop: space.md },
  detailsSummary: { paddingVertical: space.md },
  footerAction: { width: '100%', maxWidth: 520, alignSelf: 'center' },
  stepCirclesRow: { alignItems: 'center', justifyContent: 'center', gap: space.sm },
  stepCircle: { width: 32, height: 32, borderRadius: radius.pill, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  stepLine: { width: 36, height: 2 },
  summaryCard: { alignItems: 'center', gap: space.md, padding: space.lg, borderRadius: radius.lg, borderWidth: 1, ...shadow.soft },
  summaryIconCircle: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  summaryTextWrap: { flex: 1, gap: 2 },
  noteCard: { gap: space.sm, padding: space.lg, borderRadius: radius.lg, borderWidth: 1, ...shadow.soft },
  noteLabelRow: { alignItems: 'center', gap: 6 },
  noteInput: { minHeight: 100, height: 100 },
  charCounter: { writingDirection: 'ltr' },
  photoPicker: { minHeight: 146, borderStyle: 'dashed', gap: space.md, padding: space.lg, borderRadius: radius.lg, borderWidth: 1, alignItems: 'center', overflow: 'hidden', ...shadow.soft },
  photoIconWrap: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  photoAction: { width: 30, height: 30, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  photoCopy: { flex: 1, minWidth: 0, gap: 4 },
  photoPreview: { width: 52, height: 52, borderRadius: radius.sm },
  locationState: { alignItems: 'center', gap: space.md, paddingVertical: space.xxl },
  locationCard: { borderRadius: radius.xl, borderWidth: 1, overflow: 'hidden', ...shadow.soft },
  locationMapFrame: { padding: space.md, paddingBottom: 0 },
  locationMap: { marginTop: 0, borderRadius: radius.lg, borderWidth: 0 },
  locationMapControl: { position: 'absolute', top: space.xxl },
  locationSummary: { alignItems: 'flex-start', gap: space.sm, padding: space.lg },
  locationCopy: { flex: 1, minWidth: 0, gap: 4 },
  locationActionsRow: { borderTopWidth: StyleSheet.hairlineWidth },
  locationActionCell: { flex: 1, minWidth: 0 },
  locationActionDivider: { width: StyleSheet.hairlineWidth, height: 28, alignSelf: 'center' },
  locationActionButton: { flex: 1, borderRadius: 0, paddingHorizontal: space.sm },
  searchResultsList: { borderRadius: radius.lg, borderWidth: 1, overflow: 'hidden' },
  searchResultRow: { alignItems: 'center', gap: space.sm, padding: space.md },
  searchResultLabel: { flex: 1 }
})
