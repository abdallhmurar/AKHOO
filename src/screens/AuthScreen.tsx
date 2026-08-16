import { useState } from 'react'
import { Alert, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { supabase } from '../lib/supabase'
import { colors } from '../lib/theme'
import { PrimaryButton } from '../components/PrimaryButton'
import { Screen } from '../components/Screen'
import { PasswordStrength } from '../components/PasswordStrength'

type Errors = { name?: string; phone?: string; email?: string; password?: string; form?: string }

export function AuthScreen() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [avatarUri, setAvatarUri] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Errors>({})

  function clearError(field: keyof Errors) {
    setErrors(current => (current[field] ? { ...current, [field]: undefined } : current))
  }

  function validate() {
    const next: Errors = {}
    if (!email.trim()) next.email = 'أدخل البريد الإلكتروني.'
    if (password.length < 6) next.password = 'كلمة المرور لازم تكون 6 أحرف على الأقل.'
    if (mode === 'signup') {
      if (!name.trim()) next.name = 'أدخل اسمك الكامل.'
      if (!phone.trim()) next.phone = 'رقم الهاتف إجباري.'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function pickAvatar() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (permission.status !== 'granted') {
      Alert.alert('لازم إذن الصور', 'لازم تسمح بالوصول لمكتبة الصور حتى تضيف صورة شخصية.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6, allowsEditing: true, aspect: [1, 1] })
    if (result.canceled || !result.assets[0]) return
    setAvatarUri(result.assets[0].uri)
  }

  async function submit() {
    if (!validate()) return
    setLoading(true)
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
        if (error) throw error
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { full_name: name.trim(), phone: phone.trim() } }
        })
        if (error) throw error

        if (avatarUri && data.user) {
          try {
            const response = await fetch(avatarUri)
            const blob = await response.blob()
            const path = `${data.user.id}/avatar.jpg`
            await supabase.storage.from('avatars').upload(path, blob, { contentType: 'image/jpeg', upsert: true })
            const publicUrl = supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl
            await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', data.user.id)
          } catch {
            // avatar upload is best-effort - don't block account creation over it
          }
        }

        if (!data.session) {
          Alert.alert('تم إنشاء الحساب', 'إذا كان تأكيد البريد مفعّلاً، افتح رسالة التأكيد ثم سجّل دخولك.')
          setMode('login')
        }
      }
    } catch (error: any) {
      setErrors({ form: error.message ?? 'حدث خطأ غير متوقع' })
    } finally {
      setLoading(false)
    }
  }

  async function forgotPassword() {
    if (!email.trim()) {
      setErrors({ email: 'أدخل بريدك الإلكتروني أول حتى نرسلّك رابط الاستعادة.' })
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: 'sanad://reset-password' })
    setLoading(false)
    if (error) {
      setErrors({ form: error.message })
      return
    }
    Alert.alert('تحقق من بريدك', 'بعتنالك رابط لإعادة تعيين كلمة المرور.')
  }

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.logo}><Text style={styles.logoText}>س</Text></View>
      <Text style={styles.brand}>سَنَد</Text>
      <Text style={styles.tagline}>ما بتضل لحالك عالطريق.</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{mode === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب'}</Text>

        {mode === 'signup' ? (
          <>
            <Pressable onPress={pickAvatar} style={styles.avatarPicker}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarPlaceholder}>📷 صورة شخصية (اختياري)</Text>
              )}
            </Pressable>

            <View>
              <TextInput
                value={name}
                onChangeText={t => { setName(t); clearError('name') }}
                placeholder="الاسم الكامل"
                placeholderTextColor={colors.muted}
                style={[styles.input, errors.name && styles.inputError]}
                textAlign="right"
              />
              {errors.name ? <Text style={styles.fieldError}>{errors.name}</Text> : null}
            </View>

            <View>
              <TextInput
                value={phone}
                onChangeText={t => { setPhone(t); clearError('phone') }}
                placeholder="رقم الهاتف *"
                placeholderTextColor={colors.muted}
                style={[styles.input, errors.phone && styles.inputError]}
                keyboardType="phone-pad"
                textAlign="right"
              />
              {errors.phone ? <Text style={styles.fieldError}>{errors.phone}</Text> : null}
            </View>
          </>
        ) : null}

        <View>
          <TextInput
            value={email}
            onChangeText={t => { setEmail(t); clearError('email') }}
            placeholder="البريد الإلكتروني"
            placeholderTextColor={colors.muted}
            style={[styles.input, errors.email && styles.inputError]}
            keyboardType="email-address"
            autoCapitalize="none"
            textAlign="right"
          />
          {errors.email ? <Text style={styles.fieldError}>{errors.email}</Text> : null}
        </View>

        <View>
          <View style={styles.passwordWrap}>
            <TextInput
              value={password}
              onChangeText={t => { setPassword(t); clearError('password') }}
              placeholder="كلمة المرور"
              placeholderTextColor={colors.muted}
              style={[styles.input, styles.passwordInput, errors.password && styles.inputError]}
              secureTextEntry={!showPassword}
              textAlign="right"
            />
            <Pressable onPress={() => setShowPassword(s => !s)} style={styles.eyeButton}>
              <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁️'}</Text>
            </Pressable>
          </View>
          {errors.password ? <Text style={styles.fieldError}>{errors.password}</Text> : null}
          {mode === 'signup' ? <PasswordStrength password={password} /> : null}
        </View>

        {errors.form ? <Text style={styles.formError}>{errors.form}</Text> : null}

        <PrimaryButton title={mode === 'login' ? 'دخول' : 'إنشاء الحساب'} onPress={submit} loading={loading} />

        {mode === 'login' ? (
          <Text onPress={forgotPassword} style={styles.forgotText}>نسيت كلمة المرور؟</Text>
        ) : null}

        <Text onPress={() => { setMode(mode === 'login' ? 'signup' : 'login'); setErrors({}) }} style={styles.switchText}>
          {mode === 'login' ? 'ما عندك حساب؟ أنشئ حساب جديد' : 'عندك حساب؟ ارجع لتسجيل الدخول'}
        </Text>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'center' },
  logo: { width: 84, height: 84, borderRadius: 26, backgroundColor: colors.blue, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', shadowColor: colors.blue, shadowOpacity: 0.25, shadowRadius: 18, elevation: 8 },
  logoText: { color: '#fff', fontSize: 40, fontWeight: '900' },
  brand: { marginTop: 16, fontSize: 34, fontWeight: '900', color: colors.text, textAlign: 'center' },
  tagline: { color: colors.muted, textAlign: 'center', marginTop: 6, fontSize: 15 },
  card: { marginTop: 30, backgroundColor: colors.card, borderRadius: 24, padding: 18, borderWidth: 1, borderColor: colors.border, gap: 12 },
  cardTitle: { fontSize: 21, fontWeight: '900', color: colors.text, textAlign: 'right', marginBottom: 2 },
  avatarPicker: { alignSelf: 'center', width: 84, height: 84, borderRadius: 42, backgroundColor: '#F9FCFF', borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 4 },
  avatarImage: { width: '100%', height: '100%' },
  avatarPlaceholder: { color: colors.muted, fontSize: 11, textAlign: 'center', paddingHorizontal: 6 },
  input: { minHeight: 52, borderRadius: 15, backgroundColor: '#F9FCFF', borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, color: colors.text, fontSize: 15 },
  inputError: { borderColor: colors.red },
  fieldError: { color: colors.red, textAlign: 'right', fontSize: 12, fontWeight: '700', marginTop: 5 },
  formError: { color: colors.red, textAlign: 'center', fontSize: 13, fontWeight: '800', backgroundColor: colors.redSoft, borderRadius: 12, paddingVertical: 10 },
  passwordWrap: { justifyContent: 'center' },
  passwordInput: { paddingLeft: 44 },
  eyeButton: { position: 'absolute', left: 10, padding: 6 },
  eyeText: { fontSize: 18 },
  forgotText: { color: colors.muted, fontWeight: '700', textAlign: 'center', fontSize: 13 },
  switchText: { color: colors.blueDark, fontWeight: '700', textAlign: 'center', paddingTop: 4 }
})
