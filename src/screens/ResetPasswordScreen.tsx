import { useState } from 'react'
import { Alert, Pressable } from 'react-native'
import { ArrowLeft, ArrowRight, Eye, EyeSlash } from 'phosphor-react-native'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { colors, radius } from '../lib/theme'
import { useIsRTL } from '../lib/direction'
import { AuthShell } from '../components/AuthShell'
import { TextField } from '../components/TextField'
import { PrimaryButton } from '../components/PrimaryButton'
import { PasswordStrength } from '../components/PasswordStrength'

export function ResetPasswordScreen({ onCancel, onDone }: { onCancel: () => void; onDone: () => void }) {
  const { t } = useTranslation()
  const isRTL = useIsRTL()
  const BackIcon = isRTL ? ArrowRight : ArrowLeft
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
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) {
        setError(updateError.message)
        return
      }
      Alert.alert(t('auth.reset.success.title'), t('auth.reset.success.message'))
      onDone()
    } catch (error: any) {
      setError(error.message ?? t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      scene="success"
      title={t('auth.reset.title')}
      subtitle={t('auth.reset.subtitle')}
      back={<Pressable onPress={onCancel} style={{ alignSelf: isRTL ? 'flex-end' : 'flex-start', width: 38, height: 38, borderRadius: radius.pill, backgroundColor: colors.sageSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}><BackIcon size={18} color={colors.forest} /></Pressable>}
    >
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
