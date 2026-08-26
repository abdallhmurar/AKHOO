import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { ArrowClockwise, BatteryWarning, Camera, GasPump, Lock, Tire, Warning, Wrench } from 'phosphor-react-native'
import { useTranslation } from 'react-i18next'
import { getActivePilotZones, getCurrentCoords, isWithinAnyZone } from '../../lib/location'
import type { PilotZone } from '../../lib/location'
import { resolveRequestHelpBack } from '../../lib/backNavigation'
import type { RequestHelpStep } from '../../lib/backNavigation'
import { translateActionError } from '../../lib/rpcErrors'
import { supabase } from '../../lib/supabase'
import { useIsRTL } from '../../lib/direction'
import { radius, space, useSanadTheme } from '../../lib/theme'
import { useAppTypography } from '../../lib/typography'
import { useAuth } from '../../providers'
import { AppScreen, MapPanel, ProgressHeader, ScreenHeader } from '../../components/v2'
import { Button, Surface, TextArea } from '../../components/ui'
import type { ServiceType } from '../../types'

const SERVICES: { key: ServiceType; labelKey: string; Icon: typeof BatteryWarning }[] = [
  { key: 'battery', labelKey: 'request.battery', Icon: BatteryWarning },
  { key: 'tire', labelKey: 'request.tire', Icon: Tire },
  { key: 'fuel', labelKey: 'request.fuel', Icon: GasPump },
  { key: 'locked_car', labelKey: 'request.lockedCar', Icon: Lock },
  { key: 'other', labelKey: 'request.other', Icon: Wrench }
]

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
  const { t } = useTranslation()
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

  const stepIndex = STEPS.indexOf(step)
  const stepTitles: Record<RequestHelpStep, string> = { type: t('request.step.type.title'), details: t('request.step.details.title'), location: t('request.step.location.title') }
  const stepSubtitles: Record<RequestHelpStep, string> = { type: t('request.step.type.subtitle'), details: t('request.step.details.subtitle'), location: t('request.step.location.subtitle') }
  const outsideZone = !!coords && pilotZones.length > 0 && !isWithinAnyZone(coords.latitude, coords.longitude, pilotZones)

  useEffect(() => { getActivePilotZones().then(setPilotZones).catch(() => {}) }, [])

  async function fetchLocation() {
    setLocating(true)
    setLocationError(null)
    try {
      setCoords(await getCurrentCoords())
    } catch (error: any) {
      setLocationError(error.message === 'LOCATION_PERMISSION_DENIED' ? t('request.errors.locationFailed') : (error.message ?? t('request.errors.locationFailed')))
    } finally {
      setLocating(false)
    }
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
    if (!service || !coords || outsideZone) return
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
        latitude: coords.latitude,
        longitude: coords.longitude,
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

  return (
    <AppScreen
      scroll={step !== 'location'}
      header={<ScreenHeader title={stepTitles[step]} subtitle={stepSubtitles[step]} back onBack={back} />}
      footer={step === 'location'
        ? <Button label={t('request.submit')} onPress={submit} loading={loading} disabled={!coords || outsideZone} />
        : <Button label={t('common.next')} onPress={next} />}
    >
      <ProgressHeader step={stepIndex + 1} total={STEPS.length} label={stepTitles[step]} />

      {step === 'type' ? (
        <View style={[styles.grid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          {SERVICES.map(item => {
            const selected = service === item.key
            return (
              <Pressable key={item.key} onPress={() => selectService(item.key)} style={styles.servicePressable}>
                <Surface
                  tone={selected ? 'primary' : 'default'}
                  padding="lg"
                  elevation="soft"
                  style={[styles.service, selected && { borderColor: theme.colors.primary, borderWidth: 1.5 }]}
                >
                  <View style={[styles.serviceIcon, { backgroundColor: selected ? theme.colors.primary : theme.colors.primarySoft }]}>
                    <item.Icon size={26} color={selected ? theme.colors.onPrimary : theme.colors.primary} weight={selected ? 'fill' : 'duotone'} />
                  </View>
                  <Text style={[typography.bodyMedium, { color: selected ? theme.colors.primary : theme.colors.textPrimary, textAlign: 'center' }]}>{t(item.labelKey)}</Text>
                </Surface>
              </Pressable>
            )
          })}
        </View>
      ) : null}

      {step === 'details' ? (
        <View style={styles.detailsGroup}>
          <TextArea label={t('request.noteLabel')} value={note} onChangeText={setNote} placeholder={t('request.notePlaceholder')} />
          <Pressable onPress={pickPhoto} style={[styles.photoPicker, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
            {photoUri ? <Image source={{ uri: photoUri }} style={styles.photoPreview} /> : (
              <View style={styles.photoPlaceholder}>
                <Camera size={22} color={theme.colors.textMuted} weight="light" />
                <Text style={[typography.small, { color: theme.colors.textMuted }]}>{t('request.addPhoto')}</Text>
              </View>
            )}
          </Pressable>
        </View>
      ) : null}

      {step === 'location' ? (
        locating ? (
          <View style={styles.locationState}>
            <ActivityIndicator color={theme.colors.primary} />
            <Text style={[typography.small, { color: theme.colors.textSecondary }]}>{t('request.locating')}</Text>
          </View>
        ) : locationError ? (
          <View style={styles.locationState}>
            <Text style={[typography.smallMedium, { color: theme.colors.danger, textAlign: 'center' }]}>{locationError}</Text>
            <Button label={t('request.retryLocation')} variant="outline" onPress={fetchLocation} />
          </View>
        ) : coords && outsideZone ? (
          <View style={styles.locationState}>
            <Warning size={32} color={theme.colors.reward} weight="fill" />
            <Text style={[typography.h3, { color: theme.colors.textPrimary, textAlign: 'center' }]}>{t('request.pilotZone.title')}</Text>
            <Text style={[typography.small, { color: theme.colors.textSecondary, textAlign: 'center' }]}>{t('request.pilotZone.message')}</Text>
            <Button label={t('request.retryLocation')} variant="outline" onPress={fetchLocation} />
          </View>
        ) : coords ? (
          <MapPanel
            latitude={coords.latitude}
            longitude={coords.longitude}
            height={300}
            overlay={
              <View style={[styles.locationOverlay, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Text style={[typography.smallMedium, { color: theme.colors.textPrimary }]}>{t('request.currentLocation')}</Text>
                <Pressable onPress={fetchLocation} style={[styles.refreshRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <ArrowClockwise size={14} color={theme.colors.primary} />
                  <Text style={[typography.caption, { color: theme.colors.primary }]}>{t('request.refreshLocation')}</Text>
                </Pressable>
              </View>
            }
          />
        ) : null
      ) : null}
    </AppScreen>
  )
}

const styles = StyleSheet.create({
  grid: { flexWrap: 'wrap', gap: space.md },
  servicePressable: { width: '47%' },
  service: { minHeight: 128, alignItems: 'center', justifyContent: 'center', gap: space.sm },
  serviceIcon: { width: 52, height: 52, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  detailsGroup: { gap: space.lg },
  photoPicker: { minHeight: 100, borderRadius: radius.lg, borderWidth: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  photoPlaceholder: { alignItems: 'center', gap: 6, paddingVertical: space.lg },
  photoPreview: { width: '100%', height: 170 },
  locationState: { alignItems: 'center', gap: space.md, paddingVertical: space.xxl },
  locationOverlay: { flex: 1, justifyContent: 'space-between', alignItems: 'center' },
  refreshRow: { alignItems: 'center', gap: 5 }
})
