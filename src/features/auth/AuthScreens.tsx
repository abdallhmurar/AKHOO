import { useState } from 'react'
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { AppleLogo, ArrowLeft, ArrowRight, CheckCircle, ShieldCheck } from 'phosphor-react-native'
import { useTranslation } from 'react-i18next'
import { dirStyles, useIsRTL } from '../../lib/direction'
import { normalizePhone } from '../../lib/phone'
import { radius, shadow, space, useSanadTheme } from '../../lib/theme'
import { useAppTypography } from '../../lib/typography'
import { useAuth } from '../../providers'
import { authRepository, type OAuthProvider } from '../../repositories/authRepository'
import { localizeAppError, type ErrorTranslator } from '../../services/errors'
import { AppScreen } from '../../components/v2'
import { Button, GoogleLogoColored, IconButton, TextField } from '../../components/ui'

const welcomeBackground = require('../../../assets/images/1.png')

// Real SANAD auth family, rebuilt on ccodex's Civic Signal components
// (Button/TextField/IconButton) but with the flat, minimal composition the
// user already approved for Auth V2 - no navy hero band, no illustration,
// no mandatory first-launch language picker, no email verification code
// screen, no offline/session-expired detours, no
// confirm-password field, 6-character minimum password (matches the real
// signIn/signUp validation, not an invented 8-char+digit rule).
function AuthFrame({ title, subtitle, onBack, children }: { title: string; subtitle?: string; onBack?: () => void; children: React.ReactNode }) {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const { t } = useTranslation()
  const BackIcon = isRTL ? ArrowRight : ArrowLeft
  return (
    <AppScreen contentStyle={styles.content}>
      <View style={[styles.topRow, dirStyles(isRTL).row]}>
        {onBack ? <IconButton label={t('common.back')} icon={<BackIcon size={18} color={theme.colors.primary} />} onPress={onBack} size={38} tone="primary" /> : <View style={styles.backSpacer} />}
      </View>
      <Text style={[typography.h1, styles.title, { color: theme.colors.textPrimary }]}>{title}</Text>
      {subtitle ? <Text style={[typography.body, styles.subtitle, { color: theme.colors.textSecondary }]}>{subtitle}</Text> : null}
      <View style={styles.body}>{children}</View>
    </AppScreen>
  )
}

function FormError({ message }: { message?: string }) {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  if (!message) return null
  return <Text style={[typography.smallMedium, styles.formError, { color: theme.colors.danger, backgroundColor: theme.colors.dangerSoft }]}>{message}</Text>
}

function useErrorTranslator(): ErrorTranslator {
  const { i18n } = useTranslation()
  return (ar, he, en) => (i18n.language === 'en' ? en : i18n.language === 'he' ? he : ar)
}

function FooterLink({ prompt, label, onPress }: { prompt: string; label: string; onPress: () => void }) {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  return (
    <Text style={[typography.small, styles.footer, { color: theme.colors.textMuted }]}>
      {prompt} <Text onPress={onPress} style={[typography.smallMedium, { color: theme.colors.primary }]}>{label}</Text>
    </Text>
  )
}

/** Google/Apple continue-with buttons - shared by Login and Signup since the same OAuth call signs a returning user in or creates the account on first use. */
function OAuthButtons() {
  const { t } = useTranslation()
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const { signInWithOAuth } = useAuth()
  const tr = useErrorTranslator()
  const [loadingProvider, setLoadingProvider] = useState<OAuthProvider | null>(null)
  const [error, setError] = useState<string | undefined>()

  async function handlePress(provider: OAuthProvider) {
    setError(undefined)
    setLoadingProvider(provider)
    try {
      await signInWithOAuth(provider)
    } catch (cause) {
      setError(localizeAppError(cause, tr))
    } finally {
      setLoadingProvider(null)
    }
  }

  const oauthButtonStyle = { borderRadius: radius.pill, backgroundColor: theme.colors.surface, ...shadow.soft }

  return (
    <View style={styles.oauthGroup}>
      <View style={[styles.dividerRow, dirStyles(isRTL).row]}>
        <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
        <Text style={[typography.small, { color: theme.colors.textMuted }]}>{t('auth.orContinueWith')}</Text>
        <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
      </View>
      <Button
        label={t('auth.continueWithGoogle')}
        variant="secondary"
        style={oauthButtonStyle}
        loading={loadingProvider === 'google'}
        disabled={loadingProvider !== null}
        leading={<GoogleLogoColored size={20} />}
        onPress={() => handlePress('google')}
      />
      <Button
        label={t('auth.continueWithApple')}
        variant="secondary"
        style={oauthButtonStyle}
        loading={loadingProvider === 'apple'}
        disabled={loadingProvider !== null}
        leading={<AppleLogo size={20} color={theme.colors.textPrimary} weight="fill" />}
        onPress={() => handlePress('apple')}
      />
      <FormError message={error} />
    </View>
  )
}

export function WelcomeScreen() {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  return (
    <View style={styles.welcomeBg}>
      <Image
        source={welcomeBackground}
        resizeMode="cover"
        // The plain 1.png export is at @2x-ish pixel dimensions with no
        // density suffix, so Metro reports its intrinsic size as if it
        // were 1x - explicit width/height (not just absoluteFill's inset
        // properties) are needed to make the image actually fill and
        // center-crop within its container instead of rendering at native
        // pixel size and overflowing.
        style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]}
      />
      <View style={[styles.welcomeActions, { paddingBottom: Math.max(insets.bottom, space.lg) }]}>
        <Button label={t('welcome.createAccount')} size="lg" onPress={() => router.push('/signup')} />
        <Button label={t('welcome.haveAccount')} variant="secondary" size="lg" onPress={() => router.push('/login')} />
      </View>
    </View>
  )
}

export function LoginScreen() {
  const { t } = useTranslation()
  const isRTL = useIsRTL()
  const router = useRouter()
  const { signIn } = useAuth()
  const tr = useErrorTranslator()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({})

  async function submit() {
    const next: typeof errors = {}
    if (!email.trim()) next.email = t('auth.login.errors.emailRequired')
    if (password.length < 6) next.password = t('auth.login.errors.passwordTooShort')
    setErrors(next)
    if (Object.keys(next).length > 0) return
    setLoading(true)
    try {
      await signIn(email, password)
      router.replace('/(tabs)')
    } catch (cause) {
      setErrors({ form: localizeAppError(cause, tr) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthFrame title={t('auth.login.title')} subtitle={t('auth.login.subtitle')} onBack={() => router.back()}>
      <TextField label={t('auth.login.emailLabel')} placeholder={t('auth.login.emailPlaceholder')} value={email} onChangeText={value => { setEmail(value); setErrors(e => ({ ...e, email: undefined })) }} error={errors.email} keyboardType="email-address" autoCapitalize="none" />
      <TextField label={t('auth.login.passwordLabel')} placeholder={t('auth.login.passwordPlaceholder')} value={password} onChangeText={value => { setPassword(value); setErrors(e => ({ ...e, password: undefined })) }} error={errors.password} secureTextEntry secureToggle />
      <Pressable onPress={() => router.push({ pathname: '/forgot-password', params: { email } })} hitSlop={8} style={{ alignSelf: isRTL ? 'flex-start' : 'flex-end' }}>
        <ForgotLinkText />
      </Pressable>
      <FormError message={errors.form} />
      <Button label={t('auth.login.submit')} loading={loading} onPress={submit} />
      <OAuthButtons />
      <FooterLink prompt={t('auth.login.noAccount')} label={t('auth.login.signUpLink')} onPress={() => router.push('/signup')} />
    </AuthFrame>
  )
}

function ForgotLinkText() {
  const { t } = useTranslation()
  const theme = useSanadTheme()
  const typography = useAppTypography()
  return <Text style={[typography.smallMedium, { color: theme.colors.primary }]}>{t('auth.login.forgotPassword')}</Text>
}

export function SignupScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const { signUp } = useAuth()
  const tr = useErrorTranslator()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ name?: string; phone?: string; email?: string; password?: string; form?: string }>({})

  async function submit() {
    const next: typeof errors = {}
    if (!name.trim()) next.name = t('auth.signup.errors.nameRequired')
    const normalizedPhone = phone.trim() ? normalizePhone(phone.trim()) : null
    if (!phone.trim()) next.phone = t('auth.signup.errors.phoneRequired')
    else if (!normalizedPhone) next.phone = t('auth.signup.errors.phoneInvalid')
    if (!email.trim()) next.email = t('auth.signup.errors.emailRequired')
    if (password.length < 6) next.password = t('auth.signup.errors.passwordTooShort')
    setErrors(next)
    if (Object.keys(next).length > 0 || !normalizedPhone) return
    setLoading(true)
    try {
      const result = await signUp({ email: email.trim(), password, fullName: name.trim(), phone: normalizedPhone })
      if (!result.session) {
        Alert.alert(t('auth.signup.created.title'), t('auth.signup.created.message'))
        router.replace('/login')
      } else {
        router.replace('/(tabs)')
      }
    } catch (cause) {
      setErrors({ form: localizeAppError(cause, tr) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthFrame title={t('auth.signup.title')} subtitle={t('auth.signup.subtitle')} onBack={() => router.back()}>
      <TextField label={t('auth.signup.nameLabel')} placeholder={t('auth.signup.namePlaceholder')} value={name} onChangeText={value => { setName(value); setErrors(e => ({ ...e, name: undefined })) }} error={errors.name} />
      <TextField label={t('auth.signup.phoneLabel')} placeholder={t('auth.signup.phonePlaceholder')} value={phone} onChangeText={value => { setPhone(value); setErrors(e => ({ ...e, phone: undefined })) }} error={errors.phone} keyboardType="phone-pad" />
      <TextField label={t('auth.signup.emailLabel')} placeholder={t('auth.signup.emailPlaceholder')} value={email} onChangeText={value => { setEmail(value); setErrors(e => ({ ...e, email: undefined })) }} error={errors.email} keyboardType="email-address" autoCapitalize="none" />
      <TextField label={t('auth.signup.passwordLabel')} value={password} onChangeText={value => { setPassword(value); setErrors(e => ({ ...e, password: undefined })) }} error={errors.password} secureTextEntry secureToggle />
      <FormError message={errors.form} />
      <Button label={t('auth.signup.submit')} loading={loading} onPress={submit} />
      <OAuthButtons />
      <FooterLink prompt={t('auth.signup.haveAccount')} label={t('auth.signup.loginLink')} onPress={() => router.replace('/login')} />
    </AuthFrame>
  )
}

export function ForgotPasswordScreen() {
  const theme = useSanadTheme()
  const { t } = useTranslation()
  const router = useRouter()
  const tr = useErrorTranslator()
  const { email: prefilledEmail } = useLocalSearchParams<{ email?: string }>()
  const [email, setEmail] = useState(prefilledEmail ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const [sent, setSent] = useState(false)

  async function submit() {
    if (!email.trim()) { setError(t('auth.forgot.errors.emailRequired')); return }
    setError(undefined)
    setLoading(true)
    try {
      await authRepository.requestPasswordReset(email.trim())
      setSent(true)
    } catch (cause) {
      setError(localizeAppError(cause, tr))
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <AuthFrame title={t('auth.forgot.sent.title')} onBack={() => router.replace('/login')}>
        <CheckCircle size={44} color={theme.colors.success} weight="fill" style={styles.centerIcon} />
        <Text style={styles.sentText}>{t('auth.forgot.sent.text', { email: email.trim() })}</Text>
        <FooterLink prompt="" label={t('auth.forgot.sent.resend')} onPress={submit} />
      </AuthFrame>
    )
  }

  return (
    <AuthFrame title={t('auth.forgot.title')} subtitle={t('auth.forgot.subtitle')} onBack={() => router.replace('/login')}>
      <TextField label={t('auth.forgot.emailLabel')} placeholder={t('auth.forgot.emailPlaceholder')} value={email} onChangeText={value => { setEmail(value); setError(undefined) }} error={error} keyboardType="email-address" autoCapitalize="none" />
      <Button label={t('auth.forgot.submit')} loading={loading} onPress={submit} />
      <FooterLink prompt="" label={t('auth.forgot.backLink')} onPress={() => router.replace('/login')} />
    </AuthFrame>
  )
}

export function ResetPasswordScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const tr = useErrorTranslator()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | undefined>()

  async function submit() {
    if (password.length < 6) { setError(t('auth.reset.errors.passwordTooShort')); return }
    setError(undefined)
    setLoading(true)
    try {
      await authRepository.updatePassword(password)
      Alert.alert(t('auth.reset.success.title'), t('auth.reset.success.message'))
      router.replace('/(tabs)')
    } catch (cause) {
      setError(localizeAppError(cause, tr))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthFrame title={t('auth.reset.title')} subtitle={t('auth.reset.subtitle')}>
      <TextField label={t('auth.reset.passwordLabel')} value={password} onChangeText={value => { setPassword(value); setError(undefined) }} error={error} secureTextEntry secureToggle />
      <Button label={t('auth.reset.submit')} loading={loading} onPress={submit} />
    </AuthFrame>
  )
}

export function RestrictedAccountScreen() {
  const theme = useSanadTheme()
  const { t } = useTranslation()
  const { signOut } = useAuth()
  const router = useRouter()
  return (
    <AuthFrame title={t('auth.restricted.title')} subtitle={t('auth.restricted.message')}>
      <ShieldCheck size={44} color={theme.colors.danger} weight="duotone" style={styles.centerIcon} />
      <Button label={t('account.logout')} variant="outline" onPress={async () => { await signOut(); router.replace('/login') }} />
    </AuthFrame>
  )
}

const styles = StyleSheet.create({
  welcomeBg: { flex: 1, justifyContent: 'flex-end', overflow: 'hidden' },
  welcomeActions: { paddingHorizontal: space.xl, paddingTop: space.lg, gap: space.md },
  content: { paddingTop: space.lg, gap: 0 },
  topRow: { minHeight: 38, marginBottom: space.xl },
  backSpacer: { width: 38, height: 38 },
  title: { textAlign: 'center' },
  subtitle: { textAlign: 'center', marginTop: 8, alignSelf: 'center', maxWidth: '88%' },
  body: { marginTop: space.xxl, gap: space.lg },
  formError: { textAlign: 'center', borderRadius: radius.md, paddingVertical: 10 },
  footer: { textAlign: 'center' },
  centerIcon: { alignSelf: 'center' },
  sentText: { textAlign: 'center' },
  oauthGroup: { gap: space.md },
  dividerRow: { alignItems: 'center', gap: space.sm },
  dividerLine: { flex: 1, height: 1 }
})
