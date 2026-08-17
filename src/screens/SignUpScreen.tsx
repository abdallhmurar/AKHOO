import { useState } from 'react'
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { Camera, Eye, EyeSlash } from 'phosphor-react-native'
import { supabase } from '../lib/supabase'
import { colors, font } from '../lib/theme'
import { AuthShell } from '../components/AuthShell'
import { TextField } from '../components/TextField'
import { PrimaryButton } from '../components/PrimaryButton'
import { PasswordStrength } from '../components/PasswordStrength'

type Errors = { name?: string; phone?: string; email?: string; password?: string; form?: string }

export function SignUpScreen({ onLogin, onCreated }: { onLogin: () => void; onCreated: () => void }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [avatarUri, setAvatarUri] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Errors>({})

  function clearError(field: keyof Errors) {
    setErrors(current => (current[field] ? { ...current, [field]: undefined } : current))
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
    const next: Errors = {}
    if (!name.trim()) next.name = 'أدخل اسمك الكامل.'
    if (!phone.trim()) next.phone = 'رقم الهاتف إجباري.'
    if (!email.trim()) next.email = 'أدخل البريد الإلكتروني.'
    if (password.length < 6) next.password = 'كلمة المرور لازم تكون 6 أحرف على الأقل.'
    setErrors(next)
    if (Object.keys(next).length > 0) return

    setLoading(true)
    try {
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
        onCreated()
      }
    } catch (error: any) {
      setErrors({ form: error.message ?? 'حدث خطأ غير متوقع' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell scene="signup" title="إنشاء حساب" subtitle="ابدأ رحلتك في المساعدة والعطاء.">
      <Pressable onPress={pickAvatar} style={styles.avatarPicker}>
        {avatarUri ? (
          <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Camera size={22} color={colors.muted} weight="light" />
          </View>
        )}
      </Pressable>
      <Text style={styles.avatarHint}>صورة شخصية (اختياري)</Text>

      <TextField label="الاسم الكامل" placeholder="مثال: أحمد محمود" value={name} onChangeText={t => { setName(t); clearError('name') }} error={errors.name} />
      <TextField label="رقم الهاتف" placeholder="+962 7X XXX XXXX" value={phone} onChangeText={t => { setPhone(t); clearError('phone') }} error={errors.phone} keyboardType="phone-pad" />
      <TextField label="البريد الإلكتروني" placeholder="you@example.com" value={email} onChangeText={t => { setEmail(t); clearError('email') }} error={errors.email} keyboardType="email-address" autoCapitalize="none" />
      <View>
        <TextField
          label="كلمة المرور"
          value={password}
          onChangeText={t => { setPassword(t); clearError('password') }}
          error={errors.password}
          secureTextEntry={!showPassword}
          trailing={
            <Pressable onPress={() => setShowPassword(s => !s)} hitSlop={8}>
              {showPassword ? <EyeSlash size={20} color={colors.muted} /> : <Eye size={20} color={colors.muted} />}
            </Pressable>
          }
        />
        <View style={styles.strengthWrap}><PasswordStrength password={password} /></View>
      </View>

      {errors.form ? <Text style={styles.formError}>{errors.form}</Text> : null}

      <PrimaryButton title="إنشاء الحساب" onPress={submit} loading={loading} />

      <Text style={styles.switch}>
        لديك حساب بالفعل؟ <Text onPress={onLogin} style={styles.switchLink}>تسجيل الدخول</Text>
      </Text>
    </AuthShell>
  )
}

const styles = StyleSheet.create({
  avatarPicker: { alignSelf: 'center', width: 84, height: 84, borderRadius: 42, backgroundColor: colors.surfaceMuted, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%' },
  avatarPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  avatarHint: { color: colors.muted, fontFamily: font.regular, fontSize: 12, textAlign: 'center', marginTop: -8 },
  strengthWrap: { marginTop: 8 },
  formError: { color: colors.danger, textAlign: 'center', fontSize: 13, fontFamily: font.bold, backgroundColor: colors.dangerSoft, borderRadius: 12, paddingVertical: 10 },
  switch: { color: colors.muted, fontFamily: font.regular, fontSize: 13.5, textAlign: 'center' },
  switchLink: { color: colors.forest, fontFamily: font.bold }
})
