import { useState } from 'react'
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { Camera, SignOut } from 'phosphor-react-native'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import { normalizePhone } from '../../lib/phone'
import { stopBackgroundLocationUpdates } from '../../lib/location'
import { useIsRTL } from '../../lib/direction'
import { space, useSanadTheme } from '../../lib/theme'
import { useAppTypography } from '../../lib/typography'
import { useAuth } from '../../providers'
import { AppScreen } from '../../components/v2'
import { Button, TextField } from '../../components/ui'
import { PasswordStrength } from '../../components/PasswordStrength'
import { LanguagePicker } from '../../components/LanguagePicker'
import { VolunteerPointsCard } from '../../components/VolunteerPointsCard'

const MAX_IMAGE_BYTES = 10 * 1024 * 1024

// Real SANAD Account - ported from the intact src/screens/AccountScreen.tsx
// business logic (profile update, password change, real points card,
// logout that stops background location) onto ccodex's Civic Signal
// components. Not the invented civic-platform account section: no
// accessibility/notifications/privacy/safety/support sub-pages, no
// blocks/unblock list, no push-preference toggles - none of that exists in
// the real product.
export function AccountHomeScreen() {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const { t } = useTranslation()
  const router = useRouter()
  const { profile, session, refreshProfile, signOut } = useAuth()

  const [name, setName] = useState(profile?.full_name ?? '')
  const [phone, setPhone] = useState(profile?.phone ?? '')
  const [avatarUri, setAvatarUri] = useState<string | null>(null)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)

  const [newPassword, setNewPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)

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

  async function saveProfile() {
    if (!profile || !session) return
    setProfileError(null)
    const normalizedPhone = phone.trim() ? normalizePhone(phone.trim()) : null
    if (!name.trim() || !phone.trim()) { setProfileError(t('account.errors.requiredFields')); return }
    if (!normalizedPhone) { setProfileError(t('account.errors.phoneInvalid')); return }
    setSavingProfile(true)
    try {
      let avatarUrl = profile.avatar_url
      if (avatarUri) {
        const response = await fetch(avatarUri)
        const blob = await response.blob()
        const path = `${profile.id}/avatar.jpg`
        const { error: uploadError } = await supabase.storage.from('avatars').upload(path, blob, { contentType: 'image/jpeg', upsert: true })
        if (uploadError) throw uploadError
        avatarUrl = `${supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl}?t=${Date.now()}`
      }
      const { error } = await supabase.from('profiles').update({ full_name: name.trim(), phone: normalizedPhone, avatar_url: avatarUrl }).eq('id', profile.id)
      if (error) throw error
      await refreshProfile()
      Alert.alert(t('account.success.title'), t('account.success.profileUpdated'))
    } catch (error: any) {
      setProfileError(error.message ?? t('common.error'))
    } finally {
      setSavingProfile(false)
    }
  }

  async function savePassword() {
    setPasswordError(null)
    if (newPassword.length < 6) { setPasswordError(t('account.errors.passwordTooShort')); return }
    setSavingPassword(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) { setPasswordError(error.message); return }
      setNewPassword('')
      Alert.alert(t('account.success.title'), t('account.success.passwordUpdated'))
    } catch (error: any) {
      setPasswordError(error.message ?? t('common.error'))
    } finally {
      setSavingPassword(false)
    }
  }

  async function logout() {
    await stopBackgroundLocationUpdates()
    await signOut()
    router.replace('/login')
  }

  if (!profile) return null

  return (
    <AppScreen contentStyle={styles.content}>
      <Text style={[typography.h1, { color: theme.colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{t('account.title')}</Text>
      <Text style={[typography.small, { color: theme.colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{t('account.subtitle')}</Text>

      <View style={styles.identity}>
        <Pressable onPress={pickAvatar} style={[styles.avatarPicker, { backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.border }]}>
          {avatarUri || profile.avatar_url ? (
            <Image source={{ uri: avatarUri ?? profile.avatar_url! }} style={styles.avatarImage} />
          ) : (
            <Camera size={26} color={theme.colors.textMuted} weight="light" />
          )}
          <View style={[styles.avatarEditBadge, { backgroundColor: theme.colors.primary, borderColor: theme.colors.background }]}>
            <Camera size={13} color={theme.colors.onPrimary} weight="fill" />
          </View>
        </Pressable>
        <Text style={[typography.h2, { color: theme.colors.textPrimary, marginTop: space.md }]}>{name.trim() || t('account.title')}</Text>
        <Text style={[typography.small, { color: theme.colors.textSecondary }]}>{session?.user.email ?? ''}</Text>
      </View>

      <VolunteerPointsCard userId={profile.id} memberSince={profile.created_at} onViewActivity={() => router.push('/(tabs)/activity')} />

      <Text style={[typography.eyebrow, styles.sectionLabel, { color: theme.colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>{t('account.sections.personalInfo')}</Text>
      <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <TextField label={t('account.nameLabel')} value={name} onChangeText={value => { setName(value); setProfileError(null) }} />
        <TextField label={t('account.phoneLabel')} value={phone} onChangeText={value => { setPhone(value); setProfileError(null) }} keyboardType="phone-pad" />
        {profileError ? <Text style={[typography.small, { color: theme.colors.danger }]}>{profileError}</Text> : null}
        <Button label={t('account.saveChanges')} loading={savingProfile} onPress={saveProfile} />
      </View>

      <Text style={[typography.eyebrow, styles.sectionLabel, { color: theme.colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>{t('account.sections.security')}</Text>
      <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <TextField label={t('account.newPasswordPlaceholder')} value={newPassword} onChangeText={value => { setNewPassword(value); setPasswordError(null) }} secureTextEntry secureToggle />
        <PasswordStrength password={newPassword} />
        {passwordError ? <Text style={[typography.small, { color: theme.colors.danger }]}>{passwordError}</Text> : null}
        <Button label={t('account.updatePassword')} variant="outline" loading={savingPassword} onPress={savePassword} />
      </View>

      <Text style={[typography.eyebrow, styles.sectionLabel, { color: theme.colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>{t('account.sections.preferences')}</Text>
      <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <LanguagePicker />
      </View>

      <Pressable onPress={logout} style={[styles.logoutRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <SignOut size={18} color={theme.colors.danger} />
        <Text style={[typography.bodyMedium, { color: theme.colors.danger }]}>{t('account.logout')}</Text>
      </Pressable>
    </AppScreen>
  )
}

const styles = StyleSheet.create({
  content: { paddingTop: space.lg, gap: space.sm },
  identity: { alignItems: 'center', marginTop: space.md, marginBottom: space.sm },
  avatarPicker: { width: 88, height: 88, borderRadius: 44, borderWidth: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%' },
  avatarEditBadge: { position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  sectionLabel: { textTransform: 'uppercase', marginTop: space.xs },
  card: { borderRadius: 18, borderWidth: 1, padding: space.lg, gap: space.md },
  logoutRow: { alignSelf: 'center', alignItems: 'center', gap: 8, paddingVertical: 14, marginTop: space.sm }
})
