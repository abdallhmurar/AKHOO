import { useMemo, useState } from 'react'
import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, Buildings, CheckCircle, Crown, Gift, Globe, HandHeart, MapPin, Phone, SealCheck, Star, Storefront, Tag, Ticket, Trophy, WhatsappLogo } from 'phosphor-react-native'
import { directionsHref, telHref, whatsappHref } from '../../lib/contactLinks'
import { useIsRTL } from '../../lib/direction'
import { civicColors, palette, radius, space, useSanadTheme } from '../../lib/theme'
import { useAppTypography } from '../../lib/typography'
import { useAuth, useLanguageDirection } from '../../providers'
import { communityRepository } from '../../repositories/communityRepository'
import { rewardRepository } from '../../repositories/rewardRepository'
import { localizeAppError } from '../../services/errors'
import { queryKeys } from '../../services/queryKeys'
import type { Partner, PartnerOffer } from '../../types'
import { AppScreen, ListRow, MapPanel, ScreenHeader, SectionHeading } from '../../components/v2'
import { Avatar, BottomSheet, Button, Card, EmptyState, Skeleton, StatusBadge, Surface, Tabs, TextField, useToast } from '../../components/ui'
import { useV2Text } from '../v2Copy'

type OfferWithPartner = PartnerOffer & { partner?: Partner }

function useTrilingual() {
  const { language } = useLanguageDirection()
  return (ar: string, he: string, en: string) => language === 'en' ? en : language === 'he' ? he : ar
}

export function CommunityHubScreen() {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const tr = useTrilingual()
  const t = useV2Text()
  const router = useRouter()
  const { session } = useAuth()
  const businesses = useQuery({ queryKey: queryKeys.businesses('jerusalem'), queryFn: () => communityRepository.businesses() })
  const offers = useQuery({ queryKey: queryKeys.offers('jerusalem'), queryFn: () => communityRepository.offers() })
  const points = useQuery({ queryKey: session ? queryKeys.points(session.user.id) : ['points'], queryFn: () => rewardRepository.points(session!.user.id), enabled: !!session })
  return <AppScreen contentStyle={styles.content}>
    <View style={styles.hero}><View style={[styles.heroTop, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}><View style={[styles.heroIcon, { backgroundColor: theme.colors.community }]}><Storefront size={30} color={theme.colors.onCommunity} weight="duotone" /></View><StatusBadge label="JERUSALEM" tone="success" dot /></View><Text style={[typography.hero, { color: theme.colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{t('community.title')}</Text><Text style={[typography.body, { color: theme.colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{t('community.body')}</Text></View>
    <View style={[styles.communityGrid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
      <HubCard title={t('community.businesses')} subtitle={tr(`${businesses.data?.length ?? 0} مصالح موثقة`, `${businesses.data?.length ?? 0} עסקים מאומתים`, `${businesses.data?.length ?? 0} verified businesses`)} Icon={Buildings} tone="community" onPress={() => router.push('/community/businesses')} />
      <HubCard title={t('community.offers')} subtitle={tr(`${offers.data?.length ?? 0} عروض محلية`, `${offers.data?.length ?? 0} הטבות מקומיות`, `${offers.data?.length ?? 0} local offers`)} Icon={Tag} tone="primary" onPress={() => router.push('/community/offers')} />
      <HubCard title={t('community.rewards')} subtitle={tr('استبدل نقاط الأثر', 'מימוש נקודות השפעה', 'Redeem impact points')} Icon={Gift} tone="reward" onPress={() => router.push('/community/rewards')} />
      <HubCard title={t('community.plus')} subtitle={tr('مزايا تعيد القيمة للمجتمع', 'הטבות שמחזירות ערך לקהילה', 'Benefits that return value')} Icon={Crown} tone="navy" onPress={() => router.push('/community/plus')} />
    </View>
    <Card tone="navy" bordered={false} title={tr('رصيد الأثر', 'יתרת השפעה', 'Impact balance')} subtitle={tr('تكسبه عند إكمال مهام مساندة مؤكدة', 'נוצר ממשימות סיוע שהושלמו ואושרו', 'Earned from confirmed support missions')} leading={<Trophy size={28} color={theme.colors.reward} weight="duotone" />} trailing={<Text style={[typography.numeric, { color: palette.onCivic }]}>{points.data?.balance ?? 0}</Text>} onPress={() => router.push('/community/points')} />
    <SectionHeading title={tr('مصالح مختارة', 'עסקים נבחרים', 'Featured businesses')} action={<Button fullWidth={false} size="sm" variant="ghost" label={tr('عرض الكل', 'הכול', 'See all')} onPress={() => router.push('/community/businesses')} />} />
    {businesses.isLoading ? <Skeleton height={144} /> : null}
    <View style={styles.horizontalCards}>{(businesses.data ?? []).slice(0, 3).map(business => <BusinessCompact key={business.id} business={business} onPress={() => router.push({ pathname: '/community/business/[businessId]', params: { businessId: business.id } })} />)}</View>
    <SectionHeading title={tr('عروض للمجتمع', 'הטבות לקהילה', 'Community offers')} action={<Button fullWidth={false} size="sm" variant="ghost" label={tr('عرض الكل', 'הכול', 'See all')} onPress={() => router.push('/community/offers')} />} />
    {(offers.data ?? []).slice(0, 2).map(offer => <OfferRow key={offer.id} offer={offer as OfferWithPartner} onPress={() => router.push({ pathname: '/community/offer/[offerId]', params: { offerId: offer.id } })} />)}
  </AppScreen>
}

function HubCard({ title, subtitle, Icon, tone, onPress }: { title: string; subtitle: string; Icon: typeof Buildings; tone: 'community' | 'primary' | 'reward' | 'navy'; onPress: () => void }) {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const fills = { community: theme.colors.communitySoft, primary: theme.colors.primarySoft, reward: theme.colors.rewardSoft, navy: civicColors.navy }
  const inks = { community: theme.colors.community, primary: theme.colors.primary, reward: theme.colors.rewardPressed, navy: palette.onCivic }
  return <Pressable onPress={onPress} style={[styles.hubCard, { backgroundColor: fills[tone], borderColor: tone === 'navy' ? palette.civicBorder : theme.colors.border }]}><View style={[styles.hubIcon, { backgroundColor: tone === 'navy' ? palette.whiteAlpha08 : theme.colors.surface }]}><Icon size={25} color={inks[tone]} weight="duotone" /></View><View style={{ gap: 4 }}><Text style={[typography.title, { color: tone === 'navy' ? palette.onCivic : theme.colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{title}</Text><Text style={[typography.caption, { color: tone === 'navy' ? palette.onCivicMuted : theme.colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{subtitle}</Text></View></Pressable>
}

function BusinessCompact({ business, onPress }: { business: Partner; onPress: () => void }) {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const tr = useTrilingual()
  return <Pressable onPress={onPress} style={[styles.businessCompact, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>{business.logo_url ? <Image source={{ uri: business.logo_url }} style={styles.businessLogo} /> : <View style={[styles.businessLogo, styles.logoPlaceholder, { backgroundColor: theme.colors.communitySoft }]}><Storefront size={28} color={theme.colors.community} /></View>}<View style={{ flex: 1, gap: 3 }}><View style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}><Text numberOfLines={1} style={[typography.title, { color: theme.colors.textPrimary, flex: 1, textAlign: isRTL ? 'right' : 'left' }]}>{business.name}</Text><SealCheck size={18} color={theme.colors.community} weight="fill" /></View><Text numberOfLines={1} style={[typography.caption, { color: theme.colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{business.address || tr('القدس', 'ירושלים', 'Jerusalem')}</Text></View><ArrowRight size={17} color={theme.colors.textMuted} /></Pressable>
}

export function BusinessesScreen() {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const tr = useTrilingual()
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const query = useQuery({ queryKey: queryKeys.businesses('jerusalem'), queryFn: () => communityRepository.businesses() })
  const categories = useMemo(() => ['all', ...new Set((query.data ?? []).map(item => item.category))], [query.data])
  const filtered = useMemo(() => (query.data ?? []).filter(item => (category === 'all' || item.category === category) && (!search.trim() || `${item.name} ${item.description ?? ''} ${item.address ?? ''}`.toLowerCase().includes(search.toLowerCase()))), [query.data, search, category])
  return <AppScreen header={<ScreenHeader title={tr('دليل المصالح', 'מדריך עסקים', 'Business directory')} subtitle={tr('مصالح موثقة تخدم مجتمع القدس', 'עסקים מאומתים שמשרתים את קהילת ירושלים', 'Verified businesses serving Jerusalem')} back />} contentStyle={styles.content}>
    <TextField value={search} onChangeText={setSearch} placeholder={tr('ابحث عن مصلحة أو خدمة', 'חיפוש עסק או שירות', 'Search businesses or services')} />
    <View style={styles.filterRow}>{categories.map(value => <Pressable key={value} onPress={() => setCategory(value)} style={[styles.filterChip, { backgroundColor: category === value ? theme.colors.primary : theme.colors.surface, borderColor: category === value ? theme.colors.primary : theme.colors.border }]}><Text style={[typography.caption, { color: category === value ? theme.colors.onPrimary : theme.colors.textSecondary }]}>{value === 'all' ? tr('الكل', 'הכול', 'All') : value.replaceAll('_', ' ')}</Text></Pressable>)}</View>
    {query.isLoading ? <><Skeleton height={120} /><Skeleton height={120} /></> : null}
    {!query.isLoading && !filtered.length ? <EmptyState title={tr('لا توجد نتائج', 'אין תוצאות', 'No results')} message={tr('جرّب بحثاً أو فئة أخرى.', 'נסו חיפוש או קטגוריה אחרת.', 'Try another search or category.')} /> : null}
    <View style={styles.businessList}>{filtered.map(business => <BusinessCompact key={business.id} business={business} onPress={() => router.push({ pathname: '/community/business/[businessId]', params: { businessId: business.id } })} />)}</View>
  </AppScreen>
}

export function BusinessDetailScreen() {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const tr = useTrilingual()
  const router = useRouter()
  const { businessId } = useLocalSearchParams<{ businessId: string }>()
  const query = useQuery({ queryKey: queryKeys.business(String(businessId)), queryFn: () => communityRepository.business(String(businessId)) })
  if (query.isLoading) return <AppScreen header={<ScreenHeader title={tr('تفاصيل المصلحة', 'פרטי העסק', 'Business details')} back />}><Skeleton height={260} /><Skeleton height={180} /></AppScreen>
  if (!query.data) return <AppScreen header={<ScreenHeader title={tr('تفاصيل المصلحة', 'פרטי העסק', 'Business details')} back />}><EmptyState title={tr('المصلحة غير متاحة', 'העסק אינו זמין', 'Business unavailable')} message={tr('ربما تغيّر وضعها في الدليل.', 'ייתכן שהסטטוס שלה במדריך השתנה.', 'Its directory status may have changed.')} /></AppScreen>
  const business = query.data
  return <AppScreen header={<ScreenHeader title={business.name} subtitle={tr('مصلحة موثقة', 'עסק מאומת', 'Verified business')} back trailing={<SealCheck size={25} color={theme.colors.community} weight="fill" />} />} contentStyle={styles.content}>
    {business.photos[0]?.url || business.logo_url ? <Image source={{ uri: business.photos[0]?.url ?? business.logo_url! }} style={styles.businessHeroImage} /> : <View style={[styles.businessHeroImage, styles.logoPlaceholder, { backgroundColor: theme.colors.communitySoft }]}><Storefront size={54} color={theme.colors.community} /></View>}
    <View style={{ gap: space.sm }}><View style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}><StatusBadge label={business.category.replaceAll('_', ' ')} tone="success" /><View style={styles.rating}><Star size={17} color={theme.colors.reward} weight="fill" /><Text style={[typography.smallMedium, { color: theme.colors.textPrimary }]}>{business.rating?.average_rating?.toFixed(1) ?? 'New'}</Text></View></View><Text style={[typography.h1, { color: theme.colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{business.name}</Text><Text style={[typography.body, { color: theme.colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{business.description || tr('مصلحة محلية موثقة ضمن شبكة سَنَد.', 'עסק מקומי מאומת ברשת סַנַד.', 'A verified local business in the SANAD network.')}</Text></View>
    <View style={[styles.quickButtons, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>{business.phone ? <Button fullWidth={false} label={tr('اتصال', 'חיוג', 'Call')} variant="outline" leading={<Phone size={18} color={theme.colors.primary} />} onPress={() => Linking.openURL(telHref(business.phone!))} /> : null}{business.whatsapp ? <Button fullWidth={false} label="WhatsApp" variant="outline" leading={<WhatsappLogo size={18} color={theme.colors.community} />} onPress={() => Linking.openURL(whatsappHref(business.whatsapp!))} /> : null}{business.latitude != null && business.longitude != null ? <Button fullWidth={false} label={tr('الاتجاهات', 'ניווט', 'Directions')} variant="outline" leading={<MapPin size={18} color={theme.colors.primary} />} onPress={() => Linking.openURL(directionsHref(business.latitude!, business.longitude!))} /> : null}</View>
    {business.latitude != null && business.longitude != null ? <MapPanel latitude={business.latitude} longitude={business.longitude} height={240} interactive={false} /> : null}
    <Card title={tr('المعلومات', 'מידע', 'Information')} elevation="none"><View>{business.address ? <ListRow title={business.address} Icon={MapPin} /> : null}{business.website_url ? <ListRow title={tr('الموقع الإلكتروني', 'אתר אינטרנט', 'Website')} subtitle={business.website_url} Icon={Globe} onPress={() => Linking.openURL(business.website_url!)} /> : null}</View></Card>
    {business.offers.length ? <><SectionHeading title={tr('عروض متاحة', 'הטבות זמינות', 'Available offers')} />{business.offers.map(offer => <OfferRow key={offer.id} offer={{ ...offer, partner: business }} onPress={() => router.push({ pathname: '/community/offer/[offerId]', params: { offerId: offer.id } })} />)}</> : null}
    {business.reviews.length ? <><SectionHeading title={tr('تقييمات المجتمع', 'דירוגי הקהילה', 'Community reviews')} />{business.reviews.slice(0, 4).map(review => <Card key={review.id} elevation="none" leading={<Avatar name={tr('عضو المجتمع', 'חבר/ת הקהילה', 'Community member')} size={38} />} trailing={<View style={styles.rating}><Star size={15} color={theme.colors.reward} weight="fill" /><Text>{review.rating}</Text></View>}><Text style={[typography.small, { color: theme.colors.textSecondary }]}>{review.comment}</Text></Card>)}</> : null}
  </AppScreen>
}

function OfferRow({ offer, onPress }: { offer: OfferWithPartner; onPress: () => void }) {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const tr = useTrilingual()
  return <Pressable onPress={onPress} style={[styles.offerRow, { flexDirection: isRTL ? 'row-reverse' : 'row', backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>{offer.image_url ? <Image source={{ uri: offer.image_url }} style={styles.offerImage} /> : <View style={[styles.offerImage, styles.logoPlaceholder, { backgroundColor: theme.colors.rewardSoft }]}><Tag size={27} color={theme.colors.rewardPressed} /></View>}<View style={styles.offerCopy}><View style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>{offer.member_only ? <StatusBadge label="SANAD+" tone="reward" /> : <StatusBadge label={tr('للمجتمع', 'לקהילה', 'Community')} tone="success" />}</View><Text numberOfLines={2} style={[typography.title, { color: theme.colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{offer.title}</Text><Text numberOfLines={1} style={[typography.caption, { color: theme.colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{offer.partner?.name ?? tr('شريك سَنَد', 'שותף סַנַד', 'SANAD partner')}</Text></View><ArrowRight size={18} color={theme.colors.textMuted} /></Pressable>
}

export function OffersScreen() {
  const tr = useTrilingual()
  const router = useRouter()
  const [filter, setFilter] = useState<'all' | 'plus'>('all')
  const query = useQuery({ queryKey: queryKeys.offers('jerusalem'), queryFn: () => communityRepository.offers() })
  const offers = (query.data ?? []).filter(item => filter === 'all' || item.member_only)
  return <AppScreen header={<ScreenHeader title={tr('العروض', 'הטבות', 'Offers')} subtitle={tr('قيمة محلية تعود للمجتمع', 'ערך מקומי שחוזר לקהילה', 'Local value returned to the community')} back />} contentStyle={styles.content}>
    <Tabs value={filter} options={[{ value: 'all', label: tr('كل العروض', 'כל ההטבות', 'All offers') }, { value: 'plus', label: 'SANAD+' }]} onChange={setFilter} />
    {query.isLoading ? <><Skeleton height={126} /><Skeleton height={126} /></> : null}
    {!offers.length && !query.isLoading ? <EmptyState title={tr('لا توجد عروض حالياً', 'אין כרגע הטבות', 'No offers right now')} message={tr('ستظهر عروض المصالح الموثقة هنا.', 'הטבות מעסקים מאומתים יופיעו כאן.', 'Offers from verified businesses will appear here.')} /> : null}
    {offers.map(offer => <OfferRow key={offer.id} offer={offer as OfferWithPartner} onPress={() => router.push({ pathname: '/community/offer/[offerId]', params: { offerId: offer.id } })} />)}
  </AppScreen>
}

export function OfferDetailScreen() {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const tr = useTrilingual()
  const router = useRouter()
  const toast = useToast()
  const { offerId } = useLocalSearchParams<{ offerId: string }>()
  const query = useQuery({ queryKey: queryKeys.offer(String(offerId)), queryFn: () => communityRepository.offer(String(offerId)) })
  const [code, setCode] = useState<string | null>(null)
  const redeem = useMutation({ mutationFn: () => communityRepository.redeemOffer(String(offerId)), onSuccess: data => { const value = Array.isArray(data) ? data[0] : data; setCode((value as any)?.code ?? String(value ?? '')); toast.show(tr('تم إنشاء رمز خاص لك', 'נוצר עבורכם קוד אישי', 'Your personal code is ready'), 'success') }, onError: cause => toast.show(localizeAppError(cause, tr), 'error') })
  if (query.isLoading) return <AppScreen header={<ScreenHeader title={tr('تفاصيل العرض', 'פרטי ההטבה', 'Offer details')} back />}><Skeleton height={300} /><Skeleton height={180} /></AppScreen>
  if (!query.data) return <AppScreen header={<ScreenHeader title={tr('تفاصيل العرض', 'פרטי ההטבה', 'Offer details')} back />}><EmptyState title={tr('العرض غير متاح', 'ההטבה אינה זמינה', 'Offer unavailable')} message={tr('ربما انتهت صلاحيته.', 'ייתכן שפג תוקפה.', 'It may have expired.')} /></AppScreen>
  const offer = query.data as OfferWithPartner
  return <AppScreen header={<ScreenHeader title={tr('تفاصيل العرض', 'פרטי ההטבה', 'Offer details')} back />} footer={!code ? <Button label={tr('الحصول على الرمز', 'קבלת קוד', 'Get offer code')} variant={offer.member_only ? 'reward' : 'primary'} loading={redeem.isPending} onPress={() => redeem.mutate()} /> : undefined} contentStyle={styles.content}>
    {offer.image_url ? <Image source={{ uri: offer.image_url }} style={styles.offerHeroImage} /> : <View style={[styles.offerHeroImage, styles.logoPlaceholder, { backgroundColor: theme.colors.rewardSoft }]}><Gift size={60} color={theme.colors.rewardPressed} weight="duotone" /></View>}
    <View style={{ gap: space.md }}><StatusBadge label={offer.member_only ? 'SANAD+' : tr('عرض مجتمعي', 'הטבה קהילתית', 'Community offer')} tone={offer.member_only ? 'reward' : 'success'} /><Text style={[typography.h1, { color: theme.colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{offer.title}</Text><Text style={[typography.body, { color: theme.colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{offer.description}</Text></View>
    {code ? <Surface tone="reward" bordered={false} padding="xxl" style={styles.codeCard}><Ticket size={38} color={theme.colors.rewardPressed} weight="duotone" /><Text style={[typography.caption, { color: theme.colors.textSecondary }]}>{tr('رمزك الخاص', 'הקוד האישי שלכם', 'Your personal code')}</Text><Text selectable style={[typography.numeric, { color: theme.colors.textPrimary, letterSpacing: 3 }]}>{code}</Text><Text style={[typography.caption, styles.center, { color: theme.colors.textSecondary }]}>{tr('اعرض الرمز للمصلحة. لا تشاركه علناً.', 'הציגו את הקוד בבית העסק. אין לשתף אותו בפומבי.', 'Show this at the business. Do not share it publicly.')}</Text></Surface> : null}
    {offer.partner ? <BusinessCompact business={offer.partner} onPress={() => router.push({ pathname: '/community/business/[businessId]', params: { businessId: offer.partner!.id } })} /> : null}
    <Card title={tr('الشروط', 'תנאים', 'Terms')} elevation="none"><Text style={[typography.small, { color: theme.colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{offer.terms || tr('يُستخدم مرة واحدة وفق توفر المصلحة. لا قيمة نقدية للعرض.', 'למימוש חד-פעמי, בכפוף לזמינות העסק. אין ערך כספי.', 'One-time use, subject to business availability. No cash value.')}</Text></Card>
  </AppScreen>
}

export function PlusScreen() {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const tr = useTrilingual()
  const toast = useToast()
  const { session } = useAuth()
  const queryClient = useQueryClient()
  const membership = useQuery({ queryKey: session ? queryKeys.membership(session.user.id) : ['membership'], queryFn: () => communityRepository.membership(session!.user.id), enabled: !!session })
  const request = useMutation({ mutationFn: () => communityRepository.requestPlusMembership(), onSuccess: async () => { if (session) await queryClient.invalidateQueries({ queryKey: queryKeys.membership(session.user.id) }); toast.show(tr('تم تسجيل طلب الانضمام', 'בקשת ההצטרפות נרשמה', 'Membership request recorded'), 'success') }, onError: cause => toast.show(localizeAppError(cause, tr), 'error') })
  const active = membership.data?.status === 'active'
  return <AppScreen header={<ScreenHeader title="SANAD+" subtitle={tr('قيمة أكبر للمجتمع', 'יותר ערך לקהילה', 'More value for the community')} back />} contentStyle={styles.content}>
    <View style={[styles.plusHero, { backgroundColor: civicColors.navy }]}><View style={[styles.plusTop, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}><Crown size={34} color={theme.colors.reward} weight="duotone" /><StatusBadge label={active ? tr('عضوية نشطة', 'חברות פעילה', 'ACTIVE') : tr('دعوة للانضمام', 'הזמנה להצטרף', 'MEMBERSHIP')} tone="reward" /></View><Text style={[typography.hero, { color: palette.onCivic, textAlign: isRTL ? 'right' : 'left' }]}>{tr('مزايا محلية تموّل الأثر', 'הטבות מקומיות שמממנות השפעה', 'Local benefits that fund impact')}</Text><Text style={[typography.body, { color: palette.onCivicMuted, textAlign: isRTL ? 'right' : 'left' }]}>{tr('تدعم العضوية تشغيل شبكة المساندة وتفتح عروضاً من الشركاء.', 'החברות תומכת בהפעלת רשת הסיוע ופותחת הטבות משותפים.', 'Membership supports the civic network and unlocks partner benefits.')}</Text><Text style={[typography.numeric, { color: theme.colors.reward }]}>₪19<Text style={[typography.small, { color: palette.onCivicMuted }]}> / {tr('شهرياً', 'לחודש', 'month')}</Text></Text></View>
    <SectionHeading title={tr('ما الذي تحصل عليه؟', 'מה מקבלים?', 'What you receive')} />
    <Card elevation="none"><View>{[[Tag, tr('عروض SANAD+ الحصرية', 'הטבות SANAD+ בלעדיות', 'Exclusive SANAD+ offers')], [Gift, tr('مكافآت أثر إضافية', 'תגמולי השפעה נוספים', 'Extra impact rewards')], [HandHeart, tr('دعم استمرارية شبكة المساندة', 'תמיכה ברציפות רשת הסיוע', 'Support the civic network')]].map(([Icon, label]) => <ListRow key={String(label)} title={String(label)} Icon={Icon as typeof Tag} tone="reward" trailing={<CheckCircle size={20} color={theme.colors.community} weight="fill" />} />)}</View></Card>
    {membership.data?.status === 'pending' ? <Surface tone="reward" bordered={false}><Text style={[typography.bodyMedium, { color: theme.colors.textPrimary }]}>{tr('طلبك قيد التجهيز. سنرسل إشعاراً عند توفر الدفع في منطقتك.', 'הבקשה בטיפול. נשלח התראה כשהתשלום יהיה זמין באזורכם.', 'Your request is queued. We will notify you when payment is available in your area.')}</Text></Surface> : null}
    {!active && membership.data?.status !== 'pending' ? <Button label={tr('طلب الانضمام إلى SANAD+', 'בקשת הצטרפות ל-SANAD+', 'Request SANAD+ membership')} variant="reward" size="lg" loading={request.isPending} onPress={() => request.mutate()} /> : null}
    <Text style={[typography.caption, styles.center, { color: theme.colors.textMuted }]}>{tr('لن تُفرض رسوم قبل تأكيد واضح وآمن.', 'לא ייגבה תשלום ללא אישור ברור ומאובטח.', 'No charge is made without clear, secure confirmation.')}</Text>
  </AppScreen>
}

export function RewardsScreen() {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const tr = useTrilingual()
  const toast = useToast()
  const { language } = useLanguageDirection()
  const { session } = useAuth()
  const queryClient = useQueryClient()
  const catalog = useQuery({ queryKey: queryKeys.rewards('jerusalem'), queryFn: () => rewardRepository.catalog() })
  const points = useQuery({ queryKey: session ? queryKeys.points(session.user.id) : ['points'], queryFn: () => rewardRepository.points(session!.user.id), enabled: !!session })
  const [selected, setSelected] = useState<string | null>(null)
  const redeem = useMutation({ mutationFn: (id: string) => rewardRepository.redeem(id), onSuccess: async () => { setSelected(null); if (session) { await queryClient.invalidateQueries({ queryKey: queryKeys.points(session.user.id) }); await queryClient.invalidateQueries({ queryKey: queryKeys.redemptions(session.user.id) }) }; toast.show(tr('تم استبدال المكافأة', 'התגמול מומש', 'Reward redeemed'), 'success') }, onError: cause => toast.show(localizeAppError(cause, tr), 'error') })
  const reward = catalog.data?.find(item => item.id === selected)
  return <AppScreen header={<ScreenHeader title={tr('مكافآت الأثر', 'תגמולי השפעה', 'Impact rewards')} subtitle={tr('العطاء يصنع قيمة محلية', 'עזרה יוצרת ערך מקומי', 'Helping creates local value')} back />} contentStyle={styles.content}>
    <Card tone="navy" bordered={false} title={tr('رصيدك', 'היתרה שלכם', 'Your balance')} subtitle={tr('نقاط أثر متاحة', 'נקודות השפעה זמינות', 'impact points available')} leading={<Trophy size={29} color={theme.colors.reward} />} trailing={<Text style={[typography.numeric, { color: palette.onCivic }]}>{points.data?.balance ?? 0}</Text>} />
    {catalog.isLoading ? <><Skeleton height={190} /><Skeleton height={190} /></> : null}
    {!catalog.isLoading && !catalog.data?.length ? <EmptyState title={tr('المكافآت قيد التجهيز', 'התגמולים בהכנה', 'Rewards are being prepared')} message={tr('ستظهر مكافآت شركاء القدس هنا بعد الإطلاق.', 'תגמולי שותפים בירושלים יופיעו כאן לאחר ההשקה.', 'Jerusalem partner rewards will appear here after launch.')} /> : null}
    <View style={styles.rewardGrid}>{(catalog.data ?? []).map(item => { const title = language === 'en' ? item.title_en : language === 'he' ? item.title_he : item.title_ar; const desc = language === 'en' ? item.description_en : language === 'he' ? item.description_he : item.description_ar; const affordable = (points.data?.balance ?? 0) >= item.points_cost; return <Pressable key={item.id} disabled={!affordable} onPress={() => setSelected(item.id)} style={[styles.rewardCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, opacity: affordable ? 1 : 0.55 }]}>{item.image_url ? <Image source={{ uri: item.image_url }} style={styles.rewardImage} /> : <View style={[styles.rewardImage, styles.logoPlaceholder, { backgroundColor: theme.colors.rewardSoft }]}><Gift size={38} color={theme.colors.rewardPressed} /></View>}<Text style={[typography.title, { color: theme.colors.textPrimary }]}>{title}</Text><Text numberOfLines={2} style={[typography.caption, { color: theme.colors.textSecondary }]}>{desc}</Text><StatusBadge label={tr(`${item.points_cost} نقطة`, `${item.points_cost} נקודות`, `${item.points_cost} pts`)} tone="reward" /></Pressable> })}</View>
    <BottomSheet visible={!!reward} onClose={() => setSelected(null)} title={reward ? (language === 'en' ? reward.title_en : language === 'he' ? reward.title_he : reward.title_ar) : ''} subtitle={tr('سيُخصم الرصيد فور التأكيد', 'הנקודות ינוכו מיד לאחר אישור', 'Points are deducted after confirmation')}><Button label={tr(`استبدال بـ ${reward?.points_cost ?? 0} نقطة`, `מימוש תמורת ${reward?.points_cost ?? 0} נקודות`, `Redeem for ${reward?.points_cost ?? 0} points`)} variant="reward" loading={redeem.isPending} onPress={() => reward && redeem.mutate(reward.id)} /></BottomSheet>
  </AppScreen>
}

export function PointsScreen() {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const tr = useTrilingual()
  const { session } = useAuth()
  const points = useQuery({ queryKey: session ? queryKeys.points(session.user.id) : ['points'], queryFn: () => rewardRepository.points(session!.user.id), enabled: !!session })
  const redemptions = useQuery({ queryKey: session ? queryKeys.redemptions(session.user.id) : ['redemptions'], queryFn: () => rewardRepository.redemptions(session!.user.id), enabled: !!session })
  return <AppScreen header={<ScreenHeader title={tr('سجل النقاط', 'היסטוריית נקודות', 'Points history')} subtitle={tr('كل نقطة مرتبطة بأثر موثق', 'כל נקודה קשורה להשפעה מתועדת', 'Every point is tied to recorded impact')} back />} contentStyle={styles.content}>
    <Card tone="navy" bordered={false} title={tr('الرصيد الحالي', 'יתרה נוכחית', 'Current balance')} trailing={<Text style={[typography.numeric, { color: palette.onCivic }]}>{points.data?.balance ?? 0}</Text>} />
    <SectionHeading title={tr('الحركة', 'תנועות', 'Transactions')} />
    {!points.data?.transactions.length && !redemptions.data?.length ? <EmptyState title={tr('لا توجد حركة بعد', 'אין עדיין תנועות', 'No activity yet')} message={tr('تُضاف النقاط بعد إكمال مهمة مؤكدة.', 'נקודות נוספות לאחר השלמת משימה מאושרת.', 'Points appear after a confirmed mission.') } /> : null}
    <Card elevation="none"><View>{(points.data?.transactions ?? []).map(item => <ListRow key={item.id} title={tr('مهمة مساندة مكتملة', 'משימת סיוע הושלמה', 'Support mission completed')} subtitle={new Date(item.created_at).toLocaleDateString()} Icon={HandHeart} tone="community" trailing={<Text style={[typography.title, { color: theme.colors.community }]}>+{item.points}</Text>} />)}{(redemptions.data ?? []).map(item => <ListRow key={item.id} title={tr('استبدال مكافأة', 'מימוש תגמול', 'Reward redemption')} subtitle={new Date(item.created_at).toLocaleDateString()} Icon={Gift} tone="reward" trailing={<Text style={[typography.title, { color: theme.colors.rewardPressed }]}>−{item.points_spent}</Text>} />)}</View></Card>
  </AppScreen>
}

const styles = StyleSheet.create({
  content: { gap: space.xl }, hero: { gap: space.md }, heroTop: { justifyContent: 'space-between', alignItems: 'center' }, heroIcon: { width: 62, height: 62, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  communityGrid: { flexWrap: 'wrap', gap: space.md }, hubCard: { width: '47.8%', minHeight: 150, borderRadius: radius.xl, borderWidth: StyleSheet.hairlineWidth, padding: space.lg, justifyContent: 'space-between' }, hubIcon: { width: 48, height: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  horizontalCards: { gap: space.md }, businessCompact: { minHeight: 80, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, padding: space.md, flexDirection: 'row', alignItems: 'center', gap: space.md }, businessLogo: { width: 54, height: 54, borderRadius: radius.md }, logoPlaceholder: { alignItems: 'center', justifyContent: 'center' }, row: { alignItems: 'center', gap: space.sm },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }, filterChip: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: space.md, paddingVertical: 7 }, businessList: { gap: space.md },
  businessHeroImage: { width: '100%', height: 270, borderRadius: radius.xl }, rating: { flexDirection: 'row', alignItems: 'center', gap: 4 }, quickButtons: { gap: space.sm, flexWrap: 'wrap' },
  offerRow: { minHeight: 116, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, padding: space.md, alignItems: 'center', gap: space.md }, offerImage: { width: 82, height: 86, borderRadius: radius.md }, offerCopy: { flex: 1, gap: 5 }, offerHeroImage: { width: '100%', height: 300, borderRadius: radius.xl }, codeCard: { alignItems: 'center', gap: space.md }, center: { textAlign: 'center' },
  plusHero: { borderRadius: radius.xl, padding: space.xl, gap: space.lg }, plusTop: { justifyContent: 'space-between', alignItems: 'center' },
  rewardGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md }, rewardCard: { width: '47.8%', borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.lg, padding: space.md, gap: space.sm }, rewardImage: { width: '100%', height: 116, borderRadius: radius.md }
})
