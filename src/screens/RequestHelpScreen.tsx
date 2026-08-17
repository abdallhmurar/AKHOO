import { useState } from 'react'
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { ArrowClockwise, BatteryWarning, Camera, GasPump, Lock, MapPin, Tire, Wrench } from 'phosphor-react-native'
import { getCurrentCoords } from '../lib/location'
import { supabase } from '../lib/supabase'
import { colors, font, radius, space } from '../lib/theme'
import type { HelpRequest, ServiceType } from '../types'
import { Header } from '../components/Header'
import { PrimaryButton } from '../components/PrimaryButton'
import { Screen } from '../components/Screen'
import { Tactile } from '../components/Tactile'
import { SanadMap } from '../components/SanadMap'

const services: { key: ServiceType; label: string; Icon: typeof BatteryWarning }[] = [
  { key: 'battery', label: 'بطارية', Icon: BatteryWarning },
  { key: 'tire', label: 'بنشر', Icon: Tire },
  { key: 'fuel', label: 'وقود', Icon: GasPump },
  { key: 'locked_car', label: 'سيارة مقفلة', Icon: Lock },
  { key: 'other', label: 'شيء آخر', Icon: Wrench }
]

type Step = 'type' | 'details' | 'location'
const steps: Step[] = ['type', 'details', 'location']
const stepTitles: Record<Step, string> = { type: 'كيف نقدر نساعدك؟', details: 'التفاصيل', location: 'الموقع' }
const stepSubtitles: Record<Step, string> = {
  type: 'اختار المشكلة اللي بتواجهك.',
  details: 'ملاحظة أو صورة بتساعد المتطوع يفهم أكتر (اختياري).',
  location: 'بنشارك موقعك الحالي مع المتطوع اللي رح يستلم طلبك.'
}

export function RequestHelpScreen({ userId, onBack, onCreated }: { userId: string; onBack: () => void; onCreated: (request: HelpRequest) => void }) {
  const [step, setStep] = useState<Step>('type')
  const [service, setService] = useState<ServiceType | null>(null)
  const [note, setNote] = useState('')
  const [photoUri, setPhotoUri] = useState<string | null>(null)
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null)
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const stepIndex = steps.indexOf(step)

  async function pickPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (permission.status !== 'granted') {
      Alert.alert('لازم إذن الصور', 'لازم تسمح بالوصول لمكتبة الصور حتى تضيف صورة.')
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
      setLocationError(error.message ?? 'ما قدرنا نحدد موقعك.')
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
        Alert.alert('اختار المشكلة', 'اختار نوع المساعدة اللي بتحتاجها.')
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
    if (!service || !coords) return
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
      Alert.alert('ما قدرنا نفتح الطلب', error.message ?? 'حدث خطأ')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Screen>
      <Header title={stepTitles[step]} subtitle={stepSubtitles[step]} onBack={back} />

      <View style={styles.dots}>
        {steps.map((s, i) => (
          <View key={s} style={[styles.dot, i <= stepIndex && styles.dotActive]} />
        ))}
      </View>

      {step === 'type' ? (
        <View style={styles.grid}>
          {services.map(item => (
            <Tactile key={item.key} onPress={() => setService(item.key)} style={[styles.service, service === item.key && styles.selected]} scaleTo={0.96}>
              <item.Icon size={28} color={service === item.key ? colors.forest : colors.muted} weight={service === item.key ? 'duotone' : 'regular'} />
              <Text style={[styles.serviceText, service === item.key && styles.serviceTextSelected]}>{item.label}</Text>
            </Tactile>
          ))}
        </View>
      ) : null}

      {step === 'details' ? (
        <>
          <Text style={styles.fieldLabel}>ملاحظة للمتطوع (اختياري)</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="مثال: بطارية السيارة فاضية بالكامل، موجود بموقف عام."
            placeholderTextColor={colors.muted}
            style={styles.note}
            multiline
            textAlign="right"
          />
          <Pressable onPress={pickPhoto} style={styles.photoPicker}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.photoPreview} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Camera size={22} color={colors.muted} weight="light" />
                <Text style={styles.photoPickerText}>أضف صورة (اختياري)</Text>
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
              <Text style={styles.locationLoadingText}>عم نحدد موقعك...</Text>
            </View>
          ) : locationError ? (
            <View style={styles.locationLoading}>
              <Text style={styles.locationErrorText}>{locationError}</Text>
              <PrimaryButton title="حاول مرة ثانية" tone="light" onPress={fetchLocation} />
            </View>
          ) : coords ? (
            <>
              <View style={styles.locationHeader}>
                <MapPin size={18} color={colors.forest} weight="fill" />
                <Text style={styles.locationTitle}>موقعك الحالي</Text>
              </View>
              <SanadMap latitude={coords.latitude} longitude={coords.longitude} height={180} />
              <Pressable onPress={fetchLocation} style={styles.refreshRow}>
                <ArrowClockwise size={15} color={colors.forest} />
                <Text style={styles.refreshText}>تحديث الموقع</Text>
              </Pressable>
            </>
          ) : null}
        </View>
      ) : null}

      {step === 'location' ? (
        <PrimaryButton title="إرسال طلب المساعدة" onPress={submit} loading={loading} disabled={!coords} />
      ) : (
        <PrimaryButton title="التالي" onPress={next} />
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  dots: { flexDirection: 'row-reverse', gap: 6, marginBottom: space.xl },
  dot: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.forest },
  grid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: space.md },
  service: { width: '47%', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, minHeight: 108, alignItems: 'center', justifyContent: 'center', gap: 8 },
  selected: { borderColor: colors.forest, backgroundColor: colors.sageSoft },
  serviceText: { color: colors.text, fontFamily: font.bold, fontSize: 14.5 },
  serviceTextSelected: { color: colors.forest },
  fieldLabel: { color: colors.muted, fontFamily: font.medium, fontSize: 13, textAlign: 'right', marginBottom: 6 },
  note: { backgroundColor: colors.surface, minHeight: 100, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: space.lg, color: colors.text, fontFamily: font.regular, fontSize: 15, textAlignVertical: 'top' },
  photoPicker: { marginTop: space.lg, minHeight: 100, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  photoPlaceholder: { alignItems: 'center', gap: 6, paddingVertical: space.lg },
  photoPickerText: { color: colors.muted, fontFamily: font.medium, fontSize: 13 },
  photoPreview: { width: '100%', height: 170 },
  locationCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: space.lg },
  locationHeader: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6 },
  locationTitle: { color: colors.text, fontFamily: font.bold, fontSize: 15 },
  locationLoading: { alignItems: 'center', gap: space.md, paddingVertical: space.xl },
  locationLoadingText: { color: colors.muted, fontFamily: font.regular, fontSize: 13.5 },
  locationErrorText: { color: colors.danger, fontFamily: font.medium, fontSize: 13.5, textAlign: 'center' },
  refreshRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 5, alignSelf: 'center', marginTop: space.md, paddingVertical: 6, paddingHorizontal: 10 },
  refreshText: { color: colors.forest, fontFamily: font.medium, fontSize: 13 }
})
