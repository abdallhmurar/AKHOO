import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { ArrowClockwise, BatteryWarning, Camera, GasPump, Lock, MapPin, Tire, Wrench, Warning } from 'phosphor-react-native'
import { useTranslation } from 'react-i18next'
import { getActivePilotZones, getCurrentCoords, isWithinAnyZone } from '../lib/location'
import type { PilotZone } from '../lib/location'
import { supabase } from '../lib/supabase'
import { colors, font, radius, space } from '../lib/theme'
import { dirStyles, useIsRTL } from '../lib/direction'
import type { HelpRequest, ServiceType } from '../types'
import { Header } from '../components/Header'
import { PrimaryButton } from '../components/PrimaryButton'
import { Screen } from '../components/Screen'
import { Tactile } from '../components/Tactile'
import { SanadMap } from '../components/SanadMap'

const services: { key: ServiceType; labelKey: string; Icon: typeof BatteryWarning }[] = [
  { key: 'battery', labelKey: 'request.battery', Icon: BatteryWarning },
  { key: 'tire', labelKey: 'request.tire', Icon: Tire },
  { key: 'fuel', labelKey: 'request.fuel', Icon: GasPump },
  { key: 'locked_car', labelKey: 'request.lockedCar', Icon: Lock },
  { key: 'other', labelKey: 'request.other', Icon: Wrench }
]

type Step = 'type' | 'details' | 'location'
const steps: Step[] = ['type', 'details', 'location']

export function RequestHelpScreen({ userId, onBack, onCreated }: { userId: string; onBack: () => void; onCreated: (request: HelpRequest) => void }) {
  const { t } = useTranslation()
  const dir = dirStyles(useIsRTL())
  const [step, setStep] = useState<Step>('type')
  const [service, setService] = useState<ServiceType | null>(null)
  const [note, setNote] = useState('')
  const [photoUri, setPhotoUri] = useState<string | null>(null)
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null)
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [pilotZones, setPilotZones] = useState<PilotZone[]>([])

  const stepIndex = steps.indexOf(step)
  const stepTitles: Record<Step, string> = { type: t('request.step.type.title'), details: t('request.step.details.title'), location: t('request.step.location.title') }
  const stepSubtitles: Record<Step, string> = { type: t('request.step.type.subtitle'), details: t('request.step.details.subtitle'), location: t('request.step.location.subtitle') }
  const outsideZone = !!coords && pilotZones.length > 0 && !isWithinAnyZone(coords.latitude, coords.longitude, pilotZones)

  useEffect(() => {
    getActivePilotZones().then(setPilotZones).catch(() => {})
  }, [])

  async function pickPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (permission.status !== 'granted') {
      Alert.alert(t('auth.signup.permissionPhotos.title'), t('auth.signup.permissionPhotos.message'))
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6 })
    if (result.canceled || !result.assets[0]) return
    setPhotoUri(result.assets[0].uri)
  }

  async function fetchLocation() {
    setLocating(true)
    setLocationError(null)
    try {
      const position = await getCurrentCoords()
      setCoords(position)
    } catch (error: any) {
      setLocationError(error.message === 'LOCATION_PERMISSION_DENIED' ? t('request.errors.locationFailed') : (error.message ?? t('request.errors.locationFailed')))
    } finally {
      setLocating(false)
    }
  }

  function goToStep(next: Step) {
    if (next === 'location' && !coords && !locating) fetchLocation()
    setStep(next)
  }

  function next() {
    if (step === 'type') {
      if (!service) {
        Alert.alert(t('request.errors.selectType'), t('request.errors.selectTypeMessage'))
        return
      }
      goToStep('details')
    } else if (step === 'details') {
      goToStep('location')
    }
  }

  function back() {
    if (step === 'type') onBack()
    else setStep(steps[stepIndex - 1]!)
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
      }).select('*').single()
      if (error) throw error
      onCreated(data as HelpRequest)
    } catch (error: any) {
      Alert.alert(t('request.errors.createFailedTitle'), error.message ?? t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Screen>
      <Header title={stepTitles[step]} subtitle={stepSubtitles[step]} onBack={back} />

      <View style={[styles.dots, dir.row]}>
        {steps.map((s, i) => (
          <View key={s} style={[styles.dot, i <= stepIndex && styles.dotActive]} />
        ))}
      </View>

      {step === 'type' ? (
        <View style={[styles.grid, dir.row]}>
          {services.map(item => (
            <Tactile key={item.key} onPress={() => setService(item.key)} style={[styles.service, service === item.key && styles.selected]} scaleTo={0.96}>
              <item.Icon size={28} color={service === item.key ? colors.forest : colors.muted} weight={service === item.key ? 'duotone' : 'regular'} />
              <Text style={[styles.serviceText, service === item.key && styles.serviceTextSelected]}>{t(item.labelKey)}</Text>
            </Tactile>
          ))}
        </View>
      ) : null}

      {step === 'details' ? (
        <>
          <Text style={[styles.fieldLabel, dir.textStart]}>{t('request.noteLabel')}</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder={t('request.notePlaceholder')}
            placeholderTextColor={colors.muted}
            style={[styles.note, dir.textStart]}
            multiline
          />
          <Pressable onPress={pickPhoto} style={styles.photoPicker}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.photoPreview} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Camera size={22} color={colors.muted} weight="light" />
                <Text style={styles.photoPickerText}>{t('request.addPhoto')}</Text>
              </View>
            )}
          </Pressable>
        </>
      ) : null}

      {step === 'location' ? (
        <View style={styles.locationCard}>
          {locating ? (
            <View style={styles.locationLoading}>
              <ActivityIndicator color={colors.forest} />
              <Text style={styles.locationLoadingText}>{t('request.locating')}</Text>
            </View>
          ) : locationError ? (
            <View style={styles.locationLoading}>
              <Text style={styles.locationErrorText}>{locationError}</Text>
              <PrimaryButton title={t('request.retryLocation')} tone="light" onPress={fetchLocation} />
            </View>
          ) : coords && outsideZone ? (
            <View style={styles.locationLoading}>
              <Warning size={32} color={colors.warning} weight="fill" />
              <Text style={styles.zoneTitle}>{t('request.pilotZone.title')}</Text>
              <Text style={styles.locationErrorText}>{t('request.pilotZone.message')}</Text>
              <PrimaryButton title={t('request.retryLocation')} tone="light" onPress={fetchLocation} />
            </View>
          ) : coords ? (
            <>
              <View style={[styles.locationHeader, dir.row]}>
                <MapPin size={18} color={colors.forest} weight="fill" />
                <Text style={styles.locationTitle}>{t('request.currentLocation')}</Text>
              </View>
              <SanadMap latitude={coords.latitude} longitude={coords.longitude} height={180} />
              <Pressable onPress={fetchLocation} style={[styles.refreshRow, dir.row]}>
                <ArrowClockwise size={15} color={colors.forest} />
                <Text style={styles.refreshText}>{t('request.refreshLocation')}</Text>
              </Pressable>
            </>
          ) : null}
        </View>
      ) : null}

      {step === 'location' ? (
        <PrimaryButton title={t('request.submit')} onPress={submit} loading={loading} disabled={!coords || outsideZone} />
      ) : (
        <PrimaryButton title={t('common.next')} onPress={next} />
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  dots: { gap: 6, marginBottom: space.xl },
  dot: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.forest },
  grid: { flexWrap: 'wrap', gap: space.md },
  service: { width: '47%', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, minHeight: 108, alignItems: 'center', justifyContent: 'center', gap: 8 },
  selected: { borderColor: colors.forest, backgroundColor: colors.sageSoft },
  serviceText: { color: colors.text, fontFamily: font.bold, fontSize: 14.5 },
  serviceTextSelected: { color: colors.forest },
  fieldLabel: { color: colors.muted, fontFamily: font.medium, fontSize: 13, marginBottom: 6 },
  note: { backgroundColor: colors.surface, minHeight: 100, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: space.lg, color: colors.text, fontFamily: font.regular, fontSize: 15, textAlignVertical: 'top' },
  photoPicker: { marginTop: space.lg, minHeight: 100, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  photoPlaceholder: { alignItems: 'center', gap: 6, paddingVertical: space.lg },
  photoPickerText: { color: colors.muted, fontFamily: font.medium, fontSize: 13 },
  photoPreview: { width: '100%', height: 170 },
  locationCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: space.lg },
  locationHeader: { alignItems: 'center', gap: 6 },
  locationTitle: { color: colors.text, fontFamily: font.bold, fontSize: 15 },
  locationLoading: { alignItems: 'center', gap: space.md, paddingVertical: space.xl },
  locationLoadingText: { color: colors.muted, fontFamily: font.regular, fontSize: 13.5 },
  locationErrorText: { color: colors.danger, fontFamily: font.medium, fontSize: 13.5, textAlign: 'center' },
  zoneTitle: { color: colors.text, fontFamily: font.extraBold, fontSize: 16, textAlign: 'center' },
  refreshRow: { alignItems: 'center', gap: 5, alignSelf: 'center', marginTop: space.md, paddingVertical: 6, paddingHorizontal: 10 },
  refreshText: { color: colors.forest, fontFamily: font.medium, fontSize: 13 }
})
