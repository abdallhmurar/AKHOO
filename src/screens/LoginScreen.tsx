import { useState } from 'react'
import { Pressable, StyleSheet, Text } from 'react-native'
import { Eye, EyeSlash } from 'phosphor-react-native'
import { supabase } from '../lib/supabase'
import { colors, font } from '../lib/theme'
import { AuthShell } from '../components/AuthShell'
import { TextField } from '../components/TextField'
import { PrimaryButton } from '../components/PrimaryButton'

type Errors = { email?: string; password?: string; form?: string }

export function LoginScreen({ onSignUp, onForgotPassword }: { onSignUp: () => void; onForgotPassword: (email: string) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Errors>({})

  function clearError(field: keyof Errors) {
    setErrors(current => (current[field] ? { ...current, [field]: undefined } : current))
  }

  async function submit() {
    const next: Errors = {}
    if (!email.trim()) next.email = 'أدخل البريد الإلكتروني.'
    if (password.length < 6) next.password = 'كلمة المرور لازم تكون 6 أحرف على الأقل.'
    setErrors(next)
    if (Object.keys(next).length > 0) return

    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setLoading(false)
    if (error) setErrors({ form: error.message })
  }

  return (
    <AuthShell scene="login" title="تسجيل الدخول" subtitle="أهلاً فيك من جديد.">
      <TextField
        label="البريد الإلكتروني"
        placeholder="you@example.com"
        value={email}
        onChangeText={t => { setEmail(t); clearError('email') }}
        error={errors.email}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextField
        label="كلمة المرور"
        placeholder="••••••••"
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

      <Text onPress={() => onForgotPassword(email)} style={styles.forgot}>نسيت كلمة المرور؟</Text>

      {errors.form ? <Text style={styles.formError}>{errors.form}</Text> : null}

      <PrimaryButton title="تسجيل الدخول" onPress={submit} loading={loading} />

      <Text style={styles.switch}>
        ما عندك حساب؟ <Text onPress={onSignUp} style={styles.switchLink}>إنشاء حساب جديد</Text>
      </Text>
    </AuthShell>
  )
}

const styles = StyleSheet.create({
  forgot: { color: colors.forest, fontFamily: font.medium, fontSize: 13, textAlign: 'left', marginTop: -6 },
  formError: { color: colors.danger, textAlign: 'center', fontSize: 13, fontFamily: font.bold, backgroundColor: colors.dangerSoft, borderRadius: 12, paddingVertical: 10 },
  switch: { color: colors.muted, fontFamily: font.regular, fontSize: 13.5, textAlign: 'center' },
  switchLink: { color: colors.forest, fontFamily: font.bold }
})
