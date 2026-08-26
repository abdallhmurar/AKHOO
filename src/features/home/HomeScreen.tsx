import { useState } from 'react'
import { Linking, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Bell, Buildings, FirstAid, HandHeart, Heartbeat, Lifebuoy, MapPin, NavigationArrow, ShieldWarning, Sparkle, UsersThree } from 'phosphor-react-native'
import { useIsRTL } from '../../lib/direction'
import { palette, radius, space, useSanadTheme } from '../../lib/theme'
import { useAppTypography } from '../../lib/typography'
import { useAuth, useLanguageDirection, useMission } from '../../providers'
import { ActionCard, AppScreen, CivicWordmark, SectionHeading } from '../../components/v2'
import { Avatar, BottomSheet, Button, Card, IconButton, StatusBadge, Surface } from '../../components/ui'
import { useV2Text } from '../v2Copy'

function useTrilingual() {
  const { language } = useLanguageDirection()
  return (ar: string, he: string, en: string) => language === 'en' ? en : language === 'he' ? he : ar
}

const emergencyLines = [
  { number: '100', icon: ShieldWarning, labels: { ar: 'الشرطة', he: 'משטרה', en: 'Police' }, tone: 'emergency' },
  { number: '101', icon: FirstAid, labels: { ar: 'نجمة داود الحمراء', he: 'מגן דוד אדום', en: 'Ambulance (MDA)' }, tone: 'emergency' },
  { number: '102', icon: Heartbeat, labels: { ar: 'الإطفاء والإنقاذ', he: 'כבאות והצלה', en: 'Fire & Rescue' }, tone: 'emergency' },
  { number: '104', icon: Lifebuoy, labels: { ar: 'قيادة الجبهة الداخلية', he: 'פיקוד העורף', en: 'Home Front Command' }, tone: 'primary' },
  { number: '106', icon: Buildings, labels: { ar: 'مركز بلدية القدس', he: 'המוקד העירוני ירושלים', en: 'Jerusalem municipal hotline' }, tone: 'community' }
] as const

export function HomeScreen() {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const t = useV2Text()
  const tr = useTrilingual()
  const router = useRouter()
  const { profile } = useAuth()
  const { activeMission, isRequester } = useMission()
  const { language } = useLanguageDirection()
  const [emergencyOpen, setEmergencyOpen] = useState(false)
  const name = profile?.full_name?.trim().split(/\s+/)[0] || tr('جارنا', 'שכן/ה', 'neighbor')
  return (
    <AppScreen contentStyle={styles.content}>
      <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <View style={styles.headerCopy}><CivicWordmark compact /><Text style={[typography.small, { color: theme.colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{tr(`أهلاً ${name}، كيف يمكننا أن نساند اليوم؟`, `שלום ${name}, איך אפשר לעזור היום?`, `Hello ${name}, how can we support today?`)}</Text></View>
        <View style={[styles.headerActions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}><IconButton label={tr('الإشعارات', 'התראות', 'Notifications')} icon={<Bell size={21} color={theme.colors.textPrimary} />} onPress={() => router.push('/account/notifications')} /><Avatar name={profile?.full_name || 'SANAD'} uri={profile?.avatar_url} size={44} /></View>
      </View>

      <View style={[styles.location, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}><MapPin size={15} color={theme.colors.community} weight="fill" /><Text style={[typography.caption, { color: theme.colors.community }]}>Jerusalem · القدس · ירושלים</Text><StatusBadge label={tr('متاح', 'פעיל', 'Live')} tone="success" dot /></View>

      {activeMission ? (
        <Card tone="navy" bordered={false} elevation="elevated" onPress={() => router.push({ pathname: '/mission/[missionId]', params: { missionId: activeMission.id } })}>
          <View style={[styles.activeTop, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}><StatusBadge label={t('mission.live')} tone="info" dot /><NavigationArrow size={23} color={palette.civicSignalSoft} weight="fill" /></View>
          <Text style={[typography.h2, { color: palette.onCivic, textAlign: isRTL ? 'right' : 'left' }]}>{isRequester ? tr('المساندة في طريقها إليك', 'העזרה בדרך אליך', 'Support is on the way') : tr('لديك مهمة مساندة نشطة', 'יש לך משימת סיוע פעילה', 'You have an active support mission')}</Text>
          <Text style={[typography.small, { color: palette.onCivicMuted, textAlign: isRTL ? 'right' : 'left' }]}>{tr('افتح الخريطة والتحديثات المباشرة', 'פתחו מפה ועדכונים בזמן אמת', 'Open live map and updates')}</Text>
        </Card>
      ) : null}

      <View style={styles.heroCopy}><Text style={[typography.h1, { color: theme.colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{t('home.title')}</Text><Text style={[typography.body, { color: theme.colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{t('home.greeting')}</Text></View>

      <View style={[styles.dual, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <ActionCard large Icon={Lifebuoy} tone="primary" label={tr('اطلب مساندة', 'בקשת סיוע', 'REQUEST')} title={t('home.need')} description={t('home.needBody')} onPress={() => router.push('/requester/emergency')} />
        <ActionCard large Icon={HandHeart} tone="community" label={tr('ساند شخصاً', 'הצעת עזרה', 'OFFER')} title={t('home.help')} description={t('home.helpBody')} onPress={() => router.push('/helper')} />
      </View>

      <Surface tone="emergency" bordered={false} padding="lg" style={styles.emergencyStrip}>
        <View style={[styles.emergencyRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}><View style={styles.emergencyIcon}><ShieldWarning size={22} color={theme.colors.emergency} weight="duotone" /></View><View style={styles.emergencyCopy}><Text style={[typography.title, { color: theme.colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{t('home.emergency')}</Text><Text style={[typography.caption, { color: theme.colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{t('home.emergencyBody')}</Text></View><Button fullWidth={false} size="sm" variant="danger" label={tr('فتح', 'פתיחה', 'Open')} onPress={() => setEmergencyOpen(true)} /></View>
      </Surface>

      <SectionHeading title={tr('من مجتمعنا', 'מהקהילה שלנו', 'From our community')} subtitle={tr('خدمات ومكافآت محلية موثوقة', 'שירותים ותגמולים מקומיים מהימנים', 'Trusted local services and rewards')} />
      <View style={[styles.communityCards, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <ActionCard Icon={Buildings} tone="neutral" title={t('community.businesses')} description={tr('مصالح مقدسية موثقة', 'עסקים ירושלמיים מאומתים', 'Verified Jerusalem businesses')} onPress={() => router.push('/community/businesses')} />
        <ActionCard Icon={Sparkle} tone="reward" title={t('community.rewards')} description={tr('حوّل العطاء إلى أثر', 'הופכים עזרה להשפעה', 'Turn service into impact')} onPress={() => router.push('/community/rewards')} />
      </View>

      <View style={[styles.trustRow, { flexDirection: isRTL ? 'row-reverse' : 'row', backgroundColor: theme.colors.communitySoft }]}><UsersThree size={22} color={theme.colors.community} weight="duotone" /><Text style={[typography.small, { color: theme.colors.textSecondary, flex: 1, textAlign: isRTL ? 'right' : 'left' }]}>{tr('هويتك وموقعك لا يظهران إلا للطرف المطابق أثناء المهمة.', 'הזהות והמיקום שלך מוצגים רק לצד המותאם במהלך המשימה.', 'Your identity and location are visible only to your matched person during a mission.')}</Text></View>

      <BottomSheet visible={emergencyOpen} onClose={() => setEmergencyOpen(false)} title={t('home.emergency')} subtitle={t('home.emergencyBody')}>
        <Surface tone="emergency" bordered={false} padding="md"><Text style={[typography.smallMedium, { color: theme.colors.emergency, textAlign: isRTL ? 'right' : 'left' }]}>{tr('إذا كان هناك خطر مباشر، لا تنتظر تطابق سَنَد.', 'אם קיימת סכנה מיידית, אין להמתין להתאמה בסַנַד.', 'If anyone is in immediate danger, do not wait for SANAD matching.')}</Text></Surface>
        {emergencyLines.map(line => { const Icon = line.icon; const tone = theme.colors[line.tone]; return <View key={line.number} style={[styles.line, { flexDirection: isRTL ? 'row-reverse' : 'row', borderColor: theme.colors.border }]}><View style={[styles.lineIcon, { backgroundColor: `${tone}14` }]}><Icon size={21} color={tone} weight="duotone" /></View><View style={styles.lineCopy}><Text style={[typography.bodyMedium, { color: theme.colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{line.labels[language]}</Text><Text style={[typography.caption, { color: theme.colors.textMuted }]}>{line.number}</Text></View><Button fullWidth={false} size="sm" variant={line.tone === 'emergency' ? 'danger' : 'outline'} label={tr('اتصال', 'חיוג', 'Call')} onPress={() => Linking.openURL(`tel:${line.number}`)} /></View> })}
        <Button label={tr('لا توجد حالة طارئة — متابعة طلب سَنَد', 'אין מצב חירום — המשך לבקשת סַנַד', 'Not an emergency — continue with SANAD')} variant="ghost" onPress={() => { setEmergencyOpen(false); router.push('/requester/emergency') }} />
      </BottomSheet>
    </AppScreen>
  )
}

const styles = StyleSheet.create({
  content: { paddingTop: space.lg, gap: space.xl },
  header: { alignItems: 'center', gap: space.md },
  headerCopy: { flex: 1, gap: space.sm },
  headerActions: { alignItems: 'center', gap: space.sm },
  location: { alignItems: 'center', gap: space.sm, flexWrap: 'wrap' },
  activeTop: { justifyContent: 'space-between', alignItems: 'center', marginBottom: space.lg },
  heroCopy: { gap: space.sm },
  dual: { gap: space.md },
  emergencyStrip: { borderRadius: radius.lg },
  emergencyRow: { alignItems: 'center', gap: space.md },
  emergencyIcon: { width: 42, height: 42, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.whiteAlpha60 },
  emergencyCopy: { flex: 1, gap: 2 },
  communityCards: { gap: space.md },
  trustRow: { alignItems: 'flex-start', gap: space.md, padding: space.lg, borderRadius: radius.lg },
  line: { minHeight: 68, alignItems: 'center', gap: space.md, borderBottomWidth: StyleSheet.hairlineWidth },
  lineIcon: { width: 42, height: 42, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  lineCopy: { flex: 1, gap: 1 }
})
