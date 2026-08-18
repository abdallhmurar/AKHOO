import { useState } from 'react'
import { Alert, Pressable } from 'react-native'
import { Eye, EyeSlash } from 'phosphor-react-native'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { colors } from '../lib/theme'
import { AuthShell } from '../components/AuthShell'
import { TextField } from '../components/TextField'
import { PrimaryButton } from '../components/PrimaryButton'
import { PasswordStrength } from '../components/PasswordStrength'

export function ResetPasswordScreen({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation()
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    setError(null)
    if (password.length < 6) {
      setError(t('auth.reset.errors.passwordTooShort'))
      return
    }
    setLoading(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (updateError) {
      setError(updateError.message)
      return
    }
    Alert.alert(t('auth.reset.success.title'), t('auth.reset.success.message'))
    onDone()
  }

  return (
    <AuthShell scene="success" title={t('auth.reset.title')} subtitle={t('auth.reset.subtitle')}>
      <TextField
        label={t('auth.reset.passwordLabel')}
        value={password}
        onChangeText={t => { setPassword(t); setError(null) }}
        error={error ?? undefined}
        secureTextEntry={!showPassword}
        trailing={
          <Pressable onPress={() => setShowPassword(s => !s)} hitSlop={8}>
            {showPassword ? <EyeSlash size={20} color={colors.muted} /> : <Eye size={20} color={colors.muted} />}
          </Pressable>
        }
      />
      <PasswordStrength password={password} />
      <PrimaryButton title={t('auth.reset.submit')} onPress={submit} loading={loading} />
    </AuthShell>
  )
}
