import { useState } from 'react'
import { StyleSheet, Text } from 'react-native'
import { CheckCircle, Envelope } from 'phosphor-react-native'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { colors, font } from '../lib/theme'
import { AuthScreenLayout } from '../components/AuthScreenLayout'
import { AuthInput } from '../components/AuthInput'
import { AuthPrimaryButton } from '../components/AuthPrimaryButton'

export function ForgotPasswordScreen({ initialEmail, onBack }: { initialEmail: string; onBack: () => void }) {
  const { t } = useTranslation()
  const [email, setEmail] = useState(initialEmail)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  async function submit() {
    setError(null)
    if (!email.trim()) {
      setError(t('auth.forgot.errors.emailRequired'))
      return
    }
    setLoading(true)
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: 'sanad://reset-password' })
      if (resetError) {
        setError(resetError.message)
        return
      }
      setSent(true)
    } catch (error: any) {
      setError(error.message ?? t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthScreenLayout title={t('auth.forgot.title')} subtitle={sent ? undefined : t('auth.forgot.subtitle')} onBack={onBack}>
      {sent ? (
        <>
          <CheckCircle size={44} color={colors.success} weight="fill" style={styles.sentIcon} />
          <Text style={styles.sentTitle}>{t('auth.forgot.sent.title')}</Text>
          <Text style={styles.sentText}>{t('auth.forgot.sent.text', { email: email.trim() })}</Text>
          <Text onPress={submit} style={styles.resend}>{t('auth.forgot.sent.resend')}</Text>
        </>
      ) : (
        <>
          <AuthInput
            Icon={Envelope}
            placeholder={t('auth.forgot.emailPlaceholder')}
            value={email}
            onChangeText={t => { setEmail(t); setError(null) }}
            error={error ?? undefined}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <AuthPrimaryButton title={t('auth.forgot.submit')} onPress={submit} loading={loading} />
          <Text onPress={onBack} style={styles.backLink}>{t('auth.forgot.backLink')}</Text>
        </>
      )}
    </AuthScreenLayout>
  )
}

const styles = StyleSheet.create({
  sentIcon: { alignSelf: 'center', marginBottom: 4 },
  sentTitle: { fontFamily: font.extraBold, fontSize: 18, color: colors.text, textAlign: 'center' },
  sentText: { fontFamily: font.regular, fontSize: 14, color: colors.muted, textAlign: 'center', lineHeight: 21 },
  resend: { color: colors.forest, fontFamily: font.bold, fontSize: 13.5, textAlign: 'center', marginTop: 6 },
  backLink: { color: colors.muted, fontFamily: font.medium, fontSize: 13.5, textAlign: 'center' }
})
