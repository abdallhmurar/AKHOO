import { useEffect, useState } from 'react'
import { Alert, Image, Pressable, StyleSheet, Switch, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { Bell, Camera, CreditCard, FileText, Globe, Lifebuoy, Moon, ShieldCheck, SignOut, UserCircle } from 'phosphor-react-native'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import { normalizePhone } from '../../lib/phone'
import { translateActionError } from '../../lib/rpcErrors'
import { stopBackgroundLocationUpdates } from '../../lib/location'
import { getNotificationsEnabled, setNotificationsEnabled } from '../../lib/notificationPreference'
import { dirStyles, useIsRTL } from '../../lib/direction'
import { radius, space, useSanadTheme } from '../../lib/theme'
import { useAppTypography } from '../../lib/typography'
import { useAuth, useThemeMode } from '../../providers'
import { AppScreen, ListRow, ScreenHeader } from '../../components/v2'
import { Button, TextField } from '../../components/ui'
import { PasswordStrength } from '../../components/PasswordStrength'
import { LanguagePicker } from '../../components/LanguagePicker'
import { LegalDocumentScreen } from './LegalDocumentScreen'
import { privacyPolicyBlocks, termsOfUseBlocks } from './legalContent'

const MAX_IMAGE_BYTES = 10 * 1024 * 1024

// Real SANAD Account - ported from the intact src/screens/AccountScreen.tsx
// business logic (profile update, password change, real points card, logout
// that stops background location) onto ccodex's Civic Signal components.
// Restructured into a menu-list home (AccountHomeScreen) with the
// personal-info/password form moved to its own AccountProfileScreen, and
// the language switcher to AccountLanguageScreen - Billing/Privacy/Help
// have no real screens behind them yet, so they're inert placeholders.
export function AccountHomeScreen() {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const { t } = useTranslation()
  const router = useRouter()
  const { profile, session, refreshProfile, signOut } = useAuth()
  const { isDark, setDark } = useThemeMode()

  const [avatarUploading, setAvatarUploading] = useState(false)
  const [notificationsEnabled, setNotificationsEnabledState] = useState(true)

  useEffect(() => {
    getNotificationsEnabled().then(setNotificationsEnabledState)
  }, [])

  async function toggleNotifications(value: boolean) {
    setNotificationsEnabledState(value)
    await setNotificationsEnabled(value)
  }

  async function pickAvatar() {
    if (!profile) return
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
    setAvatarUploading(true)
    try {
      const response = await fetch(asset.uri)
      const blob = await response.blob()
      const path = `${profile.id}/avatar.jpg`
      const { error: uploadError } = await supabase.storage.from('avatars').upload(path, blob, { contentType: 'image/jpeg', upsert: true })
      if (uploadError) throw uploadError
      const avatarUrl = `${supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl}?t=${Date.now()}`
      const { error } = await supabase.from('profiles').update({ avatar_url: avatarUrl }).eq('id', profile.id)
      if (error) throw error
      await refreshProfile()
    } catch (cause: any) {
      Alert.alert(t('common.error'), translateActionError(t, cause))
    } finally {
      setAvatarUploading(false)
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
      <ScreenHeader title={t('account.title')} subtitle={t('account.subtitle')} />

      <View style={styles.identity}>
        <Pressable onPress={pickAvatar} disabled={avatarUploading} style={[styles.avatarPicker, { backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.border }]}>
          {profile.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
          ) : (
            <Camera size={34} color={theme.colors.textMuted} weight="light" />
          )}
          <View style={[styles.avatarEditBadge, { backgroundColor: theme.colors.primary, borderColor: theme.colors.background }]}>
            <Camera size={15} color={theme.colors.onPrimary} weight="fill" />
          </View>
        </Pressable>
        <Text style={[typography.h2, { color: theme.colors.textPrimary, marginTop: space.md }]}>{profile.full_name?.trim() || t('account.title')}</Text>
        <Text style={[typography.small, { color: theme.colors.textSecondary }]}>{session?.user.email ?? ''}</Text>
      </View>

      <View style={[styles.menu, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <ListRow Icon={UserCircle} title={t('account.menu.profile')} onPress={() => router.push('/(tabs)/account/profile')} />
        <ListRow
          Icon={Bell}
          title={t('account.menu.notifications')}
          onPress={() => toggleNotifications(!notificationsEnabled)}
          trailing={<Switch value={notificationsEnabled} onValueChange={toggleNotifications} trackColor={{ true: theme.colors.primary, false: theme.colors.border }} thumbColor="#fff" />}
        />
        <ListRow Icon={Globe} title={t('account.language')} onPress={() => router.push('/(tabs)/account/language')} />
        <ListRow
          Icon={Moon}
          title={t('account.menu.darkMode')}
          onPress={() => setDark(!isDark)}
          trailing={<Switch value={isDark} onValueChange={setDark} trackColor={{ true: theme.colors.primary, false: theme.colors.border }} thumbColor="#fff" />}
        />
        <ListRow Icon={CreditCard} tone="neutral" title={t('account.menu.billing')} subtitle={t('account.comingSoon')} />
        <ListRow Icon={ShieldCheck} title={t('account.menu.privacy')} onPress={() => router.push('/(tabs)/account/privacy')} />
        <ListRow Icon={Lifebuoy} tone="neutral" title={t('account.menu.help')} subtitle={t('account.comingSoon')} />
      </View>

      <Pressable onPress={logout} style={[styles.logoutRow, dirStyles(isRTL).row]}>
        <SignOut size={18} color={theme.colors.danger} />
        <Text style={[typography.bodyMedium, { color: theme.colors.danger }]}>{t('account.logout')}</Text>
      </Pressable>
    </AppScreen>
  )
}

export function AccountProfileScreen() {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const { t } = useTranslation()
  const { profile, session, refreshProfile } = useAuth()

  const [name, setName] = useState(profile?.full_name ?? '')
  const [phone, setPhone] = useState(profile?.phone ?? '')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)

  const [newPassword, setNewPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  async function saveProfile() {
    if (!profile) return
    setProfileError(null)
    const normalizedPhone = phone.trim() ? normalizePhone(phone.trim()) : null
    if (!name.trim() || !phone.trim()) { setProfileError(t('account.errors.requiredFields')); return }
    if (!normalizedPhone) { setProfileError(t('account.errors.phoneInvalid')); return }
    setSavingProfile(true)
    try {
      const { error } = await supabase.from('profiles').update({ full_name: name.trim(), phone: normalizedPhone }).eq('id', profile.id)
      if (error) throw error
      await refreshProfile()
      Alert.alert(t('account.success.title'), t('account.success.profileUpdated'))
    } catch (cause: any) {
      setProfileError(translateActionError(t, cause))
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
      if (error) throw error
      setNewPassword('')
      Alert.alert(t('account.success.title'), t('account.success.passwordUpdated'))
    } catch (cause: any) {
      setPasswordError(translateActionError(t, cause))
    } finally {
      setSavingPassword(false)
    }
  }

  if (!profile) return null

  return (
    <AppScreen contentStyle={styles.content}>
      <ScreenHeader title={t('account.menu.profile')} back />

      <Text style={[typography.eyebrow, styles.sectionLabel, { color: theme.colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>{t('account.sections.personalInfo')}</Text>
      <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <TextField label={t('account.emailLabel')} value={session?.user.email ?? ''} editable={false} />
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
    </AppScreen>
  )
}

export function AccountLanguageScreen() {
  const theme = useSanadTheme()
  const { t } = useTranslation()
  return (
    <AppScreen contentStyle={styles.content}>
      <ScreenHeader title={t('account.language')} back />
      <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <LanguagePicker />
      </View>
    </AppScreen>
  )
}

export function AccountPrivacyScreen() {
  const theme = useSanadTheme()
  const { t } = useTranslation()
  const router = useRouter()
  return (
    <AppScreen contentStyle={styles.content}>
      <ScreenHeader title={t('account.menu.privacy')} back />
      <View style={[styles.menu, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <ListRow Icon={ShieldCheck} title={t('account.menu.privacyPolicy')} onPress={() => router.push('/(tabs)/account/privacy-policy')} />
        <ListRow Icon={FileText} title={t('account.menu.termsOfUse')} onPress={() => router.push('/(tabs)/account/terms')} />
      </View>
    </AppScreen>
  )
}

export function AccountPrivacyPolicyScreen() {
  return <LegalDocumentScreen title="سياسة الخصوصية" brand="أخوو | AKHOO" blocks={privacyPolicyBlocks} />
}

export function AccountTermsScreen() {
  return <LegalDocumentScreen title="شروط الاستخدام" brand="أخوو | AKHOO" blocks={termsOfUseBlocks} />
}

const styles = StyleSheet.create({
  content: { paddingTop: space.lg, gap: space.sm },
  identity: { alignItems: 'center', marginTop: space.md, marginBottom: space.sm },
  avatarPicker: { width: 112, height: 112, borderRadius: 56, borderWidth: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%' },
  avatarEditBadge: { position: 'absolute', bottom: 0, right: 0, width: 30, height: 30, borderRadius: 15, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  menu: { borderRadius: radius.lg, borderWidth: 1, paddingHorizontal: space.lg, marginTop: space.sm },
  sectionLabel: { textTransform: 'uppercase', marginTop: space.xs },
  card: { borderRadius: 18, borderWidth: 1, padding: space.lg, gap: space.md },
  logoutRow: { alignSelf: 'center', alignItems: 'center', gap: 8, paddingVertical: 14, marginTop: space.sm }
})
