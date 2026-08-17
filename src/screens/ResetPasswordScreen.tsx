import { useState } from 'react'
import { Alert, Pressable } from 'react-native'
import { Eye, EyeSlash } from 'phosphor-react-native'
import { supabase } from '../lib/supabase'
import { colors } from '../lib/theme'
import { AuthShell } from '../components/AuthShell'
import { TextField } from '../components/TextField'
import { PrimaryButton } from '../components/PrimaryButton'
import { PasswordStrength } from '../components/PasswordStrength'

export function ResetPasswordScreen({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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
    <AuthShell scene="success" title="كلمة مرور جديدة" subtitle="اختار كلمة مرور جديدة لحسابك.">
      <TextField
        label="كلمة المرور الجديدة"
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
      <PrimaryButton title="حفظ كلمة المرور" onPress={submit} loading={loading} />
    </AuthShell>
  )
}
