import { useEffect, useState } from 'react'
import { Linking, StyleSheet, Switch, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as ImagePicker from 'expo-image-picker'
import { Bell, ChatCenteredText, Globe, HandHeart, Info, LockKey, MapPin, Phone, Question, ShieldCheck, SlidersHorizontal, TextAa, UserCircle, Users, WarningCircle, WheelchairMotion } from 'phosphor-react-native'
import { useIsRTL } from '../../lib/direction'
import { civicColors, palette, radius, space, useSanadTheme } from '../../lib/theme'
import { useAppTypography } from '../../lib/typography'
import { registerForPushNotificationsAsync } from '../../lib/notifications'
import { useAuth, useLanguageDirection } from '../../providers'
import { deviceRepository } from '../../repositories/deviceRepository'
import { profileRepository } from '../../repositories/profileRepository'
import { safetyRepository } from '../../repositories/safetyRepository'
import { localizeAppError } from '../../services/errors'
import { defaultPreferences, preferencesService, type LocalPreferences } from '../../services/preferencesService'
import { queryKeys } from '../../services/queryKeys'
import { AppScreen, CivicWordmark, ListRow, ScreenHeader, SectionHeading } from '../../components/v2'
import { Avatar, Button, Card, EmptyState, Skeleton, StatusBadge, Surface, TextField, useToast } from '../../components/ui'
import { useV2Text } from '../v2Copy'

function useTrilingual() {
  const { language } = useLanguageDirection()
  return (ar: string, he: string, en: string) => language === 'en' ? en : language === 'he' ? he : ar
}

export function AccountHomeScreen() {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const tr = useTrilingual()
  const t = useV2Text()
  const router = useRouter()
  const { profile, session, signOut } = useAuth()
  const [loggingOut, setLoggingOut] = useState(false)
  return <AppScreen contentStyle={styles.content}>
    <ScreenHeader title={t('account.title')} subtitle={tr('هويتك، تفضيلاتك وسلامتك', 'הזהות, ההעדפות והבטיחות שלכם', 'Identity, preferences, and safety')} />
    <Card tone="navy" bordered={false} leading={<Avatar name={profile?.full_name || 'SANAD'} uri={profile?.avatar_url} size={66} tone="community" />} title={profile?.full_name || tr('عضو سَنَد', 'חבר/ת סַנַד', 'SANAD member')} subtitle={session?.user.email ?? ''} trailing={<StatusBadge label={tr('موثّق', 'מאומת', 'Verified')} tone="success" />} onPress={() => router.push('/account/profile')} />
    <View style={[styles.accountStats, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}><View style={[styles.accountStat, { backgroundColor: theme.colors.primarySoft }]}><HandHeart size={22} color={theme.colors.primary} /><Text style={[typography.title, { color: theme.colors.textPrimary }]}>SANAD</Text><Text style={[typography.caption, { color: theme.colors.textSecondary }]}>{tr('عضو مجتمع', 'חבר/ת קהילה', 'Community member')}</Text></View><View style={[styles.accountStat, { backgroundColor: theme.colors.communitySoft }]}><ShieldCheck size={22} color={theme.colors.community} /><Text style={[typography.title, { color: theme.colors.textPrimary }]}>{tr('خاص', 'פרטי', 'Private')}</Text><Text style={[typography.caption, { color: theme.colors.textSecondary }]}>{tr('بيانات محمية', 'מידע מוגן', 'Protected data')}</Text></View></View>
    <Card elevation="none"><View><ListRow title={t('account.profile')} subtitle={tr('الاسم، الهاتف والصورة', 'שם, טלפון ותמונה', 'Name, phone, and photo')} Icon={UserCircle} onPress={() => router.push('/account/profile')} /><ListRow title={t('account.settings')} subtitle={tr('اللغة، الإشعارات وإمكانية الوصول', 'שפה, התראות ונגישות', 'Language, notifications, accessibility')} Icon={SlidersHorizontal} onPress={() => router.push('/account/settings')} /><ListRow title={t('account.safety')} subtitle={tr('البلاغات والحظر وقواعد اللقاء', 'דיווחים, חסימות וכללי מפגש', 'Reports, blocks, and meeting guidance')} Icon={ShieldCheck} tone="community" onPress={() => router.push('/account/safety')} /><ListRow title={t('account.support')} subtitle={tr('الأسئلة والتواصل مع الفريق', 'שאלות ויצירת קשר', 'Questions and team contact')} Icon={Question} onPress={() => router.push('/account/support')} /></View></Card>
    <Button label={t('account.logout')} variant="ghost" loading={loggingOut} onPress={async () => { setLoggingOut(true); try { await signOut(); router.replace('/welcome') } finally { setLoggingOut(false) } }} />
    <Text style={[typography.caption, styles.center, { color: theme.colors.textMuted }]}>SANAD V2 · Jerusalem launch</Text>
  </AppScreen>
}

export function ProfileScreen() {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const tr = useTrilingual()
  const toast = useToast()
  const { session, profile, refreshProfile } = useAuth()
  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [phone, setPhone] = useState(profile?.phone ?? '')
  const [avatar, setAvatar] = useState(profile?.avatar_url ?? null)
  const save = useMutation({ mutationFn: async () => { if (!session) throw new Error('Not signed in'); let nextAvatar = avatar; if (avatar?.startsWith('file:') || avatar?.startsWith('content:') || avatar?.startsWith('blob:')) { const updated = await profileRepository.uploadAvatar(session.user.id, avatar); nextAvatar = updated.avatar_url }; return profileRepository.update(session.user.id, { fullName, phone, avatarUrl: nextAvatar }) }, onSuccess: async () => { await refreshProfile(); toast.show(tr('تم حفظ الملف الشخصي', 'הפרופיל נשמר', 'Profile saved'), 'success') }, onError: cause => toast.show(localizeAppError(cause, tr), 'error') })
  async function pickAvatar() { const permission = await ImagePicker.requestMediaLibraryPermissionsAsync(); if (!permission.granted) return; const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.75 }); if (!result.canceled && result.assets[0]) setAvatar(result.assets[0].uri) }
  return <AppScreen header={<ScreenHeader title={tr('الملف الشخصي', 'פרופיל', 'Profile')} subtitle={tr('هذه البيانات تظهر للطرف المطابق فقط', 'הפרטים מוצגים רק לצד המותאם', 'Visible only to matched participants')} back />} footer={<Button label={tr('حفظ التغييرات', 'שמירת שינויים', 'Save changes')} loading={save.isPending} onPress={() => save.mutate()} />} contentStyle={styles.content}>
    <View style={styles.avatarEdit}><Avatar name={fullName || 'SANAD'} uri={avatar} size={96} tone="community" /><Button fullWidth={false} label={tr('تغيير الصورة', 'שינוי תמונה', 'Change photo')} variant="outline" onPress={pickAvatar} /></View>
    <TextField label={tr('الاسم الكامل', 'שם מלא', 'Full name')} value={fullName} onChangeText={setFullName} required />
    <TextField label={tr('رقم الهاتف', 'מספר טלפון', 'Phone number')} value={phone} onChangeText={setPhone} keyboardType="phone-pad" hint={tr('يُستخدم للتواصل بعد المطابقة فقط', 'משמש לתקשורת לאחר התאמה בלבד', 'Used only after matching')} />
    <TextField label={tr('البريد الإلكتروني', 'דוא״ל', 'Email')} value={session?.user.email ?? ''} editable={false} />
    <Surface tone="community" bordered={false}><Text style={[typography.small, { color: theme.colors.textPrimary }]}>{tr('لا نعرض هاتفك أو بريدك في الدليل العام.', 'הטלפון והדוא״ל אינם מוצגים במדריך הציבורי.', 'Your phone and email never appear in the public directory.')}</Text></Surface>
  </AppScreen>
}

export function SettingsScreen() {
  const tr = useTrilingual()
  const router = useRouter()
  return <AppScreen header={<ScreenHeader title={tr('الإعدادات', 'הגדרות', 'Settings')} subtitle={tr('خصّص تجربة سَنَد', 'התאימו את חוויית סַנַד', 'Make SANAD work for you')} back />} contentStyle={styles.content}>
    <Card elevation="none"><View><ListRow title={tr('اللغة والاتجاه', 'שפה וכיוון', 'Language and direction')} subtitle={tr('العربية', 'עברית / ערבית / אנגלית', 'Arabic / Hebrew / English')} Icon={Globe} onPress={() => router.push('/account/language')} /><ListRow title={tr('الإشعارات', 'התראות', 'Notifications')} Icon={Bell} onPress={() => router.push('/account/notifications')} /><ListRow title={tr('إمكانية الوصول', 'נגישות', 'Accessibility')} Icon={TextAa} onPress={() => router.push('/account/accessibility')} /><ListRow title={tr('الخصوصية والأذونات', 'פרטיות והרשאות', 'Privacy and permissions')} Icon={LockKey} onPress={() => router.push('/account/privacy')} /></View></Card>
    <SectionHeading title={tr('حول التطبيق', 'אודות האפליקציה', 'About')} />
    <Card elevation="none"><View><ListRow title={tr('قواعد المجتمع', 'כללי הקהילה', 'Community guidelines')} Icon={Users} onPress={() => router.push('/account/safety')} /><ListRow title={tr('عن سَنَد', 'אודות סַנַד', 'About SANAD')} subtitle="V2 · 2.0.0" Icon={Info} /></View></Card>
  </AppScreen>
}

export function NotificationsScreen() {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const tr = useTrilingual()
  const toast = useToast()
  const { session } = useAuth()
  const { language } = useLanguageDirection()
  const [prefs, setPrefs] = useState<LocalPreferences>(defaultPreferences)
  useEffect(() => { preferencesService.get().then(setPrefs) }, [])
  async function toggle(key: keyof LocalPreferences, value: boolean) {
    const next = { ...prefs, [key]: value }; setPrefs(next); await preferencesService.save(next)
    if (key === 'notifications' && value && session) {
      const token = await registerForPushNotificationsAsync()
      if (token) await deviceRepository.register({ userId: session.user.id, token, platform: 'expo', locale: language, enabled: true })
      else toast.show(tr('لم يمنح الجهاز إذن الإشعارات', 'המכשיר לא העניק הרשאת התראות', 'Notification permission was not granted'), 'error')
    }
  }
  return <AppScreen header={<ScreenHeader title={tr('الإشعارات', 'התראות', 'Notifications')} subtitle={tr('اختر ما تريد أن يصلك', 'בחרו אילו עדכונים לקבל', 'Choose what reaches you')} back />} contentStyle={styles.content}>
    <PreferenceSwitch title={tr('السماح بالإشعارات', 'אפשר התראות', 'Allow notifications')} subtitle={tr('المفتاح الرئيسي لكل إشعارات سَنَد', 'המתג הראשי לכל התראות סַנַד', 'Master switch for SANAD notifications')} value={prefs.notifications} onChange={value => toggle('notifications', value)} />
    <Card elevation="none"><View><PreferenceSwitch title={tr('تحديثات المهمة', 'עדכוני משימה', 'Mission updates')} subtitle={tr('المطابقة، الوصول والاكتمال', 'התאמה, הגעה והשלמה', 'Matching, arrival, and completion')} value={prefs.missionUpdates && prefs.notifications} disabled={!prefs.notifications} onChange={value => toggle('missionUpdates', value)} inline /><PreferenceSwitch title={tr('طلبات قريبة', 'בקשות קרובות', 'Nearby requests')} subtitle={tr('للمهارات التي اخترتها', 'למיומנויות שבחרתם', 'For your selected skills')} value={prefs.communityUpdates && prefs.notifications} disabled={!prefs.notifications} onChange={value => toggle('communityUpdates', value)} inline /><PreferenceSwitch title={tr('العروض والمكافآت', 'הטבות ותגמולים', 'Offers and rewards')} subtitle={tr('اختياري وغير ضروري للمهمات', 'אופציונלי ולא נדרש למשימות', 'Optional and never required for missions')} value={prefs.offers && prefs.notifications} disabled={!prefs.notifications} onChange={value => toggle('offers', value)} inline /></View></Card>
    <Surface tone="primary" bordered={false}><Text style={[typography.small, { color: theme.colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{tr('تنبيهات السلامة الحرجة المرتبطة بمهمة نشطة قد تظهر حتى لو أوقفت العروض.', 'התראות בטיחות קריטיות למשימה פעילה עשויות להופיע גם אם הטבות כבויות.', 'Critical safety alerts for an active mission may appear even when offers are off.')}</Text></Surface>
  </AppScreen>
}

function PreferenceSwitch({ title, subtitle, value, onChange, disabled, inline = false }: { title: string; subtitle: string; value: boolean; onChange: (value: boolean) => void; disabled?: boolean; inline?: boolean }) {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const content = <View style={[styles.preference, { flexDirection: isRTL ? 'row-reverse' : 'row', borderColor: theme.colors.border, opacity: disabled ? 0.5 : 1 }]}><View style={{ flex: 1 }}><Text style={[typography.bodyMedium, { color: theme.colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{title}</Text><Text style={[typography.caption, { color: theme.colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{subtitle}</Text></View><Switch accessibilityLabel={title} disabled={disabled} value={value} onValueChange={onChange} trackColor={{ false: theme.colors.surfaceStrong, true: theme.colors.primary }} thumbColor={palette.onCivic} /></View>
  return inline ? content : <Card elevation="none">{content}</Card>
}

export function AccessibilityScreen() {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const tr = useTrilingual()
  const [prefs, setPrefs] = useState<LocalPreferences>(defaultPreferences)
  useEffect(() => { preferencesService.get().then(setPrefs) }, [])
  async function toggle(key: keyof LocalPreferences, value: boolean) { const next = { ...prefs, [key]: value }; setPrefs(next); await preferencesService.save(next) }
  return <AppScreen header={<ScreenHeader title={tr('إمكانية الوصول', 'נגישות', 'Accessibility')} subtitle={tr('وضوح وراحة للجميع', 'בהירות ונוחות לכולם', 'Clarity and comfort for everyone')} back />} contentStyle={styles.content}>
    <View style={[styles.accessPreview, { backgroundColor: civicColors.navy }]}><WheelchairMotion size={38} color={theme.colors.primary} weight="duotone" /><Text style={[typography.h2, { color: palette.onCivic, textAlign: isRTL ? 'right' : 'left' }]}>{tr('سَنَد مصمم ليعمل مع قارئات الشاشة واتجاه RTL.', 'סַנַד תוכנן לעבוד עם קוראי מסך וכיוון RTL.', 'SANAD supports screen readers and RTL by design.')}</Text></View>
    <Card elevation="none"><View><PreferenceSwitch title={tr('نص أكبر', 'טקסט גדול יותר', 'Larger text')} subtitle={tr('يزيد حجم النص داخل واجهة سَنَد', 'מגדיל טקסט בממשק סַנַד', 'Increases text within SANAD')} value={prefs.largerText} onChange={value => toggle('largerText', value)} inline /><PreferenceSwitch title={tr('تباين أعلى', 'ניגודיות גבוהה', 'Higher contrast')} subtitle={tr('يقوّي حدود البطاقات والنص', 'מחזק גבולות וכיתוב', 'Strengthens borders and text')} value={prefs.highContrast} onChange={value => toggle('highContrast', value)} inline /><PreferenceSwitch title={tr('تقليل الحركة', 'הפחתת תנועה', 'Reduce motion')} subtitle={tr('يقلل الانتقالات والنبض البصري', 'מפחית מעברים והבהובים', 'Reduces transitions and pulsing')} value={prefs.reduceMotion} onChange={value => toggle('reduceMotion', value)} inline /></View></Card>
    <Button label={tr('فتح إعدادات الوصول في الجهاز', 'פתיחת הגדרות הנגישות במכשיר', 'Open device accessibility settings')} variant="outline" onPress={() => Linking.openSettings()} />
  </AppScreen>
}

export function PrivacyScreen() {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const tr = useTrilingual()
  return <AppScreen header={<ScreenHeader title={tr('الخصوصية والأذونات', 'פרטיות והרשאות', 'Privacy and permissions')} subtitle={tr('اعرف متى ولماذا نستخدم بياناتك', 'דעו מתי ולמה נעשה שימוש במידע', 'Know when and why data is used')} back />} contentStyle={styles.content}>
    <Surface tone="community" bordered={false} padding="xl"><ShieldCheck size={34} color={theme.colors.community} weight="duotone" /><Text style={[typography.h2, { color: theme.colors.textPrimary, textAlign: isRTL ? 'right' : 'left', marginTop: space.md }]}>{tr('أقل قدر من البيانات، للمدة اللازمة فقط', 'מינימום מידע, רק למשך הזמן הדרוש', 'Minimum data, only for as long as needed')}</Text></Surface>
    <Card elevation="none"><View><ListRow title={tr('الموقع', 'מיקום', 'Location')} subtitle={tr('تقريبي للمطابقة، ودقيق بعد قبول المهمة', 'משוער להתאמה ומדויק לאחר קבלה', 'Approximate for matching; exact after acceptance')} Icon={MapPin} /><ListRow title={tr('وسائط الطلب', 'מדיה בבקשה', 'Request media')} subtitle={tr('خاصة عبر روابط مؤقتة لطرفي المهمة', 'פרטית בקישורים זמניים לצדדי המשימה', 'Private temporary links for mission participants')} Icon={LockKey} /><ListRow title={tr('رقم الهاتف', 'מספר טלפון', 'Phone number')} subtitle={tr('يظهر للطرف المطابق أثناء المهمة فقط', 'מוצג לצד המותאם רק במהלך המשימה', 'Visible only to the match during a mission')} Icon={Phone} /></View></Card>
    <Button label={tr('إدارة أذونات الجهاز', 'ניהול הרשאות המכשיר', 'Manage device permissions')} variant="outline" onPress={() => Linking.openSettings()} />
    <Button label={tr('طلب نسخة من بياناتي', 'בקשת עותק מהמידע שלי', 'Request a copy of my data')} variant="ghost" onPress={() => Linking.openURL('mailto:privacy@sanad.app?subject=Data%20request')} />
  </AppScreen>
}

export function SafetyCenterScreen() {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const tr = useTrilingual()
  const toast = useToast()
  const { session } = useAuth()
  const queryClient = useQueryClient()
  const blocks = useQuery({ queryKey: session ? queryKeys.blocks(session.user.id) : ['blocks'], queryFn: () => safetyRepository.blocks(session!.user.id), enabled: !!session })
  const unblock = useMutation({ mutationFn: (userId: string) => safetyRepository.unblock(userId), onSuccess: async () => { if (session) await queryClient.invalidateQueries({ queryKey: queryKeys.blocks(session.user.id) }); toast.show(tr('تم إلغاء الحظر', 'החסימה הוסרה', 'User unblocked'), 'success') } })
  return <AppScreen header={<ScreenHeader title={tr('مركز الأمان', 'מרכז בטיחות', 'Safety center')} subtitle={tr('أدوات واضحة قبل وأثناء وبعد المهمة', 'כלים ברורים לפני, במהלך ואחרי משימה', 'Clear tools before, during, and after a mission')} back />} contentStyle={styles.content}>
    <View style={[styles.safetyHero, { backgroundColor: civicColors.navy }]}><ShieldCheck size={40} color={theme.colors.community} weight="duotone" /><Text style={[typography.h2, { color: palette.onCivic }]}>{tr('إذا كان هناك خطر مباشر، اتصل بالشرطة 100', 'במקרה של סכנה מיידית, התקשרו למשטרה 100', 'In immediate danger, call Police at 100')}</Text><Button label={tr('اتصال 100', 'חיוג 100', 'Call 100')} variant="danger" onPress={() => Linking.openURL('tel:100')} /></View>
    <Card elevation="none"><View><ListRow title={tr('قواعد اللقاء الآمن', 'כללי מפגש בטוח', 'Safe meeting guidance')} subtitle={tr('التقِ في مكان واضح وشارك فقط ما يلزم', 'היפגשו במקום ברור ושתפו רק מה שנדרש', 'Meet visibly and share only what is needed')} Icon={Users} /><ListRow title={tr('الإبلاغ لفريق الأمان', 'דיווח לצוות הבטיחות', 'Report to safety team')} subtitle="safety@sanad.app" Icon={WarningCircle} onPress={() => Linking.openURL('mailto:safety@sanad.app')} /></View></Card>
    <SectionHeading title={tr('المستخدمون المحظورون', 'משתמשים חסומים', 'Blocked users')} />
    {blocks.isLoading ? <Skeleton height={90} /> : null}
    {!blocks.isLoading && !blocks.data?.length ? <EmptyState title={tr('لا يوجد مستخدمون محظورون', 'אין משתמשים חסומים', 'No blocked users')} message={tr('يمكنك الحظر من أدوات الأمان في أي مهمة.', 'אפשר לחסום מתוך כלי הבטיחות בכל משימה.', 'Block someone from any mission safety menu.')} /> : null}
    {(blocks.data ?? []).map(block => <Card key={block.id} title={tr('مستخدم محظور', 'משתמש/ת חסום/ה', 'Blocked user')} subtitle={new Date(block.created_at).toLocaleDateString()} trailing={<Button fullWidth={false} size="sm" variant="ghost" label={tr('إلغاء الحظر', 'ביטול חסימה', 'Unblock')} loading={unblock.isPending} onPress={() => unblock.mutate(block.blocked_user_id)} />} />)}
  </AppScreen>
}

export function SupportScreen() {
  const tr = useTrilingual()
  return <AppScreen header={<ScreenHeader title={tr('الدعم', 'תמיכה', 'Support')} subtitle={tr('نحن هنا للمساعدة', 'אנחנו כאן כדי לעזור', 'We are here to help')} back />} contentStyle={styles.content}>
    <CivicWordmark />
    <Card elevation="none"><View><ListRow title={tr('مشكلة في مهمة نشطة', 'בעיה במשימה פעילה', 'Issue with an active mission')} subtitle={tr('استخدم أدوات الأمان داخل المهمة لأسرع استجابة', 'השתמשו בכלי הבטיחות במשימה למענה מהיר', 'Use in-mission safety tools for fastest response')} Icon={WarningCircle} /><ListRow title={tr('راسل فريق الدعم', 'שליחת הודעה לתמיכה', 'Email support')} subtitle="support@sanad.app" Icon={ChatCenteredText} onPress={() => Linking.openURL('mailto:support@sanad.app')} /><ListRow title={tr('اتصل ببلدية القدس', 'מוקד עיריית ירושלים', 'Jerusalem municipal hotline')} subtitle="106" Icon={Phone} onPress={() => Linking.openURL('tel:106')} /></View></Card>
    <Surface tone="primary" bordered={false}><Text>{tr('ساعات الدعم التجريبية: الأحد–الخميس، 09:00–17:00. خدمات الطوارئ تعمل بشكل مستقل على مدار الساعة.', 'שעות תמיכה בהרצה: א׳–ה׳, 09:00–17:00. שירותי החירום פועלים בנפרד 24/7.', 'Pilot support hours: Sunday–Thursday, 09:00–17:00. Emergency services operate independently 24/7.')}</Text></Surface>
  </AppScreen>
}

const styles = StyleSheet.create({
  content: { paddingTop: 0, gap: space.xl }, center: { textAlign: 'center' }, accountStats: { gap: space.md }, accountStat: { flex: 1, minHeight: 116, borderRadius: radius.lg, padding: space.lg, gap: space.sm },
  avatarEdit: { alignItems: 'center', gap: space.lg, paddingVertical: space.lg }, preference: { minHeight: 68, alignItems: 'center', gap: space.md, borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: space.md },
  accessPreview: { borderRadius: radius.xl, padding: space.xl, gap: space.lg }, safetyHero: { borderRadius: radius.xl, padding: space.xl, gap: space.lg }
})
