import { useState } from 'react'
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ArrowLeft, ArrowRight, CheckCircle, EnvelopeSimple, GlobeHemisphereWest, LockKey, ShieldCheck, WifiSlash } from 'phosphor-react-native'
import { useIsRTL } from '../../lib/direction'
import { normalizePhone } from '../../lib/phone'
import { civicColors, palette, radius, shadow, space, useSanadTheme } from '../../lib/theme'
import { useAppTypography } from '../../lib/typography'
import { useAuth, useLanguageDirection, useNetworkStatus } from '../../providers'
import { authRepository } from '../../repositories/authRepository'
import { localizeAppError } from '../../services/errors'
import { AppScreen, CivicMark, CivicWordmark, JerusalemSignal } from '../../components/v2'
import { Button, Card, IconButton, OfflineState, StatusBadge, TextField, useToast } from '../../components/ui'
import { useV2Text } from '../v2Copy'

function AuthFrame({ kicker, title, body, children, back = false }: { kicker?: string; title: string; body: string; children: React.ReactNode; back?: boolean }) {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const tr = useTrilingual()
  const router = useRouter()
  const Back = isRTL ? ArrowRight : ArrowLeft
  return (
    <AppScreen background={civicColors.navy} contentStyle={styles.frameContent}>
      <View style={styles.hero}>
        <View style={[styles.topRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          {back ? <IconButton tone="navy" label={tr('العودة', 'חזרה', 'Back')} icon={<Back size={21} color={palette.onCivic} />} onPress={() => router.back()} /> : <CivicMark size={48} inverse />}
          <JerusalemSignal />
        </View>
        {kicker ? <Text style={[typography.eyebrow, { color: palette.civicAccentText, textAlign: isRTL ? 'right' : 'left' }]}>{kicker}</Text> : null}
        <Text style={[typography.hero, { color: palette.onCivic, textAlign: isRTL ? 'right' : 'left' }]}>{title}</Text>
        <Text style={[typography.body, { color: palette.onCivicMuted, textAlign: isRTL ? 'right' : 'left' }]}>{body}</Text>
      </View>
      <View style={[styles.formCard, shadow.floating, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>{children}</View>
    </AppScreen>
  )
}

function InlineLink({ label, onPress }: { label: string; onPress: () => void }) {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  return <Pressable accessibilityRole="link" onPress={onPress} hitSlop={8}><Text style={[typography.smallMedium, { color: theme.colors.primary }]}>{label}</Text></Pressable>
}

function useTrilingual() {
  const { language } = useLanguageDirection()
  return (ar: string, he: string, en: string) => language === 'en' ? en : language === 'he' ? he : ar
}

export function LanguageSelectionScreen() {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const t = useV2Text()
  const router = useRouter()
  const { session } = useAuth()
  const { language, setLanguage } = useLanguageDirection()
  const [selected, setSelected] = useState(language)
  const options = [
    { key: 'ar' as const, native: 'العربية', secondary: 'Arabic', direction: 'RTL' },
    { key: 'he' as const, native: 'עברית', secondary: 'Hebrew', direction: 'RTL' },
    { key: 'en' as const, native: 'English', secondary: 'English', direction: 'LTR' }
  ]
  return (
    <AppScreen background={theme.colors.background} contentStyle={styles.languageContent}>
      <View style={styles.languageBrand}><CivicWordmark /><View style={styles.signalDots}><View style={[styles.signalDot, { backgroundColor: theme.colors.primary }]} /><View style={[styles.signalDot, { backgroundColor: theme.colors.community }]} /><View style={[styles.signalDot, { backgroundColor: theme.colors.reward }]} /></View></View>
      <View style={styles.languageHeading}>
        <Text style={[typography.hero, { color: theme.colors.textPrimary }]}>{t('language.title')}</Text>
        <Text style={[typography.body, { color: theme.colors.textSecondary }]}>{t('language.subtitle')}</Text>
      </View>
      <View style={styles.languageList}>{options.map(option => {
        const active = selected === option.key
        return <Pressable key={option.key} accessibilityRole="radio" accessibilityState={{ checked: active }} onPress={() => setSelected(option.key)} style={[styles.languageOption, { backgroundColor: active ? theme.colors.primarySoft : theme.colors.surface, borderColor: active ? theme.colors.primary : theme.colors.border }]}>
          <View style={[styles.languageGlyph, { backgroundColor: active ? theme.colors.primary : theme.colors.surfaceMuted }]}><GlobeHemisphereWest size={23} color={active ? theme.colors.onPrimary : theme.colors.textSecondary} weight="duotone" /></View>
          <View style={styles.languageOptionCopy}><Text style={[typography.h3, { color: theme.colors.textPrimary }]}>{option.native}</Text><Text style={[typography.caption, { color: theme.colors.textSecondary }]}>{option.secondary} · {option.direction}</Text></View>
          <View style={[styles.radio, { borderColor: active ? theme.colors.primary : theme.colors.borderStrong }]}>{active ? <View style={[styles.radioFill, { backgroundColor: theme.colors.primary }]} /> : null}</View>
        </Pressable>
      })}</View>
      <Button label={t('common.continue')} size="lg" onPress={async () => { await setLanguage(selected, true); router.replace(session ? '/(tabs)/account' : '/welcome') }} />
      <Text style={[typography.caption, styles.center, { color: theme.colors.textMuted }]}>Jerusalem · القدس · ירושלים</Text>
    </AppScreen>
  )
}

export function WelcomeScreen() {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const t = useV2Text()
  const router = useRouter()
  return (
    <AppScreen background={civicColors.navy} contentStyle={styles.welcomeContent}>
      <View style={styles.welcomeTop}><CivicWordmark inverse /><View style={[styles.networkVisual, { borderColor: palette.civicBorder }]}><View style={[styles.beaconRing, { borderColor: palette.civicBorderStrong }]}><View style={[styles.beaconCore, { backgroundColor: theme.colors.primary }]}><ShieldCheck size={38} color={palette.onCivic} weight="duotone" /></View></View><View style={[styles.node, styles.nodeOne, { backgroundColor: theme.colors.community }]} /><View style={[styles.node, styles.nodeTwo, { backgroundColor: theme.colors.reward }]} /><View style={[styles.node, styles.nodeThree, { backgroundColor: theme.colors.emergency }]} /></View></View>
      <View style={styles.welcomeCopy}><Text style={[typography.eyebrow, { color: palette.civicAccentStrong, textAlign: isRTL ? 'right' : 'left' }]}>{t('welcome.kicker')}</Text><Text style={[typography.display, { color: palette.onCivic, textAlign: isRTL ? 'right' : 'left' }]}>{t('welcome.title')}</Text><Text style={[typography.body, { color: palette.onCivicMuted, textAlign: isRTL ? 'right' : 'left' }]}>{t('welcome.body')}</Text></View>
      <View style={styles.welcomeActions}><Button label={t('welcome.create')} size="lg" onPress={() => router.push('/signup')} /><Button label={t('welcome.login')} variant="outline" size="lg" onPress={() => router.push('/login')} style={styles.inverseOutline} /></View>
      <Text style={[typography.caption, styles.center, { color: palette.onCivicSubtle }]}>{t('common.notEmergency')}</Text>
    </AppScreen>
  )
}

export function LoginScreen() {
  const t = useV2Text()
  const tr = useTrilingual()
  const router = useRouter()
  const { signIn } = useAuth()
  const network = useNetworkStatus()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | undefined>()
  async function submit() {
    if (!network.isOnline) { router.push('/offline-auth'); return }
    if (!email.trim() || !password) { setError(tr('أدخل البريد وكلمة المرور', 'נא להזין דוא״ל וסיסמה', 'Enter your email and password')); return }
    setLoading(true); setError(undefined)
    try { await signIn(email, password); router.replace('/(tabs)') } catch (cause) { setError(localizeAppError(cause, tr)) } finally { setLoading(false) }
  }
  return <AuthFrame back kicker={tr('وصول موثوق', 'גישה מהימנה', 'TRUSTED ACCESS')} title={t('auth.loginTitle')} body={t('auth.loginBody')}>
    <TextField label={t('auth.email')} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" required />
    <TextField label={t('auth.password')} value={password} onChangeText={setPassword} secureTextEntry secureToggle autoComplete="current-password" required error={error} />
    <View style={styles.endLink}><InlineLink label={t('auth.forgot')} onPress={() => router.push('/forgot-password')} /></View>
    <Button label={t('auth.loginAction')} size="lg" loading={loading} onPress={submit} leading={<LockKey size={19} color={palette.onCivic} weight="duotone" />} />
    <View style={styles.authFooter}><Text>{tr('ليس لديك حساب؟', 'אין לך חשבון?', 'New to SANAD?')}</Text><InlineLink label={t('welcome.create')} onPress={() => router.push('/signup')} /></View>
  </AuthFrame>
}

export function SignupScreen() {
  const theme = useSanadTheme()
  const t = useV2Text()
  const tr = useTrilingual()
  const router = useRouter()
  const { signUp } = useAuth()
  const [form, setForm] = useState({ fullName: '', phone: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const strong = form.password.length >= 8 && /[0-9]/.test(form.password)
  async function submit() {
    const phone = normalizePhone(form.phone)
    if (!form.fullName.trim() || !phone || !form.email.trim() || !strong) { setError(tr('تحقق من الحقول. كلمة المرور 8 أحرف وتتضمن رقماً.', 'בדקו את השדות. הסיסמה חייבת לכלול 8 תווים ומספר.', 'Check every field. Password needs 8 characters and a number.')); return }
    setLoading(true); setError(undefined)
    try { await signUp({ ...form, phone }); router.push({ pathname: '/verify-email', params: { email: form.email } }) } catch (cause) { setError(localizeAppError(cause, tr)) } finally { setLoading(false) }
  }
  return <AuthFrame back kicker={tr('هوية مدنية', 'זהות אזרחית', 'CIVIC IDENTITY')} title={t('auth.signupTitle')} body={t('auth.signupBody')}>
    <TextField label={t('auth.fullName')} value={form.fullName} onChangeText={fullName => setForm(current => ({ ...current, fullName }))} autoComplete="name" required />
    <TextField label={t('auth.phone')} value={form.phone} onChangeText={phone => setForm(current => ({ ...current, phone }))} keyboardType="phone-pad" autoComplete="tel" hint="+972 5X XXX XXXX" required />
    <TextField label={t('auth.email')} value={form.email} onChangeText={email => setForm(current => ({ ...current, email }))} keyboardType="email-address" autoCapitalize="none" autoComplete="email" required />
    <TextField label={t('auth.password')} value={form.password} onChangeText={password => setForm(current => ({ ...current, password }))} secureTextEntry secureToggle autoComplete="new-password" hint={tr('8 أحرف ورقم واحد على الأقل', '8 תווים ולפחות מספר אחד', '8 characters and at least one number')} error={error} required />
    <View style={styles.strength}><View style={[styles.strengthSegment, { backgroundColor: form.password ? (strong ? theme.colors.community : theme.colors.reward) : theme.colors.border }]} /><View style={[styles.strengthSegment, { backgroundColor: strong ? theme.colors.community : theme.colors.border }]} /><View style={[styles.strengthSegment, { backgroundColor: strong && form.password.length > 11 ? theme.colors.community : theme.colors.border }]} /></View>
    <Button label={t('auth.signupAction')} size="lg" loading={loading} onPress={submit} />
    <Text style={styles.legal}>{tr('بإنشاء الحساب، توافق على قواعد السلامة والخصوصية في سَنَد.', 'ביצירת החשבון מסכימים לכללי הבטיחות והפרטיות של סַנַד.', 'By creating an account, you agree to SANAD safety and privacy rules.')}</Text>
  </AuthFrame>
}

export function VerifyEmailScreen() {
  const t = useV2Text()
  const tr = useTrilingual()
  const router = useRouter()
  const { email = '' } = useLocalSearchParams<{ email?: string }>()
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  return <AuthFrame back kicker={tr('خطوة أخيرة', 'שלב אחרון', 'ONE MORE STEP')} title={t('auth.verifyTitle')} body={t('auth.verifyBody')}>
    <View style={styles.stateIcon}><EnvelopeSimple size={38} color={civicColors.signalBlue} weight="duotone" /></View>
    <StatusBadge label={String(email)} tone="info" />
    <Card tone="muted" bordered={false} elevation="none"><Text>{tr('قد يستغرق وصول الرسالة دقيقة. تحقق من البريد غير المرغوب أيضاً.', 'ההודעה עשויה להגיע בתוך דקה. כדאי לבדוק גם בתיקיית הספאם.', 'The message may take a minute. Check your spam folder too.')}</Text></Card>
    <Button label={tr('فتح تطبيق البريد', 'פתיחת אפליקציית דוא״ל', 'Open email app')} onPress={() => Linking.openURL('mailto:')} />
    <Button label={t('auth.resend')} variant="ghost" loading={loading} onPress={async () => { setLoading(true); try { await authRepository.resendVerification(String(email)); toast.show(tr('أُرسل رابط جديد', 'קישור חדש נשלח', 'A new link was sent'), 'success') } finally { setLoading(false) } }} />
    <InlineLink label={t('welcome.login')} onPress={() => router.replace('/login')} />
  </AuthFrame>
}

export function ForgotPasswordScreen() {
  const t = useV2Text()
  const tr = useTrilingual()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | undefined>()
  if (sent) return <AuthFrame back title={t('auth.verifyTitle')} body={tr('أرسلنا رابط إعادة الضبط إلى بريدك.', 'שלחנו קישור לאיפוס לדוא״ל שלך.', 'We sent a reset link to your email.')}><View style={styles.stateIcon}><CheckCircle size={40} color={civicColors.communityTeal} weight="fill" /></View><Button label={t('welcome.login')} onPress={() => router.replace('/login')} /></AuthFrame>
  return <AuthFrame back kicker={tr('استعادة الحساب', 'שחזור חשבון', 'ACCOUNT RECOVERY')} title={t('auth.forgotTitle')} body={t('auth.forgotBody')}>
    <TextField label={t('auth.email')} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" error={error} />
    <Button label={t('auth.sendLink')} size="lg" loading={loading} onPress={async () => { if (!email.trim()) { setError(tr('أدخل بريدك', 'נא להזין דוא״ל', 'Enter your email')); return }; setLoading(true); try { await authRepository.requestPasswordReset(email); setSent(true) } catch (cause) { setError(localizeAppError(cause, tr)) } finally { setLoading(false) } }} />
  </AuthFrame>
}

export function ResetPasswordScreen() {
  const t = useV2Text()
  const tr = useTrilingual()
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | undefined>()
  return <AuthFrame kicker={tr('إعادة ضبط آمنة', 'איפוס מאובטח', 'SECURE RESET')} title={t('auth.resetTitle')} body={tr('اختر كلمة مختلفة عن كلماتك السابقة.', 'בחרו סיסמה שונה מסיסמאות קודמות.', 'Choose a password you have not used before.')}>
    <TextField label={t('auth.password')} value={password} onChangeText={setPassword} secureTextEntry secureToggle autoComplete="new-password" />
    <TextField label={tr('تأكيد كلمة المرور', 'אימות סיסמה', 'Confirm password')} value={confirm} onChangeText={setConfirm} secureTextEntry secureToggle error={error} />
    <Button label={t('common.save')} size="lg" loading={loading} onPress={async () => { if (password.length < 8 || password !== confirm) { setError(tr('تأكد من تطابق الكلمتين ومن 8 أحرف على الأقل.', 'ודאו שהסיסמאות תואמות וכוללות 8 תווים לפחות.', 'Passwords must match and contain at least 8 characters.')); return }; setLoading(true); try { await authRepository.updatePassword(password); router.replace('/(tabs)') } catch (cause) { setError(localizeAppError(cause, tr)) } finally { setLoading(false) } }} />
  </AuthFrame>
}

export function SessionExpiredScreen() {
  const t = useV2Text()
  const { clearSessionState } = useAuth()
  const router = useRouter()
  return <AuthFrame title={t('auth.sessionExpired')} body={t('auth.sessionExpiredBody')}><View style={styles.stateIcon}><LockKey size={40} color={civicColors.emergencyCoral} weight="duotone" /></View><Button label={t('welcome.login')} onPress={() => { clearSessionState(); router.replace('/login') }} /></AuthFrame>
}

export function OfflineAuthScreen() {
  const t = useV2Text()
  const router = useRouter()
  return <AuthFrame back title={t('auth.offlineTitle')} body={t('auth.offlineBody')}><OfflineState title={t('state.offline')} message={t('auth.offlineBody')} actionLabel={t('common.retry')} onAction={() => router.back()} icon={<WifiSlash size={40} color={palette.slate600} />} /></AuthFrame>
}

export function RestrictedAccountScreen() {
  const t = useV2Text()
  const tr = useTrilingual()
  const { signOut } = useAuth()
  const router = useRouter()
  return <AuthFrame title={t('auth.restrictedTitle')} body={t('auth.restrictedBody')}><View style={styles.stateIcon}><ShieldCheck size={40} color={civicColors.emergencyCoral} weight="duotone" /></View><Button label={tr('التواصل مع الدعم', 'יצירת קשר עם התמיכה', 'Contact support')} onPress={() => Linking.openURL('mailto:safety@sanad.app')} /><Button label={t('account.logout')} variant="ghost" onPress={async () => { await signOut(); router.replace('/welcome') }} /></AuthFrame>
}

const styles = StyleSheet.create({
  frameContent: { paddingHorizontal: space.xl, paddingTop: space.lg, paddingBottom: space.xxxl },
  hero: { gap: space.md, paddingBottom: space.xl },
  topRow: { justifyContent: 'space-between', alignItems: 'center', marginBottom: space.lg },
  formCard: { borderRadius: radius.xl, borderWidth: StyleSheet.hairlineWidth, padding: space.xl, gap: space.lg },
  endLink: { alignItems: 'flex-end' },
  authFooter: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6 },
  legal: { fontSize: 12, lineHeight: 18, color: palette.slate500, textAlign: 'center' },
  strength: { flexDirection: 'row', gap: 5 },
  strengthSegment: { flex: 1, height: 5, borderRadius: radius.pill },
  stateIcon: { width: 76, height: 76, borderRadius: 26, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', backgroundColor: civicColors.fog },
  languageContent: { paddingTop: space.xxl, gap: space.xxl },
  languageBrand: { gap: space.lg },
  signalDots: { flexDirection: 'row', gap: 6 },
  signalDot: { width: 34, height: 5, borderRadius: radius.pill },
  languageHeading: { gap: space.sm },
  languageList: { gap: space.md },
  languageOption: { minHeight: 78, borderRadius: radius.lg, borderWidth: 1.5, padding: space.md, flexDirection: 'row', alignItems: 'center', gap: space.md },
  languageGlyph: { width: 48, height: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  languageOptionCopy: { flex: 1, gap: 2 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioFill: { width: 12, height: 12, borderRadius: 6 },
  center: { textAlign: 'center' },
  welcomeContent: { minHeight: 760, justifyContent: 'space-between', paddingTop: space.xl, paddingBottom: space.xxl },
  welcomeTop: { gap: space.xxl },
  networkVisual: { height: 210, borderWidth: 1, borderRadius: radius.xl, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  beaconRing: { width: 138, height: 138, borderRadius: 69, borderWidth: 24, alignItems: 'center', justifyContent: 'center' },
  beaconCore: { width: 72, height: 72, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  node: { position: 'absolute', width: 14, height: 14, borderRadius: 7 },
  nodeOne: { top: 33, left: 48 }, nodeTwo: { bottom: 33, right: 54 }, nodeThree: { top: 42, right: 62 },
  welcomeCopy: { gap: space.md },
  welcomeActions: { gap: space.md },
  inverseOutline: { borderColor: palette.civicOutline, backgroundColor: palette.whiteAlpha04 }
})
