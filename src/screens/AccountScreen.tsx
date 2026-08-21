import { useState } from 'react'
import { Alert, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { Camera, SignOut } from 'phosphor-react-native'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { colors, font, radius, space, type } from '../lib/theme'
import { normalizePhone } from '../lib/phone'
import { stopBackgroundLocationUpdates } from '../lib/location'
import { dirStyles, useIsRTL } from '../lib/direction'
import type { Profile } from '../types'
import { Header } from '../components/Header'
import { PrimaryButton } from '../components/PrimaryButton'
import { Screen } from '../components/Screen'
import { Surface } from '../components/Surface'
import { Tactile } from '../components/Tactile'
import { PasswordStrength } from '../components/PasswordStrength'
import { LanguagePicker } from '../components/LanguagePicker'
import { VolunteerPointsCard } from '../components/VolunteerPointsCard'

const MAX_IMAGE_BYTES = 10 * 1024 * 1024

export function AccountScreen({ profile, email, onBack, onUpdated, onViewActivity }: { profile: Profile; email: string; onBack: () => void; onUpdated: (profile: Profile) => void; onViewActivity: () => void }) {
  const { t } = useTranslation()
  const isRTL = useIsRTL()
  const dir = dirStyles(isRTL)
  const [name, setName] = useState(profile.full_name)
  const [phone, setPhone] = useState(profile.phone ?? '')
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
    setProfileError(null)
    const normalizedPhone = phone.trim() ? normalizePhone(phone.trim()) : null
    if (!name.trim() || !phone.trim()) {
      setProfileError(t('account.errors.requiredFields'))
      return
    }
    if (!normalizedPhone) {
      setProfileError(t('account.errors.phoneInvalid'))
      return
    }
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
      const { data, error } = await supabase
        .from('profiles')
        .update({ full_name: name.trim(), phone: normalizedPhone, avatar_url: avatarUrl })
        .eq('id', profile.id)
        .select()
        .single()
      if (error) throw error
      onUpdated(data as Profile)
      Alert.alert(t('account.success.title'), t('account.success.profileUpdated'))
    } catch (error: any) {
      setProfileError(error.message ?? t('common.error'))
    } finally {
      setSavingProfile(false)
    }
  }

  async function savePassword() {
    setPasswordError(null)
    if (newPassword.length < 6) {
      setPasswordError(t('account.errors.passwordTooShort'))
      return
    }
    setSavingPassword(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) {
        setPasswordError(error.message)
        return
      }
      setNewPassword('')
      Alert.alert(t('account.success.title'), t('account.success.passwordUpdated'))
    } catch (error: any) {
      setPasswordError(error.message ?? t('common.error'))
    } finally {
      setSavingPassword(false)
    }
  }

  async function logout() {
    // A volunteer who is currently "available" has a background location
    // task running (src/lib/location.ts) - without stopping it first, the
    // OS-level task keeps reporting GPS coordinates after logout, upserted
    // under whatever user id was last active, including misattributing
    // location to a different account that later logs in on this device.
    await stopBackgroundLocationUpdates()
    await supabase.auth.signOut()
  }

  return (
    <Screen>
      <Header title={t('account.title')} subtitle={t('account.subtitle')} onBack={onBack} />

      <View style={styles.identity}>
        <Pressable onPress={pickAvatar} style={styles.avatarPicker}>
          {avatarUri || profile.avatar_url ? (
            <Image source={{ uri: avatarUri ?? profile.avatar_url! }} style={styles.avatarImage} />
          ) : (
            <Camera size={26} color={colors.muted} weight="light" />
          )}
          <View style={styles.avatarEditBadge}>
            <Camera size={13} color="#fff" weight="fill" />
          </View>
        </Pressable>
        <Text style={styles.identityName}>{name.trim() || t('account.title')}</Text>
        <Text style={styles.identityEmail}>{email}</Text>
      </View>

      <VolunteerPointsCard userId={profile.id} memberSince={profile.created_at} onViewActivity={onViewActivity} />

      <Text style={[styles.sectionLabel, dir.textStart]}>{t('account.sections.personalInfo')}</Text>
      <Surface elevation="soft" padding="lg" style={styles.card}>
        <Text style={[styles.label, dir.textStart]}>{t('account.nameLabel')}</Text>
        <TextInput value={name} onChangeText={t => { setName(t); setProfileError(null) }} style={[styles.input, dir.textStart]} />

        <Text style={[styles.label, dir.textStart]}>{t('account.phoneLabel')}</Text>
        <TextInput value={phone} onChangeText={t => { setPhone(t); setProfileError(null) }} style={[styles.input, dir.textStart]} keyboardType="phone-pad" />

        {profileError ? <Text style={[styles.error, dir.textStart]}>{profileError}</Text> : null}
        <PrimaryButton title={t('account.saveChanges')} onPress={saveProfile} loading={savingProfile} />
      </Surface>

      <Text style={[styles.sectionLabel, dir.textStart]}>{t('account.sections.security')}</Text>
      <Surface elevation="soft" padding="lg" style={styles.card}>
        <TextInput
          value={newPassword}
          onChangeText={t => { setNewPassword(t); setPasswordError(null) }}
          placeholder={t('account.newPasswordPlaceholder')}
          placeholderTextColor={colors.muted}
          style={[styles.input, dir.textStart]}
          secureTextEntry
        />
        <PasswordStrength password={newPassword} />
        {passwordError ? <Text style={[styles.error, dir.textStart]}>{passwordError}</Text> : null}
        <PrimaryButton title={t('account.updatePassword')} tone="light" onPress={savePassword} loading={savingPassword} />
      </Surface>

      <Text style={[styles.sectionLabel, dir.textStart]}>{t('account.sections.preferences')}</Text>
      <Surface elevation="soft" padding="lg" style={styles.card}>
        <LanguagePicker />
      </Surface>

      <Tactile onPress={logout} style={[styles.logoutRow, dir.row]}>
        <SignOut size={18} color={colors.danger} />
        <Text style={styles.logoutText}>{t('account.logout')}</Text>
      </Tactile>
    </Screen>
  )
}

const styles = StyleSheet.create({
  identity: { alignItems: 'center', marginBottom: space.lg },
  avatarPicker: { width: 88, height: 88, borderRadius: 44, backgroundColor: colors.surfaceMuted, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%' },
  avatarEditBadge: { position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13, backgroundColor: colors.forest, borderWidth: 2, borderColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  identityName: { ...type.h2, color: colors.text, marginTop: space.md },
  identityEmail: { color: colors.muted, fontFamily: font.regular, fontSize: 13, marginTop: 2 },

  sectionLabel: { ...type.caption, color: colors.muted, fontFamily: font.bold, textTransform: 'uppercase', marginBottom: space.sm, marginTop: space.xs },
  card: { marginBottom: space.lg, gap: 10 },
  label: { color: colors.muted, fontSize: 13 },
  input: { minHeight: 52, borderRadius: radius.sm, backgroundColor: colors.surfaceMuted, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, color: colors.text, fontSize: 15 },
  error: { color: colors.danger, fontSize: 13, fontWeight: '700' },
  logoutRow: { alignSelf: 'center', alignItems: 'center', gap: 8, paddingVertical: 14, marginBottom: 10 },
  logoutText: { color: colors.danger, fontFamily: font.bold, fontSize: 14 }
})
