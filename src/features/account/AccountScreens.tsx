import { useEffect, useState } from 'react'
import { Alert, Image, Linking, Pressable, StyleSheet, Switch, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import * as Clipboard from 'expo-clipboard'
import { ArrowLeft, ArrowRight, Bell, Camera, Check, Compass, CreditCard, Copy, FileText, Globe, Lifebuoy, Moon, ShieldCheck, SignOut, Trash, UserCircle, Warning, WhatsappLogo } from 'phosphor-react-native'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import { normalizePhone } from '../../lib/phone'
import { translateActionError } from '../../lib/rpcErrors'
import { stopBackgroundLocationUpdates } from '../../lib/location'
import { deleteAccountSafely } from '../../services/authService'
import { localizeAppError, type ErrorTranslator } from '../../services/errors'
import { getNotificationsEnabled, setNotificationsEnabled } from '../../lib/notificationPreference'
import { dirStyles, useIsRTL } from '../../lib/direction'
import { radius, shadow, space, useSanadTheme } from '../../lib/theme'
import { useAppTypography } from '../../lib/typography'
import { useAuth, useThemeMode } from '../../providers'
import { AppScreen, ListRow, ScreenHeader } from '../../components/v2'
import { Button, IconButton, TextField } from '../../components/ui'
import { PasswordStrength } from '../../components/PasswordStrength'
import { LanguagePicker } from '../../components/LanguagePicker'
import { NavigationAppPicker } from '../../components/NavigationAppPicker'
import { LegalDocumentScreen } from './LegalDocumentScreen'
import { privacyPolicyBlocks, termsOfUseBlocks } from './legalContent'

const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const HELP_WHATSAPP_DISPLAY = '0509956046'
const HELP_WHATSAPP_HREF = 'https://wa.me/972509956046'

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
        <ListRow Icon={Compass} title={t('account.navigationApp.title')} onPress={() => router.push('/(tabs)/account/navigation')} />
        <ListRow
          Icon={Moon}
          title={t('account.menu.darkMode')}
          onPress={() => setDark(!isDark)}
          trailing={<Switch value={isDark} onValueChange={setDark} trackColor={{ true: theme.colors.primary, false: theme.colors.border }} thumbColor="#fff" />}
        />
        <ListRow Icon={CreditCard} tone="neutral" title={t('account.menu.billing')} subtitle={t('account.comingSoon')} />
        <ListRow Icon={ShieldCheck} title={t('account.menu.privacy')} onPress={() => router.push('/(tabs)/account/privacy')} />
        <ListRow Icon={Lifebuoy} title={t('account.menu.help')} onPress={() => router.push('/(tabs)/account/help')} />
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
  const router = useRouter()
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

      <Text style={[typography.eyebrow, styles.sectionLabel, { color: theme.colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>{t('account.delete.sectionLabel')}</Text>
      <View style={[styles.menu, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <ListRow Icon={Trash} destructive title={t('account.delete.title')} subtitle={t('account.delete.subtitle')} onPress={() => router.push('/(tabs)/account/delete-warning')} />
      </View>
    </AppScreen>
  )
}

export function AccountDeleteWarningScreen() {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const { t } = useTranslation()
  const router = useRouter()

  return (
    <AppScreen contentStyle={styles.content}>
      <ScreenHeader title={t('account.delete.warning.title')} back />
      <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <Warning size={40} color={theme.colors.danger} weight="fill" />
        <Text style={[typography.body, { color: theme.colors.textPrimary }]}>{t('account.delete.warning.message')}</Text>
        <Button label={t('account.delete.warning.continueButton')} variant="danger" onPress={() => router.push('/(tabs)/account/delete-confirm')} />
      </View>
    </AppScreen>
  )
}

export function AccountDeleteConfirmScreen() {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const { t, i18n } = useTranslation()
  const router = useRouter()

  const [phrase, setPhrase] = useState('')
  const [password, setPassword] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const requiredPhrase = t('account.delete.confirm.phrase')
  const canDelete = phrase.trim() === requiredPhrase && password.length > 0

  async function handleDelete() {
    if (!canDelete) return
    setError(null)
    setDeleting(true)
    try {
      await deleteAccountSafely(password)
      router.replace('/login')
    } catch (cause) {
      const tr: ErrorTranslator = (ar, he, en) => (i18n.language === 'en' ? en : i18n.language === 'he' ? he : ar)
      setError(localizeAppError(cause, tr))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AppScreen contentStyle={styles.content}>
      <ScreenHeader title={t('account.delete.confirm.title')} back />
      <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <Text style={[typography.body, { color: theme.colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{t('account.delete.confirm.instruction')}</Text>
        <Text style={[typography.h3, { color: theme.colors.danger, textAlign: isRTL ? 'right' : 'left' }]}>{requiredPhrase}</Text>
        <TextField label={t('account.delete.confirm.phraseLabel')} value={phrase} onChangeText={value => { setPhrase(value); setError(null) }} />
        <TextField label={t('account.delete.confirm.passwordLabel')} value={password} onChangeText={value => { setPassword(value); setError(null) }} secureTextEntry secureToggle />
        {error ? <Text style={[typography.small, { color: theme.colors.danger }]}>{error}</Text> : null}
        <Button label={t('account.delete.confirm.deleteButton')} variant="danger" disabled={!canDelete} loading={deleting} onPress={handleDelete} />
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

export function AccountNavigationScreen() {
  const theme = useSanadTheme()
  const { t } = useTranslation()
  return (
    <AppScreen contentStyle={styles.content}>
      <ScreenHeader title={t('account.navigationApp.title')} back />
      <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <NavigationAppPicker />
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

export function AccountHelpScreen() {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const { t, i18n } = useTranslation()
  const router = useRouter()
  const BackIcon = isRTL ? ArrowRight : ArrowLeft
  const [copied, setCopied] = useState(false)

  async function copyNumber() {
    await Clipboard.setStringAsync(HELP_WHATSAPP_DISPLAY)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const backLabel = i18n.language === 'en' ? 'Back' : i18n.language === 'he' ? 'חזרה' : 'العودة'

  return (
    <AppScreen contentStyle={styles.content} scrollProps={{ contentContainerStyle: { flexGrow: 1 } }}>
      <View style={[styles.brandRow, dirStyles(isRTL).row]}>
        <IconButton label={backLabel} size={42} icon={<BackIcon size={21} color={theme.colors.textPrimary} />} onPress={() => router.back()} />
        <View style={styles.brandLogoWrap}>
          <Image source={require('../../../assets/images/icon.png')} style={styles.brandLogo} resizeMode="contain" />
        </View>
        <View style={styles.brandPlaceholder} />
      </View>

      <View style={styles.helpTitleBlock}>
        <Text style={[typography.h1, { color: theme.colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{t('account.menu.help')}</Text>
        <Text style={[typography.body, { color: theme.colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{t('account.help.subtitle')}</Text>
      </View>

      <View style={styles.helpCardWrap}>
        <View style={[styles.helpCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <View style={[styles.helpIconCircle, { backgroundColor: theme.colors.communitySoft }]}>
            <WhatsappLogo size={42} color={theme.colors.community} weight="fill" />
          </View>
          <Text style={[typography.h3, { color: theme.colors.textPrimary, textAlign: 'center' }]}>{t('account.help.cardTitle')}</Text>
          <Text style={[typography.body, styles.helpCardDescription, { color: theme.colors.textSecondary }]}>{t('account.help.cardDescription')}</Text>

          <Pressable
            onPress={copyNumber}
            accessibilityRole="button"
            style={[styles.phonePill, dirStyles(isRTL).row, { backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.border }]}
          >
            <Text style={[typography.title, { color: theme.colors.textPrimary }]}>{HELP_WHATSAPP_DISPLAY}</Text>
            {copied ? <Check size={16} color={theme.colors.community} weight="bold" /> : <Copy size={16} color={theme.colors.textMuted} />}
          </Pressable>

          <Button
            label={t('account.help.openButton')}
            variant="community"
            leading={<WhatsappLogo size={18} color={theme.colors.onCommunity} weight="fill" />}
            onPress={() => Linking.openURL(HELP_WHATSAPP_HREF)}
          />

          <Text style={[typography.small, styles.helpFootnote, { color: theme.colors.textMuted }]}>{t('account.help.footnote')}</Text>
        </View>
      </View>
    </AppScreen>
  )
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
  logoutRow: { alignSelf: 'center', alignItems: 'center', gap: 8, paddingVertical: 14, marginTop: space.sm },
  brandRow: { alignItems: 'center' },
  brandLogoWrap: { flex: 1, alignItems: 'center' },
  brandLogo: { width: 36, height: 36 },
  brandPlaceholder: { width: 42 },
  helpTitleBlock: { gap: 4, marginTop: space.md },
  helpCardWrap: { flex: 1, justifyContent: 'center' },
  helpCard: { borderRadius: 24, borderWidth: 1, padding: space.xl, gap: space.md, alignItems: 'center', ...shadow.soft },
  helpIconCircle: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center' },
  helpCardDescription: { textAlign: 'center' },
  phonePill: { alignSelf: 'stretch', justifyContent: 'center', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: radius.pill, paddingVertical: 12, paddingHorizontal: space.lg },
  helpFootnote: { textAlign: 'center' }
})
