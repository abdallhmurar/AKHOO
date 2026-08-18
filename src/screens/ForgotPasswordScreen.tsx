import { useState } from 'react'
import { Pressable, StyleSheet, Text } from 'react-native'
import { ArrowLeft, ArrowRight, CheckCircle } from 'phosphor-react-native'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { colors, font, radius } from '../lib/theme'
import { useIsRTL } from '../lib/direction'
import { AuthShell } from '../components/AuthShell'
import { TextField } from '../components/TextField'
import { PrimaryButton } from '../components/PrimaryButton'

export function ForgotPasswordScreen({ initialEmail, onBack }: { initialEmail: string; onBack: () => void }) {
  const { t } = useTranslation()
  const isRTL = useIsRTL()
  const BackIcon = isRTL ? ArrowRight : ArrowLeft
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
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: 'sanad://reset-password' })
    setLoading(false)
    if (resetError) {
      setError(resetError.message)
      return
    }
    setSent(true)
  }

  return (
    <AuthShell
      scene="forgotPassword"
      title={t('auth.forgot.title')}
      subtitle={sent ? undefined : t('auth.forgot.subtitle')}
      back={<Pressable onPress={onBack} style={[styles.backButton, { alignSelf: isRTL ? 'flex-end' : 'flex-start' }]}><BackIcon size={18} color={colors.forest} /></Pressable>}
    >
      {sent ? (
        <>
          <CheckCircle size={44} color={colors.success} weight="fill" style={styles.sentIcon} />
          <Text style={styles.sentTitle}>{t('auth.forgot.sent.title')}</Text>
          <Text style={styles.sentText}>{t('auth.forgot.sent.text', { email: email.trim() })}</Text>
          <Text onPress={submit} style={styles.resend}>{t('auth.forgot.sent.resend')}</Text>
        </>
      ) : (
        <>
          <TextField
            label={t('auth.forgot.emailLabel')}
            placeholder={t('auth.forgot.emailPlaceholder')}
            value={email}
            onChangeText={t => { setEmail(t); setError(null) }}
            error={error ?? undefined}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <PrimaryButton title={t('auth.forgot.submit')} onPress={submit} loading={loading} />
          <Text onPress={onBack} style={styles.backLink}>{t('auth.forgot.backLink')}</Text>
        </>
      )}
    </AuthShell>
  )
}

const styles = StyleSheet.create({
  backButton: { width: 38, height: 38, borderRadius: radius.pill, backgroundColor: colors.sageSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  sentIcon: { alignSelf: 'center', marginBottom: 4 },
  sentTitle: { fontFamily: font.extraBold, fontSize: 18, color: colors.text, textAlign: 'center' },
  sentText: { fontFamily: font.regular, fontSize: 14, color: colors.muted, textAlign: 'center', lineHeight: 21 },
  resend: { color: colors.forest, fontFamily: font.bold, fontSize: 13.5, textAlign: 'center', marginTop: 6 },
  backLink: { color: colors.muted, fontFamily: font.medium, fontSize: 13.5, textAlign: 'center' }
})
