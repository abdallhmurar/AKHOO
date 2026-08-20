import { useState } from 'react'
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { Camera, Eye, EyeSlash } from 'phosphor-react-native'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { colors, font } from '../lib/theme'
import { normalizePhone } from '../lib/phone'
import { AuthShell } from '../components/AuthShell'
import { TextField } from '../components/TextField'
import { PrimaryButton } from '../components/PrimaryButton'
import { PasswordStrength } from '../components/PasswordStrength'

type Errors = { name?: string; phone?: string; email?: string; password?: string; form?: string }
const MAX_IMAGE_BYTES = 10 * 1024 * 1024

export function SignUpScreen({ onLogin, onCreated }: { onLogin: () => void; onCreated: () => void }) {
  const { t } = useTranslation()
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
      Alert.alert(t('auth.signup.permissionPhotos.title'), t('auth.signup.permissionPhotos.message'))
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6, allowsEditing: true, aspect: [1, 1] })
    if (result.canceled || !result.assets[0]) return
    const asset = result.assets[0]
    if (asset.fileSize && asset.fileSize > MAX_IMAGE_BYTES) {
      Alert.alert(t('common.error'), t('account.errors.imageTooLarge'))
      return
    }
    setAvatarUri(asset.uri)
  }

  async function submit() {
    const next: Errors = {}
    if (!name.trim()) next.name = t('auth.signup.errors.nameRequired')
    const normalizedPhone = phone.trim() ? normalizePhone(phone.trim()) : null
    if (!phone.trim()) next.phone = t('auth.signup.errors.phoneRequired')
    else if (!normalizedPhone) next.phone = t('auth.signup.errors.phoneInvalid')
    if (!email.trim()) next.email = t('auth.signup.errors.emailRequired')
    if (password.length < 6) next.password = t('auth.signup.errors.passwordTooShort')
    setErrors(next)
    if (Object.keys(next).length > 0) return

    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: name.trim(), phone: normalizedPhone } }
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
        Alert.alert(t('auth.signup.created.title'), t('auth.signup.created.message'))
        onCreated()
      }
    } catch (error: any) {
      setErrors({ form: error.message ?? t('common.error') })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell scene="signup" title={t('auth.signup.title')} subtitle={t('auth.signup.subtitle')}>
      <Pressable onPress={pickAvatar} style={styles.avatarPicker}>
        {avatarUri ? (
          <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Camera size={22} color={colors.muted} weight="light" />
          </View>
        )}
      </Pressable>
      <Text style={styles.avatarHint}>{t('auth.signup.avatarHint')}</Text>

      <TextField label={t('auth.signup.nameLabel')} placeholder={t('auth.signup.namePlaceholder')} value={name} onChangeText={t => { setName(t); clearError('name') }} error={errors.name} />
      <TextField label={t('auth.signup.phoneLabel')} placeholder={t('auth.signup.phonePlaceholder')} value={phone} onChangeText={t => { setPhone(t); clearError('phone') }} error={errors.phone} keyboardType="phone-pad" />
      <TextField label={t('auth.signup.emailLabel')} placeholder={t('auth.signup.emailPlaceholder')} value={email} onChangeText={t => { setEmail(t); clearError('email') }} error={errors.email} keyboardType="email-address" autoCapitalize="none" />
      <View>
        <TextField
          label={t('auth.signup.passwordLabel')}
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

      <PrimaryButton title={t('auth.signup.submit')} onPress={submit} loading={loading} />

      <Text style={styles.switch}>
        {t('auth.signup.haveAccount')} <Text onPress={onLogin} style={styles.switchLink}>{t('auth.signup.loginLink')}</Text>
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
