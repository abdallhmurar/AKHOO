import { useState } from 'react'
import { Alert, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { supabase } from '../lib/supabase'
import { colors } from '../lib/theme'
import type { Profile } from '../types'
import { Header } from '../components/Header'
import { PrimaryButton } from '../components/PrimaryButton'
import { Screen } from '../components/Screen'
import { PasswordStrength } from '../components/PasswordStrength'

export function AccountScreen({ profile, email, onBack, onUpdated }: { profile: Profile; email: string; onBack: () => void; onUpdated: (profile: Profile) => void }) {
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
      Alert.alert('لازم إذن الصور', 'لازم تسمح بالوصول لمكتبة الصور حتى تغيّر صورتك.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6, allowsEditing: true, aspect: [1, 1] })
    if (result.canceled || !result.assets[0]) return
    setAvatarUri(result.assets[0].uri)
  }

  async function saveProfile() {
    setProfileError(null)
    if (!name.trim() || !phone.trim()) {
      setProfileError('الاسم ورقم الهاتف إجباريين.')
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
        .update({ full_name: name.trim(), phone: phone.trim(), avatar_url: avatarUrl })
        .eq('id', profile.id)
        .select()
        .single()
      if (error) throw error
      onUpdated(data as Profile)
      Alert.alert('تم', 'تحدّث حسابك بنجاح.')
    } catch (error: any) {
      setProfileError(error.message ?? 'حدث خطأ غير متوقع')
    } finally {
      setSavingProfile(false)
    }
  }

  async function savePassword() {
    setPasswordError(null)
    if (newPassword.length < 6) {
      setPasswordError('كلمة المرور لازم تكون 6 أحرف على الأقل.')
      return
    }
    setSavingPassword(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setSavingPassword(false)
    if (error) {
      setPasswordError(error.message)
      return
    }
    setNewPassword('')
    Alert.alert('تم', 'كلمة المرور تغيّرت بنجاح.')
  }

  return (
    <Screen>
      <Header title="حسابي" subtitle="عدّل معلوماتك الشخصية وكلمة المرور." onBack={onBack} />

      <Pressable onPress={pickAvatar} style={styles.avatarPicker}>
        {avatarUri || profile.avatar_url ? (
          <Image source={{ uri: avatarUri ?? profile.avatar_url! }} style={styles.avatarImage} />
        ) : (
          <Text style={styles.avatarPlaceholder}>📷</Text>
        )}
      </Pressable>
      <Text style={styles.avatarHint}>اضغط على الصورة لتغييرها</Text>

      <View style={styles.card}>
        <Text style={styles.label}>البريد الإلكتروني</Text>
        <Text style={styles.readonly}>{email}</Text>

        <View style={styles.line} />

        <Text style={styles.label}>الاسم الكامل</Text>
        <TextInput value={name} onChangeText={t => { setName(t); setProfileError(null) }} style={styles.input} textAlign="right" />

        <Text style={styles.label}>رقم الهاتف</Text>
        <TextInput value={phone} onChangeText={t => { setPhone(t); setProfileError(null) }} style={styles.input} keyboardType="phone-pad" textAlign="right" />

        {profileError ? <Text style={styles.error}>{profileError}</Text> : null}
        <PrimaryButton title="حفظ التغييرات" onPress={saveProfile} loading={savingProfile} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>تغيير كلمة المرور</Text>
        <TextInput
          value={newPassword}
          onChangeText={t => { setNewPassword(t); setPasswordError(null) }}
          placeholder="كلمة مرور جديدة"
          placeholderTextColor={colors.muted}
          style={styles.input}
          secureTextEntry
          textAlign="right"
        />
        <PasswordStrength password={newPassword} />
        {passwordError ? <Text style={styles.error}>{passwordError}</Text> : null}
        <PrimaryButton title="تحديث كلمة المرور" tone="light" onPress={savePassword} loading={savingPassword} />
      </View>

      <Pressable onPress={() => supabase.auth.signOut()} style={styles.logoutRow}>
        <Text style={styles.logoutText}>تسجيل خروج</Text>
      </Pressable>
    </Screen>
  )
}

const styles = StyleSheet.create({
  avatarPicker: { alignSelf: 'center', width: 96, height: 96, borderRadius: 48, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginTop: 6 },
  avatarImage: { width: '100%', height: '100%' },
  avatarPlaceholder: { fontSize: 30 },
  avatarHint: { color: colors.muted, textAlign: 'center', fontSize: 12, marginTop: 8, marginBottom: 22 },
  card: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 22, padding: 18, marginBottom: 16, gap: 10 },
  cardTitle: { color: colors.text, fontWeight: '900', fontSize: 17, textAlign: 'right', marginBottom: 2 },
  label: { color: colors.muted, textAlign: 'right', fontSize: 13 },
  readonly: { color: colors.text, textAlign: 'right', fontWeight: '800', fontSize: 15 },
  line: { height: 1, backgroundColor: colors.border, marginVertical: 4 },
  input: { minHeight: 52, borderRadius: 15, backgroundColor: '#F9FCFF', borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, color: colors.text, fontSize: 15 },
  error: { color: colors.red, textAlign: 'right', fontSize: 13, fontWeight: '700' },
  logoutRow: { alignItems: 'center', paddingVertical: 14, marginBottom: 10 },
  logoutText: { color: colors.red, fontWeight: '800' }
})
