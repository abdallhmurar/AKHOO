import { useEffect, useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, Basket, Check, CheckCircle, Clock, DotsThreeCircle, HandHeart, HouseLine, Laptop, MapPin, ShieldCheck, Sparkle, Translate, UsersThree, Wheelchair, WheelchairMotion } from 'phosphor-react-native'
import type { Icon } from 'phosphor-react-native'
import { assistanceCategories, localized, type AssistanceCategoryId } from '../../domain/v2'
import { useIsRTL } from '../../lib/direction'
import { getCurrentCoords, startBackgroundLocationUpdates, stopBackgroundLocationUpdates } from '../../lib/location'
import { registerForPushNotificationsAsync } from '../../lib/notifications'
import { civicColors, palette, radius, space, useSanadTheme } from '../../lib/theme'
import { useAppTypography } from '../../lib/typography'
import { useAuth, useLanguageDirection } from '../../providers'
import { helperRepository } from '../../repositories/helperRepository'
import { missionRepository } from '../../repositories/missionRepository'
import { requestRepository } from '../../repositories/requestRepository'
import { localizeAppError } from '../../services/errors'
import { queryKeys } from '../../services/queryKeys'
import type { SupportedLanguage } from '../../repositories/domainTypes'
import { AppScreen, MapPanel, ProgressHeader, ScreenHeader, SectionHeading } from '../../components/v2'
import { Button, Card, EmptyState, Skeleton, StatusBadge, Surface, useToast } from '../../components/ui'
import { useV2Text } from '../v2Copy'
import { useHelperSetup } from './HelperSetupContext'

function useTrilingual() {
  const { language } = useLanguageDirection()
  return (ar: string, he: string, en: string) => language === 'en' ? en : language === 'he' ? he : ar
}

const iconByCategory: Record<AssistanceCategoryId, Icon> = {
  mobility: Wheelchair, errands: Basket, home_support: HouseLine, accessibility: WheelchairMotion,
  accompaniment: UsersThree, language_help: Translate, digital_help: Laptop, community_response: HandHeart, other: DotsThreeCircle
}

export function HelperHomeScreen() {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const tr = useTrilingual()
  const t = useV2Text()
  const router = useRouter()
  const { session } = useAuth()
  const profile = useQuery({ queryKey: session ? queryKeys.helperProfile(session.user.id) : ['helper'], queryFn: () => helperRepository.getProfile(session!.user.id), enabled: !!session })
  const skills = useQuery({ queryKey: session ? queryKeys.helperSkills(session.user.id) : ['helper-skills'], queryFn: () => helperRepository.skills(session!.user.id), enabled: !!session })
  const onboarded = (skills.data?.length ?? 0) > 0
  return <AppScreen header={<ScreenHeader title={t('helper.onboardingTitle')} subtitle={tr('اختر وقتك وحدودك', 'בחרו את הזמן והגבולות שלכם', 'Choose your time and boundaries')} back />} contentStyle={styles.content}>
    <Surface tone="community" bordered={false} padding="xl" style={styles.heroCard}><View style={styles.beacon}><HandHeart size={34} color={palette.onCivic} weight="duotone" /></View><StatusBadge label={tr('مساندة مجتمعية', 'סיוע קהילתי', 'COMMUNITY SUPPORT')} tone="success" /><Text style={[typography.h1, { color: theme.colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{tr('أنت تختار متى وكيف تساعد', 'אתם בוחרים מתי ואיך לעזור', 'You choose when and how to help')}</Text><Text style={[typography.body, { color: theme.colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{t('helper.onboardingBody')}</Text></Surface>
    {!onboarded && !skills.isLoading ? <Card title={tr('أكمل ملف المساند', 'השלימו פרופיל מסייע', 'Complete your helper profile')} subtitle={tr('حدد المهارات واللغات قبل الظهور للطلبات', 'בחרו מיומנויות ושפות לפני הופעה בבקשות', 'Choose skills and languages before seeing requests')} leading={<View style={[styles.iconBox, { backgroundColor: theme.colors.primarySoft }]}><Sparkle size={23} color={theme.colors.primary} /></View>}><Button label={tr('بدء الإعداد', 'התחלת הגדרה', 'Start setup')} onPress={() => router.push('/helper/onboarding')} /></Card> : null}
    {skills.isLoading ? <Skeleton height={140} /> : null}
    {onboarded ? <Card tone={profile.data?.is_available ? 'community' : 'default'} title={profile.data?.is_available ? tr('أنت متاح الآن', 'אתם זמינים עכשיו', 'You are available now') : tr('أنت غير متاح', 'אינכם זמינים', 'You are offline')} subtitle={profile.data?.is_available ? tr('تظهر لك الطلبات القريبة المناسبة', 'בקשות מתאימות בקרבת מקום מוצגות לכם', 'Nearby matching requests are visible') : tr('لن يظهر موقعك ولن تصلك طلبات', 'המיקום שלכם אינו משותף ולא יישלחו בקשות', 'Your location is hidden and no requests are sent')} leading={<View style={[styles.availabilityDot, { backgroundColor: profile.data?.is_available ? theme.colors.community : theme.colors.textMuted }]} />}><Button label={profile.data?.is_available ? tr('فتح الطلبات القريبة', 'פתיחת בקשות קרובות', 'Open nearby requests') : tr('تفعيل وضع المساندة', 'הפעלת מצב סיוע', 'Enable help mode')} variant={profile.data?.is_available ? 'community' : 'primary'} onPress={() => router.push('/helper/availability')} /></Card> : null}
    <SectionHeading title={tr('مبادئ المساندة', 'עקרונות הסיוע', 'Helping principles')} />
    <View style={styles.principles}>{[
      { Icon: ShieldCheck, title: tr('السلامة قبل السرعة', 'בטיחות לפני מהירות', 'Safety before speed'), body: tr('لا تقبل مهمة تتجاوز خبرتك أو حدودك.', 'אל תקבלו משימה מעבר לניסיון או לגבולות שלכם.', 'Never accept beyond your skill or boundaries.') },
      { Icon: Translate, title: tr('الوضوح والاحترام', 'בהירות וכבוד', 'Clarity and respect'), body: tr('استخدم لغة يفهمها الطرفان واحترم الخصوصية.', 'השתמשו בשפה משותפת ושמרו על פרטיות.', 'Use a shared language and respect privacy.') },
      { Icon: Clock, title: tr('التزام واحد في كل مرة', 'משימה אחת בכל פעם', 'One commitment at a time'), body: tr('أنه المهمة الحالية قبل قبول طلب جديد.', 'סיימו את המשימה הנוכחית לפני חדשה.', 'Finish the current mission before accepting another.') }
    ].map(item => <View key={item.title} style={[styles.principle, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}><View style={[styles.iconBox, { backgroundColor: theme.colors.communitySoft }]}><item.Icon size={22} color={theme.colors.community} weight="duotone" /></View><View style={{ flex: 1 }}><Text style={[typography.bodyMedium, { color: theme.colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{item.title}</Text><Text style={[typography.caption, { color: theme.colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{item.body}</Text></View></View>)}</View>
  </AppScreen>
}

export function HelperOnboardingScreen() {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const tr = useTrilingual()
  const router = useRouter()
  return <AppScreen background={civicColors.navy} contentStyle={styles.onboarding}>
    <StatusBadge label={tr('مسار المساند', 'מסלול מסייע', 'HELPER PATH')} tone="success" dot />
    <View style={styles.onboardVisual}><View style={[styles.onboardRing, { borderColor: palette.civicBorder }]}><View style={[styles.onboardCore, { backgroundColor: theme.colors.community }]}><HandHeart size={42} color={palette.onCivic} weight="duotone" /></View></View></View>
    <View style={{ gap: space.md }}><Text style={[typography.hero, { color: palette.onCivic, textAlign: isRTL ? 'right' : 'left' }]}>{tr('المساندة تبدأ بحدود واضحة', 'סיוע מתחיל בגבולות ברורים', 'Helping starts with clear boundaries')}</Text><Text style={[typography.body, { color: palette.onCivicMuted, textAlign: isRTL ? 'right' : 'left' }]}>{tr('سنطلب منك اختيار ما تستطيع فعله، اللغات التي تتحدثها، ومتى تريد أن تكون متاحاً. يمكنك التوقف في أي وقت.', 'נבקש לבחור מה תוכלו לעשות, אילו שפות אתם מדברים ומתי להיות זמינים. אפשר לעצור בכל עת.', 'Choose what you can do, the languages you speak, and when to be available. You can stop at any time.')}</Text></View>
    <View style={styles.onboardSteps}>{[tr('المهارات', 'מיומנויות', 'Skills'), tr('اللغات', 'שפות', 'Languages'), tr('التوفر والموقع', 'זמינות ומיקום', 'Availability & location')].map((label, index) => <View key={label} style={[styles.onboardStep, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}><View style={[styles.stepNumber, { backgroundColor: index === 0 ? theme.colors.primary : palette.navy700 }]}><Text style={{ color: palette.onCivic, fontWeight: '700' }}>{index + 1}</Text></View><Text style={[typography.bodyMedium, { color: palette.onCivic }]}>{label}</Text></View>)}</View>
    <Button label={tr('ابدأ بالمهارات', 'מתחילים במיומנויות', 'Choose skills')} size="lg" onPress={() => router.push('/helper/skills')} />
    <Button label={tr('ليس الآن', 'לא עכשיו', 'Not now')} variant="ghost" onPress={() => router.back()} />
  </AppScreen>
}

export function HelperSkillsScreen() {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const tr = useTrilingual()
  const { language } = useLanguageDirection()
  const router = useRouter()
  const { setup, setCategories } = useHelperSetup()
  function toggle(id: string) { setCategories(setup.categoryIds.includes(id) ? setup.categoryIds.filter(value => value !== id) : [...setup.categoryIds, id]) }
  return <AppScreen header={<ScreenHeader title={tr('مهاراتك وحدودك', 'המיומנויות והגבולות שלכם', 'Your skills and boundaries')} subtitle={tr('اختر ما تستطيع تقديمه بأمان فقط', 'בחרו רק מה שתוכלו להציע בבטחה', 'Choose only what you can safely offer')} back />} footer={<Button label={tr('متابعة إلى اللغات', 'המשך לשפות', 'Continue to languages')} disabled={setup.categoryIds.length === 0} onPress={() => router.push('/helper/languages')} />} contentStyle={styles.content}>
    <ProgressHeader step={1} total={3} label={tr('إعداد ملف المساند', 'הגדרת פרופיל מסייע', 'Helper setup')} />
    <Surface tone="primary" bordered={false}><Text style={[typography.small, { color: theme.colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{tr('الاختيار لا يعني التزاماً دائماً. سترى تفاصيل كل طلب قبل القبول.', 'הבחירה אינה התחייבות קבועה. פרטי כל בקשה יוצגו לפני קבלה.', 'These choices are not a permanent commitment. You will review each request before accepting.')}</Text></Surface>
    <View style={styles.skillList}>{assistanceCategories.map(category => { const Icon = iconByCategory[category.id]; const selected = setup.categoryIds.includes(category.id); return <Pressable key={category.id} accessibilityRole="checkbox" accessibilityState={{ checked: selected }} onPress={() => toggle(category.id)} style={[styles.skill, { flexDirection: isRTL ? 'row-reverse' : 'row', borderColor: selected ? theme.colors.community : theme.colors.border, backgroundColor: selected ? theme.colors.communitySoft : theme.colors.surface }]}><View style={[styles.iconBox, { backgroundColor: selected ? theme.colors.community : theme.colors.surfaceMuted }]}><Icon size={22} color={selected ? theme.colors.onCommunity : theme.colors.textSecondary} weight="duotone" /></View><View style={{ flex: 1 }}><Text style={[typography.bodyMedium, { color: theme.colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{localized(category.label, language)}</Text><Text style={[typography.caption, { color: theme.colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{localized(category.description, language)}</Text></View>{selected ? <CheckCircle size={22} color={theme.colors.community} weight="fill" /> : null}</Pressable> })}</View>
  </AppScreen>
}

export function HelperLanguagesScreen() {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const tr = useTrilingual()
  const router = useRouter()
  const { setup, setLanguages } = useHelperSetup()
  const options: { id: SupportedLanguage; native: string; secondary: string }[] = [{ id: 'ar', native: 'العربية', secondary: 'Arabic' }, { id: 'he', native: 'עברית', secondary: 'Hebrew' }, { id: 'en', native: 'English', secondary: 'English' }]
  function toggle(id: SupportedLanguage) { setLanguages(setup.languages.includes(id) ? setup.languages.filter(value => value !== id) : [...setup.languages, id]) }
  return <AppScreen header={<ScreenHeader title={tr('لغات التواصل', 'שפות לתקשורת', 'Communication languages')} subtitle={tr('اختر اللغات التي يمكنك استخدامها براحة', 'בחרו שפות שבהן נוח לכם לתקשר', 'Choose languages you can use comfortably')} back />} footer={<Button label={tr('مراجعة التوفر', 'המשך לזמינות', 'Continue to availability')} disabled={setup.languages.length === 0} onPress={() => router.push('/helper/availability')} />} contentStyle={styles.content}>
    <ProgressHeader step={2} total={3} label={tr('إعداد ملف المساند', 'הגדרת פרופיל מסייע', 'Helper setup')} />
    <View style={styles.languageList}>{options.map(option => { const selected = setup.languages.includes(option.id); return <Pressable key={option.id} accessibilityRole="checkbox" accessibilityState={{ checked: selected }} onPress={() => toggle(option.id)} style={[styles.language, { flexDirection: isRTL ? 'row-reverse' : 'row', backgroundColor: selected ? theme.colors.primarySoft : theme.colors.surface, borderColor: selected ? theme.colors.primary : theme.colors.border }]}><View style={[styles.languageGlyph, { backgroundColor: selected ? theme.colors.primary : theme.colors.surfaceMuted }]}><Translate size={23} color={selected ? theme.colors.onPrimary : theme.colors.textSecondary} /></View><View style={{ flex: 1 }}><Text style={[typography.h3, { color: theme.colors.textPrimary }]}>{option.native}</Text><Text style={[typography.caption, { color: theme.colors.textSecondary }]}>{option.secondary}</Text></View>{selected ? <CheckCircle size={23} color={theme.colors.primary} weight="fill" /> : null}</Pressable> })}</View>
    <Surface tone="community" bordered={false}><Text style={[typography.small, { color: theme.colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{tr('سنفضّل المطابقة مع شخص يشارك لغة واحدة على الأقل مع طالب المساندة.', 'נעדיף התאמה עם אדם שחולק לפחות שפה אחת עם מבקש הסיוע.', 'We prioritize matches that share at least one language with the requester.')}</Text></Surface>
  </AppScreen>
}

export function HelperAvailabilityScreen() {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const tr = useTrilingual()
  const router = useRouter()
  const toast = useToast()
  const { session } = useAuth()
  const { setup, reset } = useHelperSetup()
  const queryClient = useQueryClient()
  const profile = useQuery({ queryKey: session ? queryKeys.helperProfile(session.user.id) : ['helper'], queryFn: () => helperRepository.getProfile(session!.user.id), enabled: !!session })
  const [loading, setLoading] = useState(false)
  async function enable() {
    if (!session) return
    setLoading(true)
    try {
      if (setup.categoryIds.length && setup.languages.length) {
        await helperRepository.saveSetup(session.user.id, { skills: setup.categoryIds.map(categoryId => ({ categoryId })), languages: setup.languages })
        await reset()
      }
      const coords = await getCurrentCoords()
      const pushToken = await registerForPushNotificationsAsync()
      await helperRepository.setAvailability(session.user.id, true, coords, pushToken)
      await startBackgroundLocationUpdates(session.user.id, { title: tr('سَنَد: وضع المساندة نشط', 'סַנַד: מצב סיוע פעיל', 'SANAD help mode is active'), body: tr('يُستخدم موقعك لإظهار الطلبات القريبة المناسبة.', 'המיקום משמש להצגת בקשות מתאימות בקרבת מקום.', 'Your location is used to show matching nearby requests.') }).catch(() => false)
      await queryClient.invalidateQueries({ queryKey: queryKeys.helperProfile(session.user.id) })
      router.replace('/helper/nearby')
    } catch (cause) { toast.show(localizeAppError(cause, tr), 'error') } finally { setLoading(false) }
  }
  async function disable() {
    if (!session) return
    setLoading(true)
    try { await stopBackgroundLocationUpdates(); await helperRepository.setAvailability(session.user.id, false); await queryClient.invalidateQueries({ queryKey: queryKeys.helperProfile(session.user.id) }); toast.show(tr('تم إيقاف مشاركة الموقع', 'שיתוף המיקום הופסק', 'Location sharing stopped'), 'success') } catch (cause) { toast.show(localizeAppError(cause, tr), 'error') } finally { setLoading(false) }
  }
  const available = profile.data?.is_available === true
  return <AppScreen header={<ScreenHeader title={tr('التوفر والموقع', 'זמינות ומיקום', 'Availability and location')} subtitle={tr('أنت المتحكم دائماً', 'השליטה תמיד בידיכם', 'You stay in control')} back />} contentStyle={styles.content}>
    <ProgressHeader step={3} total={3} label={tr('إعداد ملف المساند', 'הגדרת פרופיל מסייע', 'Helper setup')} />
    <MapPanel latitude={profile.data?.latitude ?? 31.7784} longitude={profile.data?.longitude ?? 35.2066} height={280} />
    <Card tone={available ? 'community' : 'default'} title={available ? tr('وضع المساندة نشط', 'מצב סיוע פעיל', 'Help mode is active') : tr('ابدأ عندما تكون مستعداً', 'התחילו כשאתם מוכנים', 'Start when you are ready')} subtitle={available ? tr('موقعك يتحدث دورياً أثناء التوفر', 'המיקום מתעדכן מעת לעת בזמן זמינות', 'Your location refreshes while available') : tr('لن نشارك موقعك قبل التفعيل', 'המיקום לא ישותף לפני הפעלה', 'We do not share location before activation')} leading={<View style={[styles.availabilityDot, { backgroundColor: available ? theme.colors.community : theme.colors.textMuted }]} />}>
      <Button label={available ? tr('فتح الطلبات القريبة', 'פתיחת בקשות קרובות', 'View nearby requests') : tr('أنا مستعد للمساندة', 'אני מוכן/ה לעזור', 'I am ready to help')} variant="community" loading={loading} onPress={available ? () => router.push('/helper/nearby') : enable} />
      {available ? <Button label={tr('إيقاف التوفر', 'הפסקת זמינות', 'Stop availability')} variant="ghost" loading={loading} onPress={disable} /> : null}
    </Card>
    <View style={styles.privacyList}>{[tr('الموقع التقريبي يُستخدم للمطابقة', 'מיקום משוער משמש להתאמה', 'Approximate location powers matching'), tr('الموقع الدقيق يظهر بعد قبول المهمة', 'מיקום מדויק מוצג לאחר קבלת משימה', 'Exact location appears after acceptance'), tr('يمكنك إيقاف التوفر في أي وقت', 'אפשר לעצור זמינות בכל עת', 'Stop availability at any time')].map(label => <View key={label} style={[styles.privacyRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}><Check size={17} color={theme.colors.community} weight="bold" /><Text style={[typography.small, { color: theme.colors.textSecondary }]}>{label}</Text></View>)}</View>
  </AppScreen>
}

export function NearbyRequestsScreen() {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const tr = useTrilingual()
  const router = useRouter()
  const { session } = useAuth()
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  useEffect(() => { getCurrentCoords().then(setCoords).catch(() => setCoords({ latitude: 31.7784, longitude: 35.2066 })) }, [])
  const nearby = useQuery({ queryKey: session && coords ? queryKeys.nearbyRequests(coords.latitude, coords.longitude) : ['nearby'], queryFn: () => requestRepository.listNearby(session!.user.id, coords!), enabled: !!session && !!coords, refetchInterval: 15_000 })
  const refreshNearby = nearby.refetch
  useEffect(() => missionRepository.subscribeToOpenRequests(() => { void refreshNearby() }), [refreshNearby])
  const markers = useMemo(() => (nearby.data ?? []).map(item => ({ id: item.id, latitude: item.latitude, longitude: item.longitude })), [nearby.data])
  const selected = nearby.data?.find(item => item.id === selectedId) ?? null
  return <AppScreen scroll={false} unsafeBottom header={<ScreenHeader title={tr('طلبات قريبة', 'בקשות קרובות', 'Nearby requests')} subtitle={tr('تتجدد كل 15 ثانية', 'מתעדכן כל 15 שניות', 'Refreshes every 15 seconds')} back trailing={<StatusBadge label={tr('متاح', 'זמין', 'Available')} tone="success" dot />} />} contentStyle={styles.mapContent}>
    {coords ? <MapPanel latitude={coords.latitude} longitude={coords.longitude} markers={markers} selectedId={selectedId} onMarkerPress={setSelectedId} height={430} overlay={<View style={[styles.mapOverlay, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}><MapPin size={20} color={theme.colors.community} weight="fill" /><View style={{ flex: 1 }}><Text style={[typography.bodyMedium, { color: theme.colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{tr(`${markers.length} طلب مناسب قريب`, `${markers.length} בקשות מתאימות בקרבת מקום`, `${markers.length} matching requests nearby`)}</Text><Text style={[typography.caption, { color: theme.colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{tr('اختر علامة لعرض التفاصيل', 'בחרו סמן לצפייה בפרטים', 'Tap a marker to preview')}</Text></View></View>} /> : <Skeleton height={430} />}
    <SectionHeading title={tr('الأقرب إليك', 'הקרובות ביותר', 'Closest to you')} />
    {nearby.isLoading ? <Skeleton height={110} /> : null}
    {!nearby.isLoading && !nearby.data?.length ? <EmptyState title={tr('لا توجد طلبات مناسبة الآن', 'אין כרגע בקשות מתאימות', 'No matching requests right now')} message={tr('ابقَ متاحاً وسنرسل إشعاراً عند وصول طلب مناسب.', 'הישארו זמינים ונשלח התראה כשבקשה מתאימה תגיע.', 'Stay available and we will notify you when one arrives.')} /> : null}
    {(nearby.data ?? []).slice(0, 3).map(request => <Pressable key={request.id} onPress={() => router.push({ pathname: '/helper/request/[requestId]', params: { requestId: request.id } })} style={[styles.requestRow, { flexDirection: isRTL ? 'row-reverse' : 'row', borderColor: theme.colors.border, backgroundColor: selectedId === request.id ? theme.colors.communitySoft : theme.colors.surface }]}><View style={[styles.distance, { backgroundColor: theme.colors.communitySoft }]}><Text style={[typography.title, { color: theme.colors.community }]}>{request.distance.toFixed(1)}</Text><Text style={[typography.caption, { color: theme.colors.community }]}>km</Text></View><View style={{ flex: 1 }}><Text numberOfLines={1} style={[typography.bodyMedium, { color: theme.colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{request.note || tr('طلب مساندة مجتمعية', 'בקשת סיוע קהילתית', 'Community support request')}</Text><Text style={[typography.caption, { color: theme.colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{tr('راجع التفاصيل قبل القبول', 'בדקו פרטים לפני קבלה', 'Review before accepting')}</Text></View><ArrowRight size={18} color={theme.colors.textMuted} /></Pressable>)}
    {selected ? <Button label={tr('عرض تفاصيل الطلب', 'הצגת פרטי הבקשה', 'View request details')} variant="community" onPress={() => router.push({ pathname: '/helper/request/[requestId]', params: { requestId: selected.id } })} /> : null}
  </AppScreen>
}

export function HelperRequestDetailScreen() {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const tr = useTrilingual()
  const router = useRouter()
  const toast = useToast()
  const queryClient = useQueryClient()
  const { requestId } = useLocalSearchParams<{ requestId: string }>()
  const { session } = useAuth()
  const request = useQuery({ queryKey: ['request', requestId], queryFn: () => requestRepository.get(String(requestId)), enabled: !!requestId })
  const accept = useMutation({ mutationFn: () => missionRepository.accept(String(requestId)), onSuccess: async mission => { if (session) await queryClient.invalidateQueries({ queryKey: queryKeys.activeMission(session.user.id) }); router.replace({ pathname: '/mission/[missionId]', params: { missionId: mission.id } }) }, onError: cause => toast.show(localizeAppError(cause, tr), 'error') })
  if (request.isLoading) return <AppScreen header={<ScreenHeader title={tr('تفاصيل الطلب', 'פרטי הבקשה', 'Request details')} back />}><Skeleton height={220} /><Skeleton height={150} /></AppScreen>
  if (!request.data) return <AppScreen header={<ScreenHeader title={tr('تفاصيل الطلب', 'פרטי הבקשה', 'Request details')} back />}><EmptyState title={tr('الطلب غير متاح', 'הבקשה אינה זמינה', 'Request unavailable')} message={tr('ربما قبله شخص آخر.', 'ייתכן שמתנדב אחר קיבל אותה.', 'Another helper may have accepted it.')} actionLabel={tr('العودة', 'חזרה', 'Go back')} onAction={() => router.back()} /></AppScreen>
  const row = request.data
  return <AppScreen header={<ScreenHeader title={tr('تفاصيل الطلب', 'פרטי הבקשה', 'Request details')} subtitle={tr('اقرأ كل شيء قبل الالتزام', 'קראו הכול לפני התחייבות', 'Review everything before committing')} back />} footer={<Button label={tr('قبول هذه المهمة', 'קבלת המשימה', 'Accept this mission')} variant="community" size="lg" loading={accept.isPending} onPress={() => accept.mutate()} />} contentStyle={styles.content}>
    <View style={[styles.detailHero, { backgroundColor: theme.colors.community }]}><StatusBadge label={tr('طلب مفتوح', 'בקשה פתוחה', 'OPEN REQUEST')} tone="success" dot /><Text style={[typography.h1, { color: theme.colors.onCommunity, textAlign: isRTL ? 'right' : 'left' }]}>{row.note || tr('مساندة مجتمعية', 'סיוע קהילתי', 'Community support')}</Text><View style={[styles.meta, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}><StatusBadge label={tr('قريب منك', 'בקרבתכם', 'Nearby')} tone="neutral" /><StatusBadge label={tr('توقيت مرن', 'זמן גמיש', 'Flexible')} tone="neutral" /></View></View>
    <MapPanel latitude={row.latitude} longitude={row.longitude} height={270} interactive={false} />
    <Card title={tr('ما المطلوب', 'מה נדרש', 'What is needed')}><Text style={[typography.body, { color: theme.colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{row.note || tr('سيظهر الوصف الكامل بعد تحديث الطلب.', 'התיאור המלא יופיע לאחר עדכון הבקשה.', 'The complete description will appear after the request updates.')}</Text></Card>
    <Surface tone="primary" bordered={false}><View style={[styles.noticeRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}><ShieldCheck size={24} color={theme.colors.primary} /><Text style={[typography.small, { color: theme.colors.textPrimary, flex: 1, textAlign: isRTL ? 'right' : 'left' }]}>{tr('بعد القبول ستظهر الهوية والموقع الدقيق والمحادثة للطرفين.', 'לאחר הקבלה, זהות, מיקום מדויק ושיחה יוצגו לשני הצדדים.', 'After acceptance, identity, exact location, and conversation become visible to both sides.')}</Text></View></Surface>
  </AppScreen>
}

const styles = StyleSheet.create({
  content: { gap: space.xl },
  heroCard: { gap: space.md },
  beacon: { width: 64, height: 64, borderRadius: 23, backgroundColor: civicColors.communityTeal, alignItems: 'center', justifyContent: 'center' },
  iconBox: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  availabilityDot: { width: 18, height: 18, borderRadius: 9, borderWidth: 4, borderColor: palette.onCivic },
  principles: { gap: space.lg }, principle: { alignItems: 'flex-start', gap: space.md },
  onboarding: { flex: 1, minHeight: 760, justifyContent: 'space-between', paddingVertical: space.xxl },
  onboardVisual: { height: 210, alignItems: 'center', justifyContent: 'center' },
  onboardRing: { width: 170, height: 170, borderRadius: 85, borderWidth: 30, alignItems: 'center', justifyContent: 'center' },
  onboardCore: { width: 84, height: 84, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  onboardSteps: { gap: space.md }, onboardStep: { alignItems: 'center', gap: space.md },
  stepNumber: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  skillList: { gap: space.md },
  skill: { minHeight: 82, borderRadius: radius.lg, borderWidth: 1.5, padding: space.md, alignItems: 'center', gap: space.md },
  languageList: { gap: space.md }, language: { minHeight: 78, borderRadius: radius.lg, borderWidth: 1.5, padding: space.md, alignItems: 'center', gap: space.md },
  languageGlyph: { width: 46, height: 46, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  privacyList: { gap: space.md }, privacyRow: { alignItems: 'center', gap: space.sm },
  mapContent: { paddingHorizontal: space.lg, gap: space.lg }, mapOverlay: { alignItems: 'center', flex: 1, gap: space.md },
  requestRow: { minHeight: 78, borderRadius: radius.lg, borderWidth: 1, padding: space.md, alignItems: 'center', gap: space.md },
  distance: { width: 54, height: 54, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  detailHero: { borderRadius: radius.xl, padding: space.xl, gap: space.md }, meta: { gap: space.sm }, noticeRow: { alignItems: 'flex-start', gap: space.md }
})
