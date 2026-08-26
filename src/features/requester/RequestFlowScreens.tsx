import { useEffect, useState } from 'react'
import { ActivityIndicator, Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as ImagePicker from 'expo-image-picker'
import { Ambulance, Basket, Camera, Check, CheckCircle, DotsThreeCircle, FirstAid, HandHeart, HouseLine, ImageSquare, Laptop, MapPin, NavigationArrow, ShieldCheck, ShieldWarning, Translate, UsersThree, Wheelchair, WheelchairMotion, X } from 'phosphor-react-native'
import type { Icon } from 'phosphor-react-native'
import { assistanceCategories, localized, requiresEmergencyHandoff, type AssistanceCategoryId } from '../../domain/v2'
import { useIsRTL } from '../../lib/direction'
import { getCurrentCoords } from '../../lib/location'
import { civicColors, palette, radius, space, useSanadTheme } from '../../lib/theme'
import { useAppTypography } from '../../lib/typography'
import { useAuth, useLanguageDirection } from '../../providers'
import { missionRepository } from '../../repositories/missionRepository'
import { requestRepository } from '../../repositories/requestRepository'
import { mediaService } from '../../services/mediaService'
import { queryKeys } from '../../services/queryKeys'
import { localizeAppError } from '../../services/errors'
import { AppScreen, MapPanel, ProgressHeader, ScreenHeader, SectionHeading } from '../../components/v2'
import { BottomSheet, Button, Card, EmptyState, Skeleton, StatusBadge, Surface, Tabs, TextArea, TextField, useToast } from '../../components/ui'
import { useRequestComposer } from './RequestComposerContext'

function useTrilingual() {
  const { language } = useLanguageDirection()
  return (ar: string, he: string, en: string) => language === 'en' ? en : language === 'he' ? he : ar
}

const iconByCategory: Record<AssistanceCategoryId, Icon> = {
  mobility: Wheelchair,
  errands: Basket,
  home_support: HouseLine,
  accessibility: WheelchairMotion,
  accompaniment: UsersThree,
  language_help: Translate,
  digital_help: Laptop,
  community_response: HandHeart,
  other: DotsThreeCircle
}

function FlowShell({ step, title, subtitle, children, footer }: { step: number; title: string; subtitle?: string; children: React.ReactNode; footer?: React.ReactNode }) {
  const tr = useTrilingual()
  return <AppScreen header={<ScreenHeader title={title} subtitle={subtitle} back />} footer={footer} contentStyle={styles.flowContent}><ProgressHeader step={step} total={7} label={tr('إنشاء طلب مساندة', 'יצירת בקשת סיוע', 'Create support request')} />{children}</AppScreen>
}

export function EmergencyScreeningScreen() {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const tr = useTrilingual()
  const router = useRouter()
  const { draft, updateScreening } = useRequestComposer()
  const [handoffOpen, setHandoffOpen] = useState(false)
  const questions = [
    { key: 'immediateDanger' as const, Icon: ShieldWarning, title: tr('هل يوجد خطر مباشر على الحياة؟', 'האם קיימת סכנת חיים מיידית?', 'Is anyone in immediate danger?') },
    { key: 'medicalEmergency' as const, Icon: Ambulance, title: tr('هل توجد حالة طبية طارئة؟', 'האם זהו מצב חירום רפואי?', 'Is this a medical emergency?') },
    { key: 'fireOrViolence' as const, Icon: FirstAid, title: tr('هل يوجد حريق، عنف أو تهديد نشط؟', 'האם יש שריפה, אלימות או איום פעיל?', 'Is there fire, violence, or an active threat?') },
    { key: 'childOrVulnerablePersonAtRisk' as const, Icon: WheelchairMotion, title: tr('هل طفل أو شخص معرّض للخطر الآن؟', 'האם ילד או אדם פגיע נמצאים כעת בסיכון?', 'Is a child or vulnerable person at risk now?') }
  ]
  const emergency = requiresEmergencyHandoff(draft.screening)
  useEffect(() => { if (emergency) setHandoffOpen(true) }, [emergency])
  return <FlowShell step={1} title={tr('فحص الأمان أولاً', 'קודם בודקים בטיחות', 'Safety check first')} subtitle={tr('لن نؤخر المساندة — نوجّه الحالات الطارئة فوراً', 'לא נעכב סיוע — מצבי חירום מופנים מיד', 'We route emergencies immediately')} footer={<Button label={tr('لا توجد حالة طارئة — متابعة', 'אין מצב חירום — המשך', 'No emergency — continue')} disabled={emergency} onPress={() => router.push('/requester/category')} />}>
    <Surface tone="emergency" bordered={false} padding="lg"><View style={[styles.noticeRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}><ShieldCheck size={25} color={theme.colors.emergency} weight="duotone" /><Text style={[typography.small, { color: theme.colors.textPrimary, flex: 1, textAlign: isRTL ? 'right' : 'left' }]}>{tr('سَنَد ليس خدمة طوارئ. أجب بصراحة لنوصلك إلى الجهة الصحيحة.', 'סַנַד אינו שירות חירום. ענו בכנות כדי שנפנה אתכם נכון.', 'SANAD is not an emergency service. Answer honestly so we can route you correctly.')}</Text></View></Surface>
    <View style={styles.questions}>{questions.map(question => { const Icon = question.Icon; const yes = draft.screening[question.key]; return <Card key={question.key} elevation="none" bordered style={yes ? { borderColor: theme.colors.emergency } : undefined}><View style={[styles.questionRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}><View style={[styles.questionIcon, { backgroundColor: yes ? theme.colors.emergencySoft : theme.colors.surfaceMuted }]}><Icon size={22} color={yes ? theme.colors.emergency : theme.colors.textSecondary} weight="duotone" /></View><Text style={[typography.bodyMedium, { color: theme.colors.textPrimary, flex: 1, textAlign: isRTL ? 'right' : 'left' }]}>{question.title}</Text></View><Tabs value={yes ? 'yes' : 'no'} options={[{ value: 'no', label: tr('لا', 'לא', 'No') }, { value: 'yes', label: tr('نعم', 'כן', 'Yes') }]} onChange={value => updateScreening(question.key, value === 'yes')} /></Card> })}</View>
    <BottomSheet visible={handoffOpen} onClose={() => setHandoffOpen(false)} title={tr('اتصل بخدمة الطوارئ الآن', 'התקשרו עכשיו לשירותי החירום', 'Call emergency services now')} subtitle={tr('لا تنتظر تطابق متطوع في سَنَد.', 'אל תחכו להתאמת מתנדב בסַנַד.', 'Do not wait for a SANAD volunteer match.')} dismissible>
      <Button label={tr('الشرطة — 100', 'משטרה — 100', 'Police — 100')} variant="danger" onPress={() => Linking.openURL('tel:100')} />
      <Button label={tr('الإسعاف — 101', 'מד״א — 101', 'Ambulance — 101')} variant="danger" onPress={() => Linking.openURL('tel:101')} />
      <Button label={tr('الإطفاء والإنقاذ — 102', 'כבאות והצלה — 102', 'Fire & Rescue — 102')} variant="danger" onPress={() => Linking.openURL('tel:102')} />
      <Button label={tr('أخطأت في الإجابة', 'סימנתי בטעות', 'I selected this by mistake')} variant="ghost" onPress={() => { Object.keys(draft.screening).forEach(key => updateScreening(key as keyof typeof draft.screening, false)); setHandoffOpen(false) }} />
    </BottomSheet>
  </FlowShell>
}

export function CategoryScreen() {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const tr = useTrilingual()
  const { language } = useLanguageDirection()
  const router = useRouter()
  const { draft, update } = useRequestComposer()
  const categories = useQuery({ queryKey: queryKeys.categories, queryFn: requestRepository.listCategories })
  const rows = categories.data ?? []
  return <FlowShell step={2} title={tr('ما نوع المساندة؟', 'איזה סוג סיוע נדרש?', 'What kind of support?')} subtitle={tr('اختر الأقرب — يمكنك الشرح لاحقاً', 'בחרו את האפשרות הקרובה ביותר', 'Choose the closest fit')} footer={<Button label={tr('متابعة', 'המשך', 'Continue')} disabled={!draft.categoryId} onPress={() => router.push('/requester/scenario')} />}>
    {categories.isLoading ? <View style={styles.grid}><Skeleton height={150} /><Skeleton height={150} /></View> : null}
    {categories.isError ? <EmptyState title={tr('تعذر تحميل الفئات', 'לא ניתן לטעון קטגוריות', 'Could not load categories')} message={tr('حاول مجدداً', 'נסו שוב', 'Try again')} actionLabel={tr('إعادة المحاولة', 'ניסיון חוזר', 'Retry')} onAction={() => categories.refetch()} /> : null}
    <View style={styles.categoryGrid}>{rows.map(row => {
      const id = row.slug.replaceAll('-', '_') as AssistanceCategoryId
      const Icon = iconByCategory[id] ?? DotsThreeCircle
      const selected = draft.categoryId === id
      const title = language === 'en' ? row.name_en : language === 'he' ? row.name_he : row.name_ar
      const description = language === 'en' ? row.description_en : language === 'he' ? row.description_he : row.description_ar
      return <Pressable key={row.id} accessibilityRole="radio" accessibilityState={{ checked: selected }} onPress={() => update({ categoryId: id, scenarioId: null })} style={[styles.category, { backgroundColor: selected ? theme.colors.primarySoft : theme.colors.surface, borderColor: selected ? theme.colors.primary : theme.colors.border }]}><View style={[styles.categoryIcon, { backgroundColor: selected ? theme.colors.primary : theme.colors.surfaceMuted }]}><Icon size={25} color={selected ? theme.colors.onPrimary : theme.colors.textSecondary} weight="duotone" /></View><Text style={[typography.title, { color: theme.colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{title}</Text><Text numberOfLines={3} style={[typography.caption, { color: theme.colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{description}</Text>{selected ? <View style={[styles.check, { backgroundColor: theme.colors.primary }]}><Check size={13} color={theme.colors.onPrimary} weight="bold" /></View> : null}</Pressable>
    })}</View>
  </FlowShell>
}

export function ScenarioScreen() {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const tr = useTrilingual()
  const { language } = useLanguageDirection()
  const router = useRouter()
  const { draft, update } = useRequestComposer()
  const categories = useQuery({ queryKey: queryKeys.categories, queryFn: requestRepository.listCategories })
  const category = categories.data?.find(row => row.slug.replaceAll('-', '_') === draft.categoryId)
  const scenarios = useQuery({ queryKey: queryKeys.scenarios(category?.id), queryFn: () => requestRepository.listScenarios(category?.id), enabled: !!category?.id })
  return <FlowShell step={3} title={tr('اختر السيناريو الأقرب', 'בחרו את התרחיש הקרוב', 'Choose the closest scenario')} subtitle={tr('هذا يساعدنا في مطابقة المهارة المناسبة', 'כך נתאים את המיומנות המתאימה', 'This helps match the right skill')} footer={<Button label={tr('متابعة', 'המשך', 'Continue')} disabled={!draft.scenarioId} onPress={() => router.push('/requester/details')} />}>
    <View style={styles.scenarioList}>{(scenarios.data ?? []).map(row => {
      const selected = draft.scenarioId === row.id
      const title = language === 'en' ? row.name_en : language === 'he' ? row.name_he : row.name_ar
      const description = language === 'en' ? row.description_en : language === 'he' ? row.description_he : row.description_ar
      return <Pressable key={row.id} accessibilityRole="radio" accessibilityState={{ checked: selected }} onPress={() => update({ scenarioId: row.id })} style={[styles.scenario, { flexDirection: isRTL ? 'row-reverse' : 'row', borderColor: selected ? theme.colors.primary : theme.colors.border, backgroundColor: selected ? theme.colors.primarySoft : theme.colors.surface }]}><View style={styles.scenarioCopy}><Text style={[typography.title, { color: theme.colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{title}</Text><Text style={[typography.small, { color: theme.colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{description}</Text></View><View style={[styles.radio, { borderColor: selected ? theme.colors.primary : theme.colors.borderStrong }]}>{selected ? <View style={[styles.radioFill, { backgroundColor: theme.colors.primary }]} /> : null}</View></Pressable>
    })}</View>
  </FlowShell>
}

export function DetailsScreen() {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const tr = useTrilingual()
  const router = useRouter()
  const { draft, update } = useRequestComposer()
  return <FlowShell step={4} title={tr('أخبرنا بما تحتاجه', 'ספרו לנו מה נדרש', 'Tell us what you need')} subtitle={tr('تفاصيل واضحة تساعد المتطوع على الاستعداد', 'פרטים ברורים עוזרים למתנדב להתכונן', 'Clear details help a volunteer prepare')} footer={<Button label={tr('متابعة إلى الوسائط', 'המשך למדיה', 'Continue to media')} disabled={draft.details.trim().length < 10} onPress={() => router.push('/requester/media')} />}>
    <TextArea label={tr('وصف الطلب', 'תיאור הבקשה', 'Request details')} value={draft.details} onChangeText={details => update({ details })} placeholder={tr('مثال: أحتاج من يستلم دوائي من صيدلية قريبة…', 'לדוגמה: דרוש איסוף תרופה מבית מרקחת סמוך…', 'Example: I need someone to collect medicine from a nearby pharmacy…')} maxLength={800} required />
    <Text style={[typography.caption, { color: theme.colors.textMuted, textAlign: isRTL ? 'left' : 'right' }]}>{draft.details.length}/800</Text>
    <SectionHeading title={tr('مدى الاستعجال', 'רמת דחיפות', 'Urgency')} subtitle={tr('الطارئ يُوجّه لخدمات الطوارئ، وليس هنا', 'מצבי חירום מופנים לשירותי החירום', 'Emergencies are routed outside SANAD')} />
    <Tabs value={draft.urgency} options={[{ value: 'standard', label: tr('اليوم / مرن', 'היום / גמיש', 'Today / flexible') }, { value: 'urgent', label: tr('خلال ساعتين', 'בתוך שעתיים', 'Within 2 hours') }]} onChange={urgency => update({ urgency })} />
    <Surface tone="primary" bordered={false}><View style={[styles.noticeRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}><ShieldCheck size={23} color={theme.colors.primary} /><Text style={[typography.small, { color: theme.colors.textPrimary, flex: 1, textAlign: isRTL ? 'right' : 'left' }]}>{tr('لا تكتب أرقام هوية، بيانات بنكية أو كلمات مرور.', 'אין להזין מספר זהות, פרטי בנק או סיסמאות.', 'Do not include identity numbers, bank details, or passwords.')}</Text></View></Surface>
  </FlowShell>
}

export function MediaScreen() {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const tr = useTrilingual()
  const router = useRouter()
  const { draft, update } = useRequestComposer()
  async function pick(camera: boolean) {
    const permission = camera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) return
    const result = camera ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.75 }) : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.75 })
    if (!result.canceled && result.assets[0]) update({ mediaUri: result.assets[0].uri, mediaPath: null })
  }
  return <FlowShell step={5} title={tr('أضف صورة إن كانت مفيدة', 'הוסיפו תמונה אם זה עוזר', 'Add a photo if useful')} subtitle={tr('اختياري — تُحفظ صور الطلب بشكل خاص', 'אופציונלי — תמונות הבקשה נשמרות בפרטיות', 'Optional — request media stays private')} footer={<Button label={tr('متابعة إلى الموقع', 'המשך למיקום', 'Continue to location')} onPress={() => router.push('/requester/location')} />}>
    {draft.mediaUri ? <View style={[styles.preview, { borderColor: theme.colors.border }]}><Image source={{ uri: draft.mediaUri }} style={styles.previewImage} /><Pressable accessibilityRole="button" accessibilityLabel={tr('إزالة الصورة', 'הסרת התמונה', 'Remove image')} onPress={() => update({ mediaUri: null, mediaPath: null })} style={[styles.remove, { backgroundColor: theme.colors.surface }]}><X size={19} color={theme.colors.danger} /></Pressable></View> : <Surface tone="muted" padding="xxl" style={styles.mediaEmpty}><ImageSquare size={50} color={theme.colors.textMuted} weight="duotone" /><Text style={[typography.bodyMedium, { color: theme.colors.textPrimary }]}>{tr('لا توجد صورة مضافة', 'לא נוספה תמונה', 'No photo added')}</Text><Text style={[typography.caption, styles.center, { color: theme.colors.textSecondary }]}>{tr('صوّر المكان أو الغرض فقط. تجنب الوجوه والوثائق الحساسة.', 'צלמו רק את המקום או הפריט. הימנעו מפנים ומסמכים רגישים.', 'Photograph only the place or item. Avoid faces and sensitive documents.')}</Text></Surface>}
    <View style={[styles.mediaActions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}><Button fullWidth={false} label={tr('الكاميرا', 'מצלמה', 'Camera')} variant="outline" leading={<Camera size={20} color={theme.colors.primary} />} onPress={() => pick(true)} /><Button fullWidth={false} label={tr('المعرض', 'גלריה', 'Library')} variant="outline" leading={<ImageSquare size={20} color={theme.colors.primary} />} onPress={() => pick(false)} /></View>
    <Surface tone="community" bordered={false}><View style={[styles.noticeRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}><ShieldCheck size={23} color={theme.colors.community} /><Text style={[typography.small, { color: theme.colors.textPrimary, flex: 1, textAlign: isRTL ? 'right' : 'left' }]}>{tr('يمكنك أنت والمتطوع المطابق فقط فتح الصورة عبر رابط مؤقت.', 'רק אתם והמתנדב המותאם יכולים לפתוח את התמונה בקישור זמני.', 'Only you and the matched helper can open the image through a temporary link.')}</Text></View></Surface>
  </FlowShell>
}

export function LocationScreen() {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const tr = useTrilingual()
  const router = useRouter()
  const { draft, update } = useRequestComposer()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()
  async function locate() {
    setLoading(true); setError(undefined)
    try { const coords = await getCurrentCoords(); update({ ...coords, locationLabel: tr('موقعك الحالي في القدس', 'המיקום הנוכחי שלך בירושלים', 'Your current Jerusalem location') }) } catch { setError(tr('فعّل إذن الموقع أو أدخل وصفاً للمكان.', 'אפשרו הרשאת מיקום או הזינו תיאור מקום.', 'Enable location permission or enter a location description.')) } finally { setLoading(false) }
  }
  // Locate once on entry; the visible refresh button owns later updates.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (draft.latitude == null) void locate() }, [])
  return <FlowShell step={6} title={tr('أين تحتاج المساندة؟', 'איפה נדרש הסיוע?', 'Where is support needed?')} subtitle={tr('الموقع الدقيق يظهر بعد قبول المهمة فقط', 'המיקום המדויק מוצג רק לאחר קבלת המשימה', 'Exact location appears only after acceptance')} footer={<Button label={tr('مراجعة الطلب', 'בדיקת הבקשה', 'Review request')} disabled={draft.latitude == null || draft.longitude == null} onPress={() => router.push('/requester/review')} />}>
    <MapPanel latitude={draft.latitude ?? 31.7784} longitude={draft.longitude ?? 35.2066} />
    <Button label={loading ? tr('جارٍ تحديد الموقع…', 'מאתר מיקום…', 'Locating…') : tr('تحديث موقعي', 'עדכון המיקום שלי', 'Refresh my location')} variant="outline" loading={loading} leading={<NavigationArrow size={19} color={theme.colors.primary} />} onPress={locate} />
    <TextField label={tr('وصف المكان', 'תיאור המקום', 'Location note')} value={draft.locationLabel} onChangeText={locationLabel => update({ locationLabel })} placeholder={tr('مثال: قرب باب العمود', 'לדוגמה: ליד שער שכם', 'Example: near Damascus Gate')} error={error} />
    <Surface tone="community" bordered={false}><View style={[styles.noticeRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}><MapPin size={23} color={theme.colors.community} weight="duotone" /><Text style={[typography.small, { color: theme.colors.textPrimary, flex: 1, textAlign: isRTL ? 'right' : 'left' }]}>{tr('نطاق الإطلاق الأول هو القدس. الطلبات خارج النطاق قد تستغرق وقتاً أطول.', 'אזור ההשקה הראשון הוא ירושלים. בקשות מחוץ לאזור עשויות להימשך יותר.', 'Jerusalem is the first launch area. Requests outside it may take longer.')}</Text></View></Surface>
  </FlowShell>
}

export function ReviewScreen() {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const tr = useTrilingual()
  const { language } = useLanguageDirection()
  const router = useRouter()
  const toast = useToast()
  const queryClient = useQueryClient()
  const { session } = useAuth()
  const { draft, update } = useRequestComposer()
  const category = assistanceCategories.find(item => item.id === draft.categoryId)
  const mutation = useMutation({
    mutationFn: async () => {
      if (!session || !draft.categoryId || draft.latitude == null || draft.longitude == null) throw new Error('Request draft is incomplete')
      let mediaPath = draft.mediaPath
      if (draft.mediaUri && !mediaPath) {
        mediaPath = `${session.user.id}/draft-${Date.now()}/request.jpg`
        await mediaService.upload({ bucket: 'request-media', path: mediaPath, uri: draft.mediaUri, contentType: 'image/jpeg' })
        update({ mediaPath })
      }
      return requestRepository.create({ requesterId: session.user.id, categoryId: draft.categoryId, scenarioId: draft.scenarioId, details: draft.details.trim(), urgency: draft.urgency, latitude: draft.latitude, longitude: draft.longitude, locationLabel: draft.locationLabel.trim() || null, mediaPaths: mediaPath ? [mediaPath] : [] })
    },
    onSuccess: async request => {
      if (session) await queryClient.invalidateQueries({ queryKey: queryKeys.activeMission(session.user.id) })
      router.replace({ pathname: '/requester/matching', params: { requestId: request.id } })
    },
    onError: cause => toast.show(localizeAppError(cause, tr), 'error')
  })
  return <FlowShell step={7} title={tr('راجع طلبك', 'בדקו את הבקשה', 'Review your request')} subtitle={tr('لن يظهر للمجتمع العام — فقط للمتطوعين المؤهلين', 'הבקשה תוצג רק למתנדבים מתאימים', 'Only eligible helpers can see it')} footer={<Button label={tr('إرسال طلب المساندة', 'שליחת בקשת הסיוע', 'Send support request')} size="lg" loading={mutation.isPending} onPress={() => mutation.mutate()} />}>
    <Card title={category ? localized(category.label, language) : tr('مساندة مجتمعية', 'סיוע קהילתי', 'Community support')} subtitle={draft.urgency === 'urgent' ? tr('مطلوب خلال ساعتين', 'נדרש בתוך שעתיים', 'Needed within 2 hours') : tr('توقيت مرن', 'תזמון גמיש', 'Flexible timing')} leading={category ? (() => { const Icon = iconByCategory[category.id]; return <View style={[styles.reviewIcon, { backgroundColor: theme.colors.primarySoft }]}><Icon size={24} color={theme.colors.primary} weight="duotone" /></View> })() : null}>
      <Text style={[typography.body, { color: theme.colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{draft.details}</Text>
    </Card>
    {draft.mediaUri ? <Image source={{ uri: draft.mediaUri }} style={styles.reviewImage} /> : null}
    <MapPanel latitude={draft.latitude ?? 31.7784} longitude={draft.longitude ?? 35.2066} height={235} interactive={false} />
    <Card tone="muted" elevation="none" title={tr('قبل الإرسال', 'לפני השליחה', 'Before sending')}><View style={styles.checkList}>{[tr('لم أشارك بيانات حساسة', 'לא שיתפתי מידע רגיש', 'I did not share sensitive data'), tr('هذا ليس طارئاً', 'זה אינו מצב חירום', 'This is not an emergency'), tr('الموقع والتفاصيل صحيحة', 'המיקום והפרטים נכונים', 'Location and details are correct')].map(item => <View key={item} style={[styles.checkRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}><CheckCircle size={19} color={theme.colors.community} weight="fill" /><Text style={[typography.small, { color: theme.colors.textSecondary }]}>{item}</Text></View>)}</View></Card>
  </FlowShell>
}

export function MatchingScreen() {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const tr = useTrilingual()
  const isRTL = useIsRTL()
  const router = useRouter()
  const { requestId } = useLocalSearchParams<{ requestId: string }>()
  const { session } = useAuth()
  const { reset } = useRequestComposer()
  const queryClient = useQueryClient()
  const active = useQuery({ queryKey: session ? queryKeys.activeMission(session.user.id) : ['matching'], queryFn: () => missionRepository.getActive(session!.user.id), enabled: !!session, refetchInterval: 4_000 })
  useEffect(() => {
    if (active.data?.helper_id) router.replace({ pathname: '/requester/assigned', params: { missionId: active.data.id } })
  }, [active.data?.helper_id, active.data?.id, router])
  return <AppScreen background={civicColors.navy} contentStyle={styles.matchingContent}>
    <View style={styles.matchingTop}><StatusBadge label={tr('بحث مباشر', 'חיפוש בזמן אמת', 'LIVE MATCHING')} tone="info" dot /><Text style={[typography.hero, { color: palette.onCivic, textAlign: isRTL ? 'right' : 'left' }]}>{tr('نبحث عن الشخص المناسب', 'מחפשים את האדם המתאים', 'Finding the right person')}</Text><Text style={[typography.body, { color: palette.onCivicMuted, textAlign: isRTL ? 'right' : 'left' }]}>{tr('نطابق الفئة، اللغة، القرب والتوفر — وليس الأسرع فقط.', 'אנחנו מתאימים קטגוריה, שפה, קרבה וזמינות — לא רק מהירות.', 'We match category, language, proximity, and availability—not speed alone.')}</Text></View>
    <View style={styles.radar}><View style={[styles.radarRing, styles.ringThree, { borderColor: palette.civicRadarOuter }]} /><View style={[styles.radarRing, styles.ringTwo, { borderColor: palette.civicRadarMiddle }]} /><View style={[styles.radarRing, styles.ringOne, { borderColor: palette.civicRadarInner }]} /><View style={[styles.radarCore, { backgroundColor: theme.colors.primary }]}><NavigationArrow size={30} color={theme.colors.onPrimary} weight="fill" /></View><View style={[styles.matchNode, styles.matchNodeA, { backgroundColor: theme.colors.community }]} /><View style={[styles.matchNode, styles.matchNodeB, { backgroundColor: theme.colors.reward }]} /><View style={[styles.matchNode, styles.matchNodeC, { backgroundColor: theme.colors.primary }]} /></View>
    <Surface tone="navy" bordered padding="lg" style={styles.matchingCard}><View style={[styles.noticeRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}><ActivityIndicator color={palette.civicSignalSoft} /><View style={{ flex: 1 }}><Text style={[typography.bodyMedium, { color: palette.onCivic, textAlign: isRTL ? 'right' : 'left' }]}>{tr('يتم إشعار المتطوعين المؤهلين القريبين', 'מתנדבים מתאימים בקרבת מקום מקבלים התראה', 'Eligible nearby helpers are being notified')}</Text><Text style={[typography.caption, { color: palette.onCivicFaint, textAlign: isRTL ? 'right' : 'left' }]}>{tr('يمكنك إغلاق التطبيق؛ سنرسل إشعاراً عند المطابقة.', 'אפשר לסגור את האפליקציה; נשלח התראה לאחר התאמה.', 'You can close the app; we will notify you when matched.')}</Text></View></View></Surface>
    <Button label={tr('إلغاء الطلب', 'ביטול הבקשה', 'Cancel request')} variant="ghost" onPress={async () => { if (requestId) await requestRepository.cancel(String(requestId)); await reset(); if (session) await queryClient.invalidateQueries({ queryKey: queryKeys.activeMission(session.user.id) }); router.replace('/(tabs)') }} />
  </AppScreen>
}

export function AssignedScreen() {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const tr = useTrilingual()
  const isRTL = useIsRTL()
  const router = useRouter()
  const { missionId } = useLocalSearchParams<{ missionId: string }>()
  return <AppScreen background={theme.colors.community} contentStyle={styles.assignedContent}>
    <View style={styles.assignedMark}><Check size={40} color={theme.colors.community} weight="bold" /></View>
    <View style={styles.assignedCopy}><Text style={[typography.eyebrow, { color: palette.onCommunitySubtle, textAlign: isRTL ? 'right' : 'left' }]}>{tr('تمت المطابقة', 'נמצאה התאמה', 'MATCH FOUND')}</Text><Text style={[typography.hero, { color: palette.onCivic, textAlign: isRTL ? 'right' : 'left' }]}>{tr('هناك من يسندك الآن', 'יש מי שתומך בך עכשיו', 'Someone is supporting you now')}</Text><Text style={[typography.body, { color: palette.onCommunityMuted, textAlign: isRTL ? 'right' : 'left' }]}>{tr('ستظهر هوية المتطوع وحالته وموقعه المباشر في شاشة المهمة.', 'זהות המתנדב, הסטטוס והמיקום החי יוצגו במסך המשימה.', 'Helper identity, live status, and location are now available in the mission.')}</Text></View>
    <Card tone="navy" bordered={false} title={tr('تذكير بالأمان', 'תזכורת בטיחות', 'Safety reminder')} subtitle={tr('لا تشارك رمزاً بنكياً أو كلمة مرور. يمكنك الإبلاغ أو الحظر في أي وقت.', 'אין לשתף קוד בנקאי או סיסמה. אפשר לדווח או לחסום בכל עת.', 'Never share a banking code or password. Report or block at any time.')} />
    <Button label={tr('فتح المهمة المباشرة', 'פתיחת המשימה החיה', 'Open live mission')} size="lg" onPress={() => router.replace({ pathname: '/mission/[missionId]', params: { missionId: String(missionId) } })} />
  </AppScreen>
}

const styles = StyleSheet.create({
  flowContent: { paddingTop: space.lg, gap: space.xl },
  noticeRow: { alignItems: 'flex-start', gap: space.md },
  questions: { gap: space.md },
  questionRow: { alignItems: 'center', gap: space.md, marginBottom: space.lg },
  questionIcon: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  grid: { gap: space.md },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  category: { width: '47.8%', minHeight: 166, borderRadius: radius.lg, borderWidth: 1.5, padding: space.lg, gap: space.sm },
  categoryIcon: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginBottom: space.xs },
  check: { position: 'absolute', top: space.md, right: space.md, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  scenarioList: { gap: space.md },
  scenario: { minHeight: 92, borderRadius: radius.lg, borderWidth: 1.5, padding: space.lg, alignItems: 'center', gap: space.md },
  scenarioCopy: { flex: 1, gap: 4 },
  radio: { width: 23, height: 23, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioFill: { width: 12, height: 12, borderRadius: 6 },
  mediaEmpty: { alignItems: 'center', gap: space.md },
  center: { textAlign: 'center' },
  mediaActions: { justifyContent: 'center', gap: space.md },
  preview: { height: 280, borderRadius: radius.xl, overflow: 'hidden', borderWidth: 1 },
  previewImage: { width: '100%', height: '100%' },
  remove: { position: 'absolute', top: space.md, right: space.md, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  reviewIcon: { width: 46, height: 46, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  reviewImage: { width: '100%', height: 210, borderRadius: radius.lg },
  checkList: { gap: space.md },
  checkRow: { alignItems: 'center', gap: space.sm },
  matchingContent: { flex: 1, minHeight: 760, justifyContent: 'space-between', paddingVertical: space.xxl },
  matchingTop: { gap: space.md },
  radar: { width: 260, height: 260, alignSelf: 'center', alignItems: 'center', justifyContent: 'center' },
  radarRing: { position: 'absolute', borderWidth: 1, borderRadius: 999 },
  ringThree: { width: 250, height: 250 }, ringTwo: { width: 180, height: 180 }, ringOne: { width: 112, height: 112 },
  radarCore: { width: 68, height: 68, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  matchNode: { position: 'absolute', width: 15, height: 15, borderRadius: 8 },
  matchNodeA: { left: 34, top: 84 }, matchNodeB: { right: 48, bottom: 52 }, matchNodeC: { right: 31, top: 65 },
  matchingCard: { borderColor: palette.civicBorder },
  assignedContent: { flex: 1, minHeight: 760, justifyContent: 'center', gap: space.xxl },
  assignedMark: { width: 88, height: 88, borderRadius: 32, backgroundColor: palette.onCivic, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  assignedCopy: { gap: space.md }
})
