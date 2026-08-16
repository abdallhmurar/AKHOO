import { useState } from 'react'
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native'
import { supabase } from '../lib/supabase'
import { colors } from '../lib/theme'
import { PrimaryButton } from '../components/PrimaryButton'
import { Screen } from '../components/Screen'
import { PasswordStrength } from '../components/PasswordStrength'

export function ResetPasswordScreen({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    setError(null)
    if (password.length < 6) {
      setError('كلمة المرور لازم تكون 6 أحرف على الأقل.')
      return
    }
    setLoading(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (updateError) {
      setError(updateError.message)
      return
    }
    Alert.alert('تم', 'كلمة المرور تغيّرت بنجاح.')
    onDone()
  }

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.logo}><Text style={styles.logoText}>س</Text></View>
      <Text style={styles.title}>كلمة مرور جديدة</Text>
      <Text style={styles.subtitle}>اختار كلمة مرور جديدة لحسابك.</Text>

      <View style={styles.card}>
        <TextInput
          value={password}
          onChangeText={t => { setPassword(t); setError(null) }}
          placeholder="كلمة المرور الجديدة"
          placeholderTextColor={colors.muted}
          style={styles.input}
          secureTextEntry
          textAlign="right"
        />
        <PasswordStrength password={password} />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <PrimaryButton title="حفظ كلمة المرور" onPress={submit} loading={loading} />
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'center' },
  logo: { width: 84, height: 84, borderRadius: 26, backgroundColor: colors.blue, alignSelf: 'center', alignItems: 'center', justifyContent: 'center' },
  logoText: { color: '#fff', fontSize: 40, fontWeight: '900' },
  title: { marginTop: 16, fontSize: 28, fontWeight: '900', color: colors.text, textAlign: 'center' },
  subtitle: { color: colors.muted, textAlign: 'center', marginTop: 6, fontSize: 15 },
  card: { marginTop: 30, backgroundColor: colors.card, borderRadius: 24, padding: 18, borderWidth: 1, borderColor: colors.border, gap: 12 },
  input: { minHeight: 52, borderRadius: 15, backgroundColor: '#F9FCFF', borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, color: colors.text, fontSize: 15 },
  error: { color: colors.red, textAlign: 'right', fontSize: 13, fontWeight: '700' }
})
