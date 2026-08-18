import { useState } from 'react'
import { Pressable, StyleSheet, Text } from 'react-native'
import { Eye, EyeSlash } from 'phosphor-react-native'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { colors, font } from '../lib/theme'
import { dirStyles, useIsRTL } from '../lib/direction'
import { AuthShell } from '../components/AuthShell'
import { TextField } from '../components/TextField'
import { PrimaryButton } from '../components/PrimaryButton'

type Errors = { email?: string; password?: string; form?: string }

export function LoginScreen({ onSignUp, onForgotPassword }: { onSignUp: () => void; onForgotPassword: (email: string) => void }) {
  const { t } = useTranslation()
  const dir = dirStyles(useIsRTL())
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
    if (!email.trim()) next.email = t('auth.login.errors.emailRequired')
    if (password.length < 6) next.password = t('auth.login.errors.passwordTooShort')
    setErrors(next)
    if (Object.keys(next).length > 0) return

    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setLoading(false)
    if (error) setErrors({ form: error.message })
  }

  return (
    <AuthShell scene="login" title={t('auth.login.title')} subtitle={t('auth.login.subtitle')}>
      <TextField
        label={t('auth.login.emailLabel')}
        placeholder={t('auth.login.emailPlaceholder')}
        value={email}
        onChangeText={t => { setEmail(t); clearError('email') }}
        error={errors.email}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextField
        label={t('auth.login.passwordLabel')}
        placeholder={t('auth.login.passwordPlaceholder')}
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

      <Text onPress={() => onForgotPassword(email)} style={[styles.forgot, dir.textEnd]}>{t('auth.login.forgotPassword')}</Text>

      {errors.form ? <Text style={styles.formError}>{errors.form}</Text> : null}

      <PrimaryButton title={t('auth.login.submit')} onPress={submit} loading={loading} />

      <Text style={styles.switch}>
        {t('auth.login.noAccount')} <Text onPress={onSignUp} style={styles.switchLink}>{t('auth.login.signUpLink')}</Text>
      </Text>
    </AuthShell>
  )
}

const styles = StyleSheet.create({
  forgot: { color: colors.forest, fontFamily: font.medium, fontSize: 13, marginTop: -6 },
  formError: { color: colors.danger, textAlign: 'center', fontSize: 13, fontFamily: font.bold, backgroundColor: colors.dangerSoft, borderRadius: 12, paddingVertical: 10 },
  switch: { color: colors.muted, fontFamily: font.regular, fontSize: 13.5, textAlign: 'center' },
  switchLink: { color: colors.forest, fontFamily: font.bold }
})
