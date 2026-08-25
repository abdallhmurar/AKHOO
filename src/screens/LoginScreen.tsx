import { useState } from 'react'
import { Pressable, StyleSheet, Text } from 'react-native'
import { Envelope, Eye, EyeSlash, Lock } from 'phosphor-react-native'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { colors, font } from '../lib/theme'
import { dirStyles, useIsRTL } from '../lib/direction'
import { AuthScreenLayout, AuthFooterText } from '../components/AuthScreenLayout'
import { AuthInput } from '../components/AuthInput'
import { AuthPrimaryButton } from '../components/AuthPrimaryButton'

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
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
      if (error) setErrors({ form: error.message })
    } catch (error: any) {
      setErrors({ form: error.message ?? t('common.error') })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthScreenLayout title={t('auth.login.title')} subtitle={t('auth.login.subtitle')}>
      <AuthInput
        Icon={Envelope}
        placeholder={t('auth.login.emailPlaceholder')}
        value={email}
        onChangeText={t => { setEmail(t); clearError('email') }}
        error={errors.email}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <AuthInput
        Icon={Lock}
        placeholder={t('auth.login.passwordPlaceholder')}
        value={password}
        onChangeText={t => { setPassword(t); clearError('password') }}
        error={errors.password}
        secureTextEntry={!showPassword}
        trailing={
          <Pressable onPress={() => setShowPassword(s => !s)} hitSlop={8}>
            {showPassword ? <EyeSlash size={19} color={colors.muted} /> : <Eye size={19} color={colors.muted} />}
          </Pressable>
        }
      />

      <Text onPress={() => onForgotPassword(email)} style={[styles.forgot, dir.textEnd]}>{t('auth.login.forgotPassword')}</Text>

      {errors.form ? <Text style={styles.formError}>{errors.form}</Text> : null}

      <AuthPrimaryButton title={t('auth.login.submit')} onPress={submit} loading={loading} />

      <AuthFooterText>
        {t('auth.login.noAccount')} <Text onPress={onSignUp} style={styles.switchLink}>{t('auth.login.signUpLink')}</Text>
      </AuthFooterText>
    </AuthScreenLayout>
  )
}

const styles = StyleSheet.create({
  forgot: { color: colors.forest, fontFamily: font.medium, fontSize: 13, marginTop: -6 },
  formError: { color: colors.danger, textAlign: 'center', fontSize: 13, fontFamily: font.bold, backgroundColor: colors.dangerSoft, borderRadius: 12, paddingVertical: 10 },
  switchLink: { color: colors.forest, fontFamily: font.bold }
})
