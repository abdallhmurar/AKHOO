import { useEffect, useState } from 'react'
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, ChatCenteredText, Check, CheckCircle, HandHeart, NavigationArrow, PaperPlaneTilt, Phone, Prohibit, ShieldCheck, ShieldWarning, Star, WarningCircle } from 'phosphor-react-native'
import { directionsHref, telHref } from '../../lib/contactLinks'
import { useIsRTL } from '../../lib/direction'
import { palette, radius, space, useSanadTheme } from '../../lib/theme'
import { useAppTypography } from '../../lib/typography'
import { useAuth, useLanguageDirection } from '../../providers'
import { missionRepository } from '../../repositories/missionRepository'
import { profileRepository } from '../../repositories/profileRepository'
import { safetyRepository } from '../../repositories/safetyRepository'
import type { MissionStatus } from '../../repositories/domainTypes'
import { localizeAppError } from '../../services/errors'
import { queryKeys } from '../../services/queryKeys'
import { AppScreen, MapPanel, MissionTimeline, RatingStars, ScreenHeader, SectionHeading } from '../../components/v2'
import { Avatar, BottomSheet, Button, Card, EmptyState, Skeleton, StatusBadge, Surface, TextArea, TextField, useToast } from '../../components/ui'
import { useV2Text } from '../v2Copy'

function useTrilingual() {
  const { language } = useLanguageDirection()
  return (ar: string, he: string, en: string) => language === 'en' ? en : language === 'he' ? he : ar
}

const statusIndex: Record<MissionStatus, number> = {
  matching: 0, assigned: 1, on_the_way: 2, arrived: 3, in_progress: 4,
  awaiting_confirmation: 5, completed: 6, cancelled: 6, disputed: 5
}

function statusTone(status: MissionStatus) {
  if (status === 'completed') return 'success' as const
  if (status === 'cancelled' || status === 'disputed') return 'danger' as const
  if (status === 'awaiting_confirmation') return 'warning' as const
  return 'info' as const
}

function useMissionDetail(missionId: string) {
  const queryClient = useQueryClient()
  const query = useQuery({ queryKey: queryKeys.mission(missionId), queryFn: () => missionRepository.get(missionId), enabled: !!missionId, refetchInterval: 15_000 })
  useEffect(() => missionId ? missionRepository.subscribe(missionId, () => { void queryClient.invalidateQueries({ queryKey: queryKeys.mission(missionId) }); void queryClient.invalidateQueries({ queryKey: queryKeys.missionEvents(missionId) }); void queryClient.invalidateQueries({ queryKey: queryKeys.missionMessages(missionId) }) }) : undefined, [missionId, queryClient])
  return query
}

export function LiveMissionScreen() {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const tr = useTrilingual()
  const t = useV2Text()
  const router = useRouter()
  const toast = useToast()
  const queryClient = useQueryClient()
  const { missionId } = useLocalSearchParams<{ missionId: string }>()
  const { session } = useAuth()
  const mission = useMissionDetail(String(missionId))
  const row = mission.data
  const isRequester = row?.requester_id === session?.user.id
  const otherId = isRequester ? row?.helper_id : row?.requester_id
  const otherProfile = useQuery({ queryKey: otherId ? queryKeys.profile(otherId) : ['participant'], queryFn: () => profileRepository.get(otherId!), enabled: !!otherId })
  const helperPosition = useQuery({ queryKey: queryKeys.missionHelperLocation(String(missionId)), queryFn: () => missionRepository.helperLocation(String(missionId)), enabled: !!row?.helper_id, refetchInterval: 15_000 })
  const events = useQuery({ queryKey: queryKeys.missionEvents(String(missionId)), queryFn: () => missionRepository.events(String(missionId)), enabled: !!missionId })
  const [safetyOpen, setSafetyOpen] = useState(false)
  const advance = useMutation({ mutationFn: (status: MissionStatus) => missionRepository.advance(String(missionId), status), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: queryKeys.mission(String(missionId)) }); if (session) await queryClient.invalidateQueries({ queryKey: queryKeys.activeMission(session.user.id) }) }, onError: cause => toast.show(localizeAppError(cause, tr), 'error') })
  const confirm = useMutation({ mutationFn: () => missionRepository.confirmCompletion(String(missionId), true), onSuccess: async () => { if (session) await queryClient.invalidateQueries({ queryKey: queryKeys.activeMission(session.user.id) }); router.replace({ pathname: '/mission/[missionId]/completed', params: { missionId: String(missionId) } }) }, onError: cause => toast.show(localizeAppError(cause, tr), 'error') })
  if (mission.isLoading) return <AppScreen header={<ScreenHeader title={t('mission.live')} back />}><Skeleton height={310} /><Skeleton height={170} /><Skeleton height={210} /></AppScreen>
  if (!row) return <AppScreen header={<ScreenHeader title={t('mission.live')} back />}><EmptyState title={tr('المهمة غير متاحة', 'המשימה אינה זמינה', 'Mission unavailable')} message={tr('قد تكون انتهت أو لم يعد لديك وصول إليها.', 'ייתכן שהסתיימה או שאין לכם עוד גישה.', 'It may have ended or you no longer have access.')} actionLabel={tr('العودة للرئيسية', 'חזרה לבית', 'Back home')} onAction={() => router.replace('/(tabs)')} /></AppScreen>
  const request = row.request
  const helperCoords = helperPosition.data?.latitude != null && helperPosition.data.longitude != null ? { latitude: helperPosition.data.latitude, longitude: helperPosition.data.longitude } : null
  const requestCoords = request ? { latitude: request.latitude, longitude: request.longitude } : { latitude: 31.7784, longitude: 35.2066 }
  const markers = [
    { id: 'request', ...requestCoords },
    ...(helperCoords ? [{ id: 'helper', ...helperCoords }] : [])
  ]
  const timeline = [
    { key: 'matching', label: tr('تم إرسال الطلب', 'הבקשה נשלחה', 'Request sent') },
    { key: 'assigned', label: tr('تمت المطابقة', 'נמצאה התאמה', 'Helper matched') },
    { key: 'on_the_way', label: tr('المساند في الطريق', 'המסייע בדרך', 'Helper en route') },
    { key: 'arrived', label: tr('وصل إلى الموقع', 'הגיע למיקום', 'Arrived at location') },
    { key: 'in_progress', label: tr('المساندة جارية', 'הסיוע מתבצע', 'Support in progress') },
    { key: 'awaiting_confirmation', label: tr('بانتظار التأكيد', 'ממתין לאישור', 'Awaiting confirmation') },
    { key: 'completed', label: tr('اكتملت المهمة', 'המשימה הושלמה', 'Mission completed') }
  ]
  const action = (() => {
    if (isRequester && row.status === 'awaiting_confirmation') return <Button label={tr('تأكيد اكتمال المساندة', 'אישור השלמת הסיוע', 'Confirm support completed')} variant="community" size="lg" loading={confirm.isPending} onPress={() => confirm.mutate()} />
    if (isRequester) return null
    if (row.status === 'assigned') return <Button label={tr('بدء الطريق', 'יציאה לדרך', 'Start navigation')} size="lg" loading={advance.isPending} onPress={() => advance.mutate('on_the_way')} />
    if (row.status === 'on_the_way') return <Button label={t('mission.arrived')} size="lg" loading={advance.isPending} onPress={() => advance.mutate('arrived')} />
    if (row.status === 'arrived') return <Button label={t('mission.start')} variant="community" size="lg" loading={advance.isPending} onPress={() => advance.mutate('in_progress')} />
    if (row.status === 'in_progress') return <Button label={t('mission.complete')} variant="community" size="lg" loading={advance.isPending} onPress={() => advance.mutate('awaiting_confirmation')} />
    return null
  })()
  return <AppScreen header={<ScreenHeader title={t('mission.live')} subtitle={tr('تحديثات مباشرة وآمنة', 'עדכונים חיים ומאובטחים', 'Live, private updates')} back trailing={<StatusBadge label={trStatus(row.status, tr)} tone={statusTone(row.status)} dot />} />} footer={action} contentStyle={styles.content}>
    <MapPanel latitude={requestCoords.latitude} longitude={requestCoords.longitude} markers={markers} selectedId="request" height={320} overlay={<View style={[styles.mapOverlay, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}><NavigationArrow size={21} color={theme.colors.primary} weight="fill" /><View style={{ flex: 1 }}><Text style={[typography.bodyMedium, { color: theme.colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{row.status === 'on_the_way' ? tr('المساند يتحرك نحو الموقع', 'המסייע נע לכיוון המיקום', 'Helper is moving toward the location') : trStatus(row.status, tr)}</Text><Text style={[typography.caption, { color: theme.colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{request?.location_label || tr('القدس', 'ירושלים', 'Jerusalem')}</Text></View></View>} />
    <Card title={otherProfile.data?.full_name || tr('عضو موثوق في المجتمع', 'חבר/ת קהילה מהימנ/ה', 'Trusted community member')} subtitle={isRequester ? tr('المساند المطابق', 'המסייע המותאם', 'Matched helper') : tr('طالب المساندة', 'מבקש/ת הסיוע', 'Requester')} leading={<Avatar name={otherProfile.data?.full_name || 'SANAD'} uri={otherProfile.data?.avatar_url} size={52} tone="community" />} trailing={<ShieldCheck size={24} color={theme.colors.community} weight="duotone" />}>
      <View style={[styles.quickActions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <Button fullWidth={false} label={t('mission.message')} variant="outline" leading={<ChatCenteredText size={18} color={theme.colors.primary} />} onPress={() => router.push({ pathname: '/mission/[missionId]/conversation', params: { missionId: row.id } })} />
        {otherProfile.data?.phone ? <Button fullWidth={false} label={t('mission.call')} variant="outline" leading={<Phone size={18} color={theme.colors.primary} />} onPress={() => Linking.openURL(telHref(otherProfile.data!.phone!))} /> : null}
      </View>
    </Card>
    {!isRequester && request ? <Button label={t('mission.navigate')} variant="outline" leading={<NavigationArrow size={19} color={theme.colors.primary} />} onPress={() => Linking.openURL(directionsHref(request.latitude, request.longitude))} /> : null}
    <Card title={request?.note || tr('مساندة مجتمعية', 'סיוע קהילתי', 'Community support')} subtitle={request?.location_label || tr('القدس', 'ירושלים', 'Jerusalem')} leading={<View style={[styles.iconBox, { backgroundColor: theme.colors.primarySoft }]}><HandHeart size={24} color={theme.colors.primary} weight="duotone" /></View>} />
    <SectionHeading title={tr('مسار المهمة', 'ציר המשימה', 'Mission progress')} subtitle={tr('كل تحديث محفوظ في سجل المهمة', 'כל עדכון נשמר ביומן המשימה', 'Every update is recorded')} />
    <Card elevation="none"><MissionTimeline steps={timeline} activeIndex={statusIndex[row.status]} /></Card>
    {events.data?.length ? <Text style={[typography.caption, { color: theme.colors.textMuted, textAlign: 'center' }]}>{tr(`${events.data.length} تحديثات موثقة`, `${events.data.length} עדכונים מתועדים`, `${events.data.length} recorded updates`)}</Text> : null}
    <Pressable accessibilityRole="button" onPress={() => setSafetyOpen(true)} style={[styles.safetyRow, { flexDirection: isRTL ? 'row-reverse' : 'row', borderColor: theme.colors.border }]}><ShieldWarning size={23} color={theme.colors.emergency} weight="duotone" /><View style={{ flex: 1 }}><Text style={[typography.bodyMedium, { color: theme.colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{t('mission.safety')}</Text><Text style={[typography.caption, { color: theme.colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{tr('الإبلاغ، الاعتراض أو الحظر', 'דיווח, ערעור או חסימה', 'Report, dispute, or block')}</Text></View><ArrowRight size={18} color={theme.colors.textMuted} /></Pressable>
    <BottomSheet visible={safetyOpen} onClose={() => setSafetyOpen(false)} title={t('mission.safety')} subtitle={tr('إذا كان هناك خطر مباشر، اتصل بالطوارئ أولاً.', 'במקרה של סכנה מיידית, התקשרו קודם לשירותי החירום.', 'If there is immediate danger, call emergency services first.')}>
      <Button label={tr('اتصال بالشرطة — 100', 'חיוג למשטרה — 100', 'Call Police — 100')} variant="danger" onPress={() => Linking.openURL('tel:100')} />
      <Button label={t('mission.report')} variant="outline" onPress={() => { setSafetyOpen(false); router.push({ pathname: '/mission/[missionId]/report', params: { missionId: row.id, userId: otherId ?? '' } }) }} />
      {row.status === 'awaiting_confirmation' ? <Button label={t('mission.dispute')} variant="outline" onPress={() => { setSafetyOpen(false); router.push({ pathname: '/mission/[missionId]/dispute', params: { missionId: row.id } }) }} /> : null}
      {otherId ? <Button label={t('mission.block')} variant="ghost" onPress={() => { setSafetyOpen(false); router.push({ pathname: '/mission/[missionId]/block', params: { missionId: row.id, userId: otherId } }) }} /> : null}
    </BottomSheet>
  </AppScreen>
}

function trStatus(status: MissionStatus, tr: ReturnType<typeof useTrilingual>) {
  const labels: Record<MissionStatus, [string, string, string]> = {
    matching: ['جارٍ البحث', 'מחפש התאמה', 'Matching'], assigned: ['تمت المطابقة', 'נמצאה התאמה', 'Matched'], on_the_way: ['في الطريق', 'בדרך', 'En route'], arrived: ['وصل', 'הגיע', 'Arrived'], in_progress: ['المساندة جارية', 'הסיוע מתבצע', 'In progress'], awaiting_confirmation: ['بانتظار التأكيد', 'ממתין לאישור', 'Awaiting confirmation'], completed: ['مكتملة', 'הושלם', 'Completed'], cancelled: ['ملغاة', 'בוטל', 'Cancelled'], disputed: ['قيد المراجعة', 'בבדיקה', 'Under review']
  }
  return tr(...labels[status])
}

export function ConversationScreen() {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const tr = useTrilingual()
  const toast = useToast()
  const queryClient = useQueryClient()
  const { missionId } = useLocalSearchParams<{ missionId: string }>()
  const { session } = useAuth()
  const messages = useQuery({ queryKey: queryKeys.missionMessages(String(missionId)), queryFn: () => missionRepository.messages(String(missionId)), refetchInterval: 6_000 })
  const [body, setBody] = useState('')
  const send = useMutation({ mutationFn: () => missionRepository.sendMessage(String(missionId), body), onSuccess: async () => { setBody(''); await queryClient.invalidateQueries({ queryKey: queryKeys.missionMessages(String(missionId)) }) }, onError: cause => toast.show(localizeAppError(cause, tr), 'error') })
  return <AppScreen header={<ScreenHeader title={tr('محادثة المهمة', 'שיחת המשימה', 'Mission conversation')} subtitle={tr('مرئية لطرفي المهمة فقط', 'גלויה רק לצדדי המשימה', 'Visible only to mission participants')} back />} footer={<View style={[styles.composer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}><TextField value={body} onChangeText={setBody} placeholder={tr('اكتب رسالة…', 'כתבו הודעה…', 'Write a message…')} style={styles.composerInput} /><Pressable accessibilityRole="button" accessibilityLabel={tr('إرسال', 'שליחה', 'Send')} disabled={!body.trim() || send.isPending} onPress={() => send.mutate()} style={[styles.send, { backgroundColor: body.trim() ? theme.colors.primary : theme.colors.disabledBackground }]}><PaperPlaneTilt size={20} color={body.trim() ? theme.colors.onPrimary : theme.colors.disabledContent} weight="fill" /></Pressable></View>} contentStyle={styles.conversation}>
    <Surface tone="community" bordered={false}><View style={[styles.noticeRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}><ShieldCheck size={21} color={theme.colors.community} /><Text style={[typography.caption, { color: theme.colors.textPrimary, flex: 1 }]}>{tr('لا تشارك رموزاً بنكية أو كلمات مرور.', 'אין לשתף קודים בנקאיים או סיסמאות.', 'Never share banking codes or passwords.')}</Text></View></Surface>
    {!messages.data?.length ? <EmptyState title={tr('ابدأ بالتعريف عن نفسك', 'התחילו בהיכרות קצרה', 'Start with a quick hello')} message={tr('استخدم المحادثة لتنسيق الوصول والتفاصيل المتعلقة بالمهمة فقط.', 'השתמשו בשיחה לתיאום הגעה ופרטי המשימה בלבד.', 'Use chat only to coordinate arrival and mission details.')} /> : null}
    <View style={styles.messages}>{(messages.data ?? []).map(message => { const mine = message.sender_id === session?.user.id; return <View key={message.id} style={[styles.bubble, { alignSelf: mine ? (isRTL ? 'flex-start' : 'flex-end') : (isRTL ? 'flex-end' : 'flex-start'), backgroundColor: mine ? theme.colors.primary : theme.colors.surface, borderColor: theme.colors.border }]}><Text style={[typography.body, { color: mine ? theme.colors.onPrimary : theme.colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{message.body}</Text><Text style={[typography.caption, { color: mine ? palette.civicAccentText : theme.colors.textMuted }]}>{new Date(message.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</Text></View> })}</View>
  </AppScreen>
}

export function MissionCompletedScreen() {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const tr = useTrilingual()
  const t = useV2Text()
  const router = useRouter()
  const { missionId } = useLocalSearchParams<{ missionId: string }>()
  return <AppScreen background={theme.colors.community} contentStyle={styles.completed}>
    <View style={styles.completedIcon}><Check size={44} color={theme.colors.community} weight="bold" /></View>
    <View style={{ gap: space.md }}><Text style={[typography.eyebrow, { color: palette.onCommunitySubtle, textAlign: isRTL ? 'right' : 'left' }]}>{tr('أثر مجتمعي مكتمل', 'השפעה קהילתית הושלמה', 'COMMUNITY IMPACT COMPLETE')}</Text><Text style={[typography.hero, { color: palette.onCivic, textAlign: isRTL ? 'right' : 'left' }]}>{t('mission.completedTitle')}</Text><Text style={[typography.body, { color: palette.onCommunityMuted, textAlign: isRTL ? 'right' : 'left' }]}>{tr('شكراً لكما. سُجلت المهمة بأمان ويمكنكما مشاركة تقييم خاص.', 'תודה לשניכם. המשימה תועדה ואפשר לשתף משוב פרטי.', 'Thank you both. The mission is safely recorded and private feedback is now available.')}</Text></View>
    <Card tone="navy" bordered={false} title={tr('+25 نقطة أثر', '+25 נקודות השפעה', '+25 impact points')} subtitle={tr('تُضاف للمساند بعد تأكيد المهمة', 'נוספות למסייע לאחר אישור המשימה', 'Added to the helper after confirmation')} leading={<Star size={28} color={theme.colors.reward} weight="fill" />} />
    <Button label={tr('تقييم التجربة', 'דירוג החוויה', 'Rate the experience')} size="lg" onPress={() => router.push({ pathname: '/mission/[missionId]/rating', params: { missionId: String(missionId) } })} />
    <Button label={tr('العودة للرئيسية', 'חזרה לבית', 'Back home')} variant="ghost" onPress={() => router.replace('/(tabs)')} />
  </AppScreen>
}

export function RatingScreen() {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const tr = useTrilingual()
  const t = useV2Text()
  const router = useRouter()
  const toast = useToast()
  const { missionId } = useLocalSearchParams<{ missionId: string }>()
  const { session } = useAuth()
  const mission = useMissionDetail(String(missionId))
  const otherId = mission.data?.requester_id === session?.user.id ? mission.data?.helper_id : mission.data?.requester_id
  const [score, setScore] = useState(0)
  const [comment, setComment] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const options = [tr('محترم', 'מכבד/ת', 'Respectful'), tr('واضح', 'ברור/ה', 'Clear'), tr('في الموعد', 'בזמן', 'On time'), tr('شعرت بالأمان', 'הרגשתי בטוח/ה', 'Felt safe')]
  const submit = useMutation({ mutationFn: () => safetyRepository.rate({ missionId: String(missionId), subjectId: otherId!, score, comment, tags }), onSuccess: () => { toast.show(tr('شكراً لملاحظاتك', 'תודה על המשוב', 'Thanks for your feedback'), 'success'); router.replace('/(tabs)/activity') }, onError: cause => toast.show(localizeAppError(cause, tr), 'error') })
  return <AppScreen header={<ScreenHeader title={t('mission.ratingTitle')} subtitle={t('mission.ratingBody')} back />} footer={<Button label={tr('إرسال التقييم', 'שליחת הדירוג', 'Submit rating')} disabled={score === 0 || !otherId} loading={submit.isPending} onPress={() => submit.mutate()} />} contentStyle={styles.content}>
    <View style={styles.ratingHero}><Avatar name={tr('عضو المجتمع', 'חבר/ת הקהילה', 'Community member')} size={74} tone="community" /><RatingStars value={score} onChange={setScore} size={40} /><Text style={[typography.bodyMedium, { color: theme.colors.textPrimary }]}>{score ? tr('شكراً — أخبرنا بالمزيد', 'תודה — ספרו לנו עוד', 'Thank you—tell us more') : tr('اختر من نجمة إلى خمس', 'בחרו בין כוכב אחד לחמישה', 'Choose one to five stars')}</Text></View>
    <View style={styles.tags}>{options.map(tag => { const selected = tags.includes(tag); return <Pressable key={tag} onPress={() => setTags(current => selected ? current.filter(item => item !== tag) : [...current, tag])} style={[styles.tag, { backgroundColor: selected ? theme.colors.communitySoft : theme.colors.surface, borderColor: selected ? theme.colors.community : theme.colors.border }]}><Text style={[typography.smallMedium, { color: selected ? theme.colors.community : theme.colors.textSecondary }]}>{tag}</Text></Pressable> })}</View>
    <TextArea label={tr('ملاحظة خاصة (اختياري)', 'הערה פרטית (אופציונלי)', 'Private note (optional)')} value={comment} onChangeText={setComment} maxLength={500} />
  </AppScreen>
}

export function DisputeScreen() {
  const tr = useTrilingual()
  const router = useRouter()
  const toast = useToast()
  const { missionId } = useLocalSearchParams<{ missionId: string }>()
  const [details, setDetails] = useState('')
  const submit = useMutation({ mutationFn: () => safetyRepository.dispute(String(missionId), details), onSuccess: () => { toast.show(tr('تم إرسال الاعتراض لفريق الأمان', 'הערעור נשלח לצוות הבטיחות', 'Dispute sent to the safety team'), 'success'); router.replace({ pathname: '/mission/[missionId]', params: { missionId: String(missionId) } }) }, onError: cause => toast.show(localizeAppError(cause, tr), 'error') })
  return <SafetyForm title={tr('اعتراض على الإنهاء', 'ערעור על סיום', 'Dispute completion')} body={tr('اشرح باختصار لماذا لم تكتمل المساندة. سيُحفظ سجل المهمة للمراجعة.', 'הסבירו בקצרה מדוע הסיוע לא הושלם. יומן המשימה יישמר לבדיקה.', 'Briefly explain why support was not completed. The mission log is preserved for review.')} value={details} onChange={setDetails} submitLabel={tr('إرسال الاعتراض', 'שליחת הערעור', 'Submit dispute')} loading={submit.isPending} onSubmit={() => submit.mutate()} />
}

export function ReportScreen() {
  const tr = useTrilingual()
  const router = useRouter()
  const toast = useToast()
  const { missionId, userId } = useLocalSearchParams<{ missionId: string; userId?: string }>()
  const [details, setDetails] = useState('')
  const [category, setCategory] = useState('safety_concern')
  const submit = useMutation({ mutationFn: () => safetyRepository.report({ missionId: String(missionId), reportedUserId: userId ? String(userId) : null, category, details }), onSuccess: () => { toast.show(tr('وصل البلاغ إلى فريق الأمان', 'הדיווח הגיע לצוות הבטיחות', 'Report delivered to the safety team'), 'success'); router.back() }, onError: cause => toast.show(localizeAppError(cause, tr), 'error') })
  return <SafetyForm title={tr('إبلاغ فريق الأمان', 'דיווח לצוות הבטיחות', 'Report to safety team')} body={tr('إذا كان هناك خطر مباشر، اتصل بالشرطة على 100 أولاً.', 'במקרה של סכנה מיידית, התקשרו קודם למשטרה 100.', 'If there is immediate danger, call Police at 100 first.')} value={details} onChange={setDetails} submitLabel={tr('إرسال البلاغ', 'שליחת הדיווח', 'Send report')} loading={submit.isPending} onSubmit={() => submit.mutate()} categories={[['safety_concern', tr('شعرت بعدم الأمان', 'הרגשתי לא בטוח/ה', 'I felt unsafe')], ['harassment', tr('سلوك غير لائق', 'התנהגות בלתי הולמת', 'Inappropriate behavior')], ['fraud', tr('طلب مال أو بيانات حساسة', 'בקשת כסף או מידע רגיש', 'Asked for money or sensitive data')], ['other', tr('سبب آخر', 'סיבה אחרת', 'Another reason')]]} category={category} onCategory={setCategory} />
}

export function BlockUserScreen() {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const tr = useTrilingual()
  const router = useRouter()
  const toast = useToast()
  const { userId } = useLocalSearchParams<{ userId: string }>()
  const [reason, setReason] = useState('')
  const block = useMutation({ mutationFn: () => safetyRepository.block(String(userId), reason), onSuccess: () => { toast.show(tr('لن تتم مطابقتكما مستقبلاً', 'לא תותאמו זה לזו בעתיד', 'You will not be matched again'), 'success'); router.replace('/(tabs)') }, onError: cause => toast.show(localizeAppError(cause, tr), 'error') })
  return <AppScreen header={<ScreenHeader title={tr('حظر المستخدم', 'חסימת משתמש/ת', 'Block user')} back />} contentStyle={styles.content}>
    <Surface tone="emergency" bordered={false} padding="xl" style={styles.blockHero}><Prohibit size={42} color={theme.colors.emergency} weight="duotone" /><Text style={[typography.h2, { color: theme.colors.textPrimary }]}>{tr('لن تتم مطابقتكما مرة أخرى', 'לא תותאמו שוב', 'You will not be matched again')}</Text><Text style={[typography.body, { color: theme.colors.textSecondary }]}>{tr('الحظر خاص. لن نخبر الطرف الآخر، ويمكن لفريق الأمان مراجعة البلاغات المرتبطة.', 'החסימה פרטית. הצד השני לא יקבל הודעה וצוות הבטיחות יוכל לבדוק דיווחים.', 'Blocking is private. The other person is not notified, and safety reports can still be reviewed.')}</Text></Surface>
    <TextArea label={tr('السبب (اختياري)', 'סיבה (אופציונלי)', 'Reason (optional)')} value={reason} onChangeText={setReason} />
    <Button label={tr('تأكيد الحظر', 'אישור חסימה', 'Confirm block')} variant="danger" loading={block.isPending} onPress={() => block.mutate()} />
    <Button label={tr('إلغاء', 'ביטול', 'Cancel')} variant="ghost" onPress={() => router.back()} />
  </AppScreen>
}

function SafetyForm({ title, body, value, onChange, submitLabel, onSubmit, loading, categories, category, onCategory }: { title: string; body: string; value: string; onChange: (value: string) => void; submitLabel: string; onSubmit: () => void; loading: boolean; categories?: [string, string][]; category?: string; onCategory?: (value: string) => void }) {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const tr = useTrilingual()
  return <AppScreen header={<ScreenHeader title={title} back />} footer={<Button label={submitLabel} variant="danger" disabled={value.trim().length < 10} loading={loading} onPress={onSubmit} />} contentStyle={styles.content}>
    <Surface tone="emergency" bordered={false}><View style={[styles.noticeRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}><WarningCircle size={25} color={theme.colors.emergency} weight="duotone" /><Text style={[typography.body, { color: theme.colors.textPrimary, flex: 1, textAlign: isRTL ? 'right' : 'left' }]}>{body}</Text></View></Surface>
    {categories ? <View style={styles.reportCategories}>{categories.map(([id, label]) => <Pressable key={id} onPress={() => onCategory?.(id)} style={[styles.reportCategory, { borderColor: category === id ? theme.colors.emergency : theme.colors.border, backgroundColor: category === id ? theme.colors.emergencySoft : theme.colors.surface }]}><Text style={[typography.bodyMedium, { color: theme.colors.textPrimary }]}>{label}</Text>{category === id ? <CheckCircle size={21} color={theme.colors.emergency} weight="fill" /> : null}</Pressable>)}</View> : null}
    <TextArea label={tr('التفاصيل', 'פרטים', 'Details')} value={value} onChangeText={onChange} placeholder={tr('اكتب ما حدث بوضوح ومن دون معلومات حساسة…', 'תארו בבירור מה קרה, בלי מידע רגיש…', 'Describe what happened clearly, without sensitive information…')} maxLength={1000} required />
  </AppScreen>
}

const styles = StyleSheet.create({
  content: { gap: space.xl },
  mapOverlay: { flex: 1, alignItems: 'center', gap: space.md },
  quickActions: { gap: space.md, flexWrap: 'wrap' },
  iconBox: { width: 46, height: 46, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  safetyRow: { minHeight: 72, alignItems: 'center', gap: space.md, borderTopWidth: 1, borderBottomWidth: 1, paddingVertical: space.md },
  noticeRow: { alignItems: 'flex-start', gap: space.md },
  composer: { alignItems: 'center', gap: space.sm }, composerInput: { minHeight: 42 }, send: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  conversation: { minHeight: 640 }, messages: { gap: space.md },
  bubble: { maxWidth: '82%', borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: space.lg, paddingVertical: space.md, gap: 4 },
  completed: { minHeight: 760, justifyContent: 'center', gap: space.xxl }, completedIcon: { width: 92, height: 92, borderRadius: 34, backgroundColor: palette.onCivic, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  ratingHero: { alignItems: 'center', gap: space.lg, paddingVertical: space.xl }, tags: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, justifyContent: 'center' }, tag: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: space.lg, paddingVertical: space.sm },
  blockHero: { alignItems: 'center', gap: space.md }, reportCategories: { gap: space.sm }, reportCategory: { minHeight: 58, borderWidth: 1, borderRadius: radius.md, padding: space.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md }
})
