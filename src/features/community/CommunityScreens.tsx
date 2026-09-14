import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Animated, Easing, Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { CaretLeft, CaretRight, ClockCountdown, Crown, Fire, MapPin, Phone, Star, Tag, WhatsappLogo } from 'phosphor-react-native'
import * as Haptics from 'expo-haptics'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import { businessCategoryIcons } from '../../lib/businessCategories'
import { telHref, whatsappHref, directionsHref } from '../../lib/contactLinks'
import { useNavigationApp } from '../../lib/navigationPreference'
import { CURRENT_MARKET, CURRENT_MARKET_CODE } from '../../lib/market'
import { useMembership, resolveOfferUseAction } from '../../lib/membership'
import { computeOfferPriceDisplay, formatPrice, type OfferPriceDisplay } from '../../lib/offerPricing'
import { getVolunteerActivityLevel, ACTIVITY_LEVEL_LABEL_KEYS, ACTIVITY_LEVEL_THRESHOLDS } from '../../lib/activityLevel'
import { useStaggeredReveal } from '../../lib/useStaggeredReveal'
import { dirStyles, useIsRTL } from '../../lib/direction'
import { colors, radius, shadow, space, useSanadTheme } from '../../lib/theme'
import { useAppTypography } from '../../lib/typography'
import { useAuth } from '../../providers'
import { rewardRepository } from '../../repositories/rewardRepository'
import type { BusinessPhoto, BusinessRating, Partner, PartnerOffer, Review } from '../../types'
import { AppScreen, MapPanel, ScreenHeader, SectionHeading } from '../../components/v2'
import { BottomSheet, Button, Card } from '../../components/ui'
import { EmptyState } from '../../components/EmptyState'
import { MembershipSheet } from '../../components/MembershipSheet'
import { NavigationAppIcon } from '../../components/NavigationAppIcon'
import { OfferCard, PriceLine } from '../../components/OfferCard'
import { PlusBadge } from '../../components/PlusBadge'
import { RatingStars } from '../../components/RatingStars'
import { Skeleton } from '../../components/Skeleton'

const TOP_THRESHOLD = ACTIVITY_LEVEL_THRESHOLDS.green
const TIER_MARKS = [ACTIVITY_LEVEL_THRESHOLDS.bronze, ACTIVITY_LEVEL_THRESHOLDS.silver, ACTIVITY_LEVEL_THRESHOLDS.gold, ACTIVITY_LEVEL_THRESHOLDS.green]
const TIER_KEYS = ['bronze', 'silver', 'gold', 'green'] as const

// Real per-language banner assets (from the user's own reference images,
// see assets/images/perks-*.png) - not recreated from scratch, and not
// mirrored by RTL/LTR since each is already laid out for its language.
function headerImageFor(language: string) {
  if (language === 'en') return require('../../../assets/images/perks-header-en.png')
  if (language === 'he') return require('../../../assets/images/perks-header-he.png')
  return require('../../../assets/images/perks-header-ar.png')
}
function proMaxImageFor(language: string) {
  if (language === 'en') return require('../../../assets/images/perks-promax-en.png')
  if (language === 'he') return require('../../../assets/images/perks-promax-he.png')
  return require('../../../assets/images/perks-promax-ar.png')
}

const BANNER_ASPECT_RATIO = 724 / 2172

// react-native-web doesn't reliably size an Image from a plain `aspectRatio`
// style (confirmed live - it kept the source PNG's raw 724px height at any
// width instead of scaling it down), so the height is computed explicitly
// from the wrapper's real measured width instead of trusted to CSS.
function BannerImage({ source, label }: { source: ReturnType<typeof headerImageFor>; label: string }) {
  const [width, setWidth] = useState(0)
  return (
    <View onLayout={event => setWidth(event.nativeEvent.layout.width)}>
      {width > 0 ? <Image source={source} style={{ width, height: width * BANNER_ASPECT_RATIO }} resizeMode="contain" accessibilityLabel={label} /> : null}
    </View>
  )
}

type WeeklyOffersData = { offers: PartnerOffer[]; partnersById: Record<string, Partner> }

// public_offers is already server-filtered to approved/valid/active-partner
// rows (see 0015_businesses_offers_reviews.sql's view definition) - an
// expired offer simply stops appearing here on its own, no client-side
// "hide expired" logic needed. Partners are fetched separately (not via a
// PostgREST embed on the view) for the exact same reason loadBusinessDetail
// below does it that way.
async function loadWeeklyOffers(): Promise<WeeklyOffersData> {
  const { data: offers, error } = await supabase.from('public_offers').select('*').order('created_at', { ascending: false })
  if (error) throw error
  const rows = (offers ?? []) as PartnerOffer[]
  const partnerIds = [...new Set(rows.map(o => o.partner_id))]
  const { data: partners } = partnerIds.length ? await supabase.from('partners').select('*').in('id', partnerIds) : { data: [] as Partner[] }
  return { offers: rows, partnersById: Object.fromEntries((partners ?? []).map(p => [(p as Partner).id, p as Partner])) }
}

function computeSavings(price: OfferPriceDisplay): number | null {
  if (price.kind === 'free_benefit') return null
  if (price.originalPrice == null || price.offerPrice == null) return null
  const diff = price.originalPrice - price.offerPrice
  return diff > 0 ? diff : null
}

// Real, ticking countdown to the soonest valid_until among the offers
// actually on screen - never a fixed "5 days left". Returns null (hiding
// the pill entirely) when none of them carry a real expiry.
function useRealOffersCountdown(validUntilList: (string | null)[]) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(interval)
  }, [])
  const upcoming = validUntilList.filter((iso): iso is string => !!iso).map(iso => new Date(iso).getTime()).filter(ts => ts > now)
  if (upcoming.length === 0) return null
  const diff = Math.min(...upcoming) - now
  return { days: Math.floor(diff / 86_400_000), hours: Math.floor((diff % 86_400_000) / 3_600_000) }
}

// Shared driver for every subtle "premium, not game UI" loop in this screen
// (level badge glow, points bob, countdown clock pulse) - one Animated.Value
// per caller, same easing/rhythm everywhere rather than four bespoke ones.
function usePulseValue(duration = 1400) {
  const value = useRef(new Animated.Value(0)).current
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(value, { toValue: 1, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(value, { toValue: 0, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
    ]))
    loop.start()
    return () => loop.stop()
  }, [value, duration])
  return value
}

function LevelBadge() {
  const pulse = usePulseValue(1600)
  const glowOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.5] })
  const glowScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] })
  return (
    <View style={styles.levelBadgeWrap}>
      <Animated.View style={[styles.levelBadgeGlow, { opacity: glowOpacity, transform: [{ scale: glowScale }] }]} />
      <View style={[styles.levelBadgeCore, shadow.soft]}>
        <View style={styles.levelBadgeHighlight} />
        <Star size={26} color="#8A5A16" weight="fill" />
      </View>
      <View style={[styles.sparkle, styles.sparkleA]} />
      <View style={[styles.sparkle, styles.sparkleB]} />
    </View>
  )
}

function PointsBadge() {
  const theme = useSanadTheme()
  const bob = usePulseValue(1200)
  const translateY = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -3] })
  return (
    <Animated.View style={{ transform: [{ translateY }] }}>
      <View style={[styles.pointsBadge, { backgroundColor: theme.colors.communitySoft }]}>
        <Star size={16} color={theme.colors.community} weight="fill" />
      </View>
    </Animated.View>
  )
}

function PulsingIcon({ children }: { children: ReactNode }) {
  const pulse = usePulseValue(900)
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] })
  return <Animated.View style={{ transform: [{ scale }] }}>{children}</Animated.View>
}

// Real SANAD Perks - business/offer discovery (search, categories, nearby
// businesses grid) moved out per redesign request; BusinessDetailScreen and
// OfferDetailScreen below are untouched and still work for any offer/business
// reached some other way. Everything on screen now is real: the points/level
// card reuses the same mechanic as ActivityScreen and VolunteerPointsCard
// (completed-count thresholds, rewardRepository's summed balance), and the
// weekly offers list reads public_offers directly - no static/mock content,
// no points-cost field (none exists on partner_offers yet, so none is shown).
export function CommunityHubScreen() {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const { t, i18n } = useTranslation()
  const router = useRouter()
  const { profile } = useAuth()
  const { stageStyle } = useStaggeredReveal(4)

  const pointsQuery = useQuery({
    queryKey: profile ? ['community', 'points', profile.id] : ['community', 'points'],
    queryFn: () => rewardRepository.points(profile!.id),
    enabled: !!profile
  })
  const completedCountQuery = useQuery({
    queryKey: profile ? ['community', 'completed-count', profile.id] : ['community', 'completed-count'],
    queryFn: async () => {
      const { data } = await supabase.rpc('get_volunteer_completed_count', { p_volunteer_id: profile!.id })
      return (data as number | null) ?? 0
    },
    enabled: !!profile
  })
  const offersQuery = useQuery({ queryKey: ['community', 'weekly-offers'], queryFn: loadWeeklyOffers })

  const balance = pointsQuery.data?.balance ?? 0
  const completedCount = completedCountQuery.data ?? 0
  const level = getVolunteerActivityLevel(completedCount)
  const nextThresholdIndex = TIER_MARKS.findIndex(mark => mark > completedCount)
  const nextThreshold = nextThresholdIndex === -1 ? null : (TIER_MARKS[nextThresholdIndex] ?? null)
  const nextLevelKey = nextThresholdIndex === -1 ? null : (TIER_KEYS[nextThresholdIndex] ?? null)
  const progressFraction = Math.min(completedCount, TOP_THRESHOLD) / TOP_THRESHOLD
  const levelLabelKey = level === 'none' ? 'activityLevel.none' : ACTIVITY_LEVEL_LABEL_KEYS[level]

  const offers = offersQuery.data?.offers ?? []
  const partnersById = offersQuery.data?.partnersById ?? {}
  const countdown = useRealOffersCountdown(offers.map(o => o.valid_until))

  function openOffer(id: string) {
    Haptics.selectionAsync().catch(() => {})
    router.push({ pathname: '/community/offer/[offerId]', params: { offerId: id } })
  }

  return (
    <AppScreen contentStyle={styles.content}>
      <BannerImage source={headerImageFor(i18n.language)} label={t('perks.title')} />

      <Animated.View style={[styles.pointsCard, stageStyle(0), { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <View style={[styles.pointsTopRow, dirStyles(isRTL).row]}>
          <View style={[styles.levelGroup, dirStyles(isRTL).row]}>
            <LevelBadge />
            <View>
              <Text style={[typography.caption, { color: theme.colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{t('perks.pointsCard.levelLabel')}</Text>
              <Text style={[typography.h3, { color: theme.colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{t(levelLabelKey)}</Text>
            </View>
          </View>
          <View style={{ alignItems: isRTL ? 'flex-start' : 'flex-end' }}>
            <View style={[styles.balanceRow, dirStyles(isRTL).row]}>
              <Text style={[typography.h1, { color: theme.colors.textPrimary }]}>{balance}</Text>
              <PointsBadge />
            </View>
            <Text style={[typography.caption, { color: theme.colors.textSecondary }]}>{t('perks.pointsCard.balanceLabel')}</Text>
          </View>
        </View>
        <View style={[styles.progressTrack, { backgroundColor: theme.colors.surfaceMuted }]}>
          <View style={[styles.progressFill, { width: `${progressFraction * 100}%`, backgroundColor: theme.colors.community, [isRTL ? 'right' : 'left']: 0 }]} />
        </View>
        <Text style={[typography.caption, { color: theme.colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>
          {nextThreshold !== null && nextLevelKey ? t('perks.pointsCard.remainingToLevel', { remaining: nextThreshold - completedCount, levelName: t(ACTIVITY_LEVEL_LABEL_KEYS[nextLevelKey]) }) : t('points.topTier')}
        </Text>
      </Animated.View>

      <Animated.View style={[styles.weeklyHeaderCard, stageStyle(1), { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <View style={[styles.weeklyHeaderRow, dirStyles(isRTL).row]}>
          <Fire size={18} color={theme.colors.emergency} weight="fill" />
          <Text style={[typography.h3, { color: theme.colors.textPrimary }]}>{t('perks.weeklyOffers.title')}</Text>
        </View>
        <View style={[styles.weeklyMetaRow, dirStyles(isRTL).row]}>
          <Text style={[typography.caption, { color: theme.colors.textSecondary }]}>{t('perks.weeklyOffers.subtitle', { count: offers.length })}</Text>
          {countdown ? (
            <View style={[styles.countdownPill, dirStyles(isRTL).row, { backgroundColor: theme.colors.emergencySoft }]}>
              <PulsingIcon><ClockCountdown size={13} color={theme.colors.emergency} weight="fill" /></PulsingIcon>
              <Text style={[typography.caption, { color: theme.colors.emergency }]}>{t('perks.weeklyOffers.countdown', { days: countdown.days, hours: countdown.hours })}</Text>
            </View>
          ) : null}
        </View>
      </Animated.View>

      <Animated.View style={[styles.offersList, stageStyle(2)]}>
        {offersQuery.isLoading ? (
          <>
            <Skeleton width="100%" height={140} />
            <Skeleton width="100%" height={140} />
          </>
        ) : offers.length === 0 ? (
          <EmptyState Icon={Tag} title={t('perks.empty.offersTitle')} message={t('perks.empty.offersMessage')} />
        ) : (
          offers.map(offer => <RealOfferCard key={offer.id} offer={offer} business={partnersById[offer.partner_id]} onUse={() => openOffer(offer.id)} />)
        )}
      </Animated.View>

      <Animated.View style={stageStyle(3)}>
        <BannerImage source={proMaxImageFor(i18n.language)} label={t('perks.proMax.title')} />
      </Animated.View>
    </AppScreen>
  )
}

function RealOfferCard({ offer, business, onUse }: { offer: PartnerOffer; business?: Partner; onUse: () => void }) {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const { t } = useTranslation()
  const price = computeOfferPriceDisplay(offer)
  const savings = computeSavings(price)
  const CategoryIcon = business ? businessCategoryIcons[business.category] : Tag
  const Chevron = isRTL ? CaretLeft : CaretRight

  return (
    <View style={[styles.realOfferCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      <Pressable onPress={onUse} style={[styles.realOfferTopRow, dirStyles(isRTL).row]}>
        <View style={[styles.realOfferImageWrap, { backgroundColor: theme.colors.communitySoft }]}>
          {offer.image_url ? (
            <Image source={{ uri: offer.image_url }} style={styles.realOfferImage} resizeMode="cover" />
          ) : (
            <CategoryIcon size={30} color={theme.colors.community} weight="duotone" />
          )}
          <View style={[styles.exclusiveBadge, dirStyles(isRTL).row, { backgroundColor: colors.ink }]}>
            <Crown size={10} color={colors.sand} weight="fill" />
            <Text style={[typography.caption, styles.exclusiveBadgeText]}>{t('perks.weeklyOffers.exclusive')}</Text>
          </View>
        </View>
        <View style={styles.realOfferBody}>
          <Text numberOfLines={2} style={[typography.smallMedium, { color: theme.colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{offer.title}</Text>
          {business ? <Text numberOfLines={1} style={[typography.caption, { color: theme.colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>{t(`perks.categories.${business.category}`)}</Text> : null}
          <PriceLine price={price} />
          {savings != null ? <Text style={[typography.caption, { color: theme.colors.community, textAlign: isRTL ? 'right' : 'left' }]}>{t('perks.weeklyOffers.savings', { amount: formatPrice(savings, CURRENT_MARKET.currencySymbol) })}</Text> : null}
        </View>
        <Chevron size={16} color={theme.colors.textMuted} />
      </Pressable>
      <Pressable onPress={onUse} style={[styles.useButtonFull, { backgroundColor: theme.colors.community }]}>
        <Text style={[typography.smallMedium, { color: theme.colors.onCommunity }]}>{t('perks.weeklyOffers.useOffer')}</Text>
      </Pressable>
    </View>
  )
}

async function loadBusinessDetail(businessId: string) {
  const { data: business } = await supabase.from('partners').select('*').eq('id', businessId).eq('status', 'verified').eq('is_active', true).eq('market', CURRENT_MARKET_CODE).maybeSingle()
  if (!business) return null
  const [{ data: photos }, { data: rating }, { data: offers }, { data: reviews }] = await Promise.all([
    supabase.from('business_photos').select('*').eq('business_id', businessId).order('sort_order'),
    supabase.from('business_ratings').select('*').eq('business_id', businessId).maybeSingle(),
    supabase.from('public_offers').select('*').eq('partner_id', businessId).order('created_at', { ascending: false }),
    supabase.from('reviews').select('*').eq('business_id', businessId).eq('is_hidden', false).order('created_at', { ascending: false }).limit(20)
  ])
  return { business: business as Partner, photos: (photos ?? []) as BusinessPhoto[], rating: (rating ?? null) as BusinessRating | null, offers: (offers ?? []) as PartnerOffer[], reviews: (reviews ?? []) as Review[] }
}

export function BusinessDetailScreen() {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const { t } = useTranslation()
  const router = useRouter()
  const { businessId } = useLocalSearchParams<{ businessId: string }>()
  const query = useQuery({ queryKey: ['community', 'business', businessId], queryFn: () => loadBusinessDetail(String(businessId)), enabled: !!businessId })
  const navigationApp = useNavigationApp()

  if (query.isLoading) return <AppScreen header={<ScreenHeader title={t('perks.business.title')} back />}><Skeleton width="100%" height={220} /><Skeleton width="100%" height={140} /></AppScreen>
  if (!query.data) return <AppScreen header={<ScreenHeader title={t('perks.business.title')} back />} contentStyle={styles.content}><EmptyState Icon={MapPin} title={t('perks.business.notFound')} /></AppScreen>

  const { business, photos, rating, offers, reviews } = query.data
  const Icon = businessCategoryIcons[business.category]
  const gallery = photos.length > 0 ? photos.map(p => p.url) : business.logo_url ? [business.logo_url] : []

  return (
    <AppScreen header={<ScreenHeader title={business.name} subtitle={t('perks.business.verified')} back />} contentStyle={styles.content}>
      {gallery.length > 0 ? (
        <View style={styles.gallery}>{gallery.map((url, index) => <Image key={`${url}-${index}`} source={{ uri: url }} style={styles.galleryImage} resizeMode="cover" />)}</View>
      ) : (
        <View style={[styles.gallery, styles.galleryFallback, { backgroundColor: theme.colors.primarySoft }]}><Icon size={40} color={theme.colors.primary} weight="duotone" /></View>
      )}

      <Card>
        <View style={[styles.row, dirStyles(isRTL).row]}>
          <Text style={[typography.caption, { color: theme.colors.textSecondary }]}>{t(`perks.categories.${business.category}`)}</Text>
          <RatingStars rating={rating?.average_rating ?? null} count={rating?.review_count ?? 0} />
        </View>
        {business.description ? <Text style={[typography.body, { color: theme.colors.textPrimary, textAlign: isRTL ? 'right' : 'left', marginTop: space.sm }]}>{business.description}</Text> : null}
        <View style={[styles.quickButtons, dirStyles(isRTL).row]}>
          {business.phone ? <Button fullWidth={false} label={t('perks.business.call')} variant="outline" leading={<Phone size={18} color={theme.colors.primary} />} onPress={() => Linking.openURL(telHref(business.phone!))} /> : null}
          {business.whatsapp ? <Button fullWidth={false} label="WhatsApp" variant="outline" leading={<WhatsappLogo size={18} color={theme.colors.community} />} onPress={() => Linking.openURL(whatsappHref(business.whatsapp!))} /> : null}
          {business.latitude != null && business.longitude != null ? <Button fullWidth={false} label={t('perks.business.directions')} variant="outline" leading={<NavigationAppIcon app={navigationApp} size={18} />} onPress={() => Linking.openURL(directionsHref(business.latitude!, business.longitude!, navigationApp))} /> : null}
        </View>
      </Card>

      {business.latitude != null && business.longitude != null ? <MapPanel latitude={business.latitude} longitude={business.longitude} height={220} interactive={false} /> : null}

      {business.opening_hours && Object.keys(business.opening_hours).length > 0 ? (
        <Card title={t('perks.business.hoursTitle')} elevation="none">
          <View>{(['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const).filter(day => business.opening_hours?.[day]).map(day => (
            <View key={day} style={[styles.hoursRow, dirStyles(isRTL).row]}>
              <Text style={[typography.small, { color: theme.colors.textSecondary }]}>{t(`perks.business.days.${day}`)}</Text>
              <Text style={[typography.smallMedium, { color: theme.colors.textPrimary }]}>{business.opening_hours![day]}</Text>
            </View>
          ))}</View>
        </Card>
      ) : null}

      {business.service_area ? <Card title={t('perks.business.serviceAreaTitle')} elevation="none"><Text style={[typography.small, { color: theme.colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{business.service_area}</Text></Card> : null}

      <SectionHeading title={t('perks.business.offersTitle')} />
      {offers.length === 0 ? <EmptyState Icon={Tag} title={t('perks.business.noOffers')} /> : (
        <View style={styles.list}>{offers.map(offer => <OfferCard key={offer.id} offer={offer} business={business} rating={rating ?? undefined} variant="list" onPress={() => router.push({ pathname: '/community/offer/[offerId]', params: { offerId: offer.id } })} />)}</View>
      )}

      <SectionHeading title={t('perks.business.reviewsTitle')} />
      {reviews.length === 0 ? <EmptyState Icon={Star} title={t('perks.business.noReviews')} /> : (
        <View style={styles.list}>{reviews.map(review => (
          <Card key={review.id} elevation="none">
            <View style={[styles.row, dirStyles(isRTL).row]}>
              <RatingStars rating={review.rating} count={1} size={12.5} />
              <Text style={[typography.caption, { color: theme.colors.textMuted }]}>{new Date(review.created_at).toLocaleDateString()}</Text>
            </View>
            {review.comment ? <Text style={[typography.small, { color: theme.colors.textSecondary, marginTop: 4 }]}>{review.comment}</Text> : null}
          </Card>
        ))}</View>
      )}
    </AppScreen>
  )
}

async function loadOfferDetail(offerId: string) {
  const { data: offer } = await supabase.from('public_offers').select('*').eq('id', offerId).maybeSingle()
  if (!offer) return null
  const [{ data: business }, { data: rating }] = await Promise.all([
    supabase.from('partners').select('*').eq('id', offer.partner_id).eq('market', CURRENT_MARKET_CODE).maybeSingle(),
    supabase.from('business_ratings').select('*').eq('business_id', offer.partner_id).maybeSingle()
  ])
  if (!business) return null
  return { offer: offer as PartnerOffer, business: business as Partner, rating: (rating ?? null) as BusinessRating | null }
}

export function OfferDetailScreen() {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const { t } = useTranslation()
  const router = useRouter()
  const { offerId } = useLocalSearchParams<{ offerId: string }>()
  const { session } = useAuth()
  const { isPlusMember } = useMembership(session!.user.id)
  const query = useQuery({ queryKey: ['community', 'offer', offerId], queryFn: () => loadOfferDetail(String(offerId)), enabled: !!offerId })
  const navigationApp = useNavigationApp()
  const [membershipOpen, setMembershipOpen] = useState(false)
  const [contactOpen, setContactOpen] = useState(false)

  function handleUse() {
    if (!query.data) return
    if (resolveOfferUseAction(query.data.offer, isPlusMember) === 'membership-required') { setMembershipOpen(true); return }
    setContactOpen(true)
  }

  if (query.isLoading) return <AppScreen header={<ScreenHeader title={t('perks.offer.title')} back />}><Skeleton width="100%" height={220} /><Skeleton width="100%" height={140} /></AppScreen>
  if (!query.data) return <AppScreen header={<ScreenHeader title={t('perks.offer.title')} back />} contentStyle={styles.content}><EmptyState Icon={Tag} title={t('perks.offer.notFound')} /></AppScreen>

  const { offer, business, rating } = query.data
  const price = computeOfferPriceDisplay(offer)
  const imageUri = offer.image_url ?? business.logo_url ?? null

  return (
    <AppScreen header={<ScreenHeader title={offer.title} back />} footer={<Button label={t('perks.offer.use')} variant={offer.member_only ? 'reward' : 'primary'} onPress={handleUse} />} contentStyle={styles.content}>
      {imageUri ? <Image source={{ uri: imageUri }} style={styles.offerHero} resizeMode="cover" /> : <View style={[styles.offerHero, styles.galleryFallback, { backgroundColor: theme.colors.rewardSoft }]} />}
      {offer.member_only ? <PlusBadge size="md" /> : null}
      <Text style={[typography.h1, { color: theme.colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{offer.title}</Text>

      <Pressable onPress={() => router.push({ pathname: '/community/business/[businessId]', params: { businessId: business.id } })} style={[styles.businessRow, { ...dirStyles(isRTL).row, borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
        {business.logo_url ? <Image source={{ uri: business.logo_url }} style={styles.businessLogo} /> : <View style={[styles.businessLogo, { backgroundColor: theme.colors.primarySoft }]} />}
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[typography.bodyMedium, { color: theme.colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{business.name}</Text>
          <RatingStars rating={rating?.average_rating ?? null} count={rating?.review_count ?? 0} size={12} />
        </View>
      </Pressable>

      <OfferPriceBlock price={price} />

      {offer.description ? <Text style={[typography.body, { color: theme.colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{offer.description}</Text> : null}
      {offer.terms ? <Card title={t('perks.offer.termsTitle')} elevation="none"><Text style={[typography.small, { color: theme.colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{offer.terms}</Text></Card> : null}
      <Text style={[typography.caption, { color: theme.colors.textMuted }]}>{offer.valid_until ? t('perks.offer.validUntil', { date: new Date(offer.valid_until).toLocaleDateString() }) : t('perks.offer.validNoLimit')}</Text>

      <MembershipSheet visible={membershipOpen} onClose={() => setMembershipOpen(false)} offerLocked />

      <BottomSheet visible={contactOpen} onClose={() => setContactOpen(false)} title={t('perks.offer.contactTitle')} subtitle={t('perks.offer.contactMessage')}>
        {business.phone ? <Button label={t('perks.business.call')} variant="outline" leading={<Phone size={18} color={theme.colors.primary} />} onPress={() => Linking.openURL(telHref(business.phone!))} /> : null}
        {business.whatsapp ? <Button label="WhatsApp" variant="outline" leading={<WhatsappLogo size={18} color={theme.colors.community} />} onPress={() => Linking.openURL(whatsappHref(business.whatsapp!))} /> : null}
        {business.latitude != null && business.longitude != null ? <Button label={t('perks.business.directions')} variant="outline" leading={<NavigationAppIcon app={navigationApp} size={18} />} onPress={() => Linking.openURL(directionsHref(business.latitude!, business.longitude!, navigationApp))} /> : null}
      </BottomSheet>
    </AppScreen>
  )
}

function OfferPriceBlock({ price }: { price: ReturnType<typeof computeOfferPriceDisplay> }) {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const { t } = useTranslation()
  const symbol = CURRENT_MARKET.currencySymbol

  if (price.kind === 'free_benefit') return <Text style={[typography.h2, { color: theme.colors.primary }]}>{t('perks.offer.free')}</Text>

  return (
    <View style={[styles.priceRow, dirStyles(isRTL).row]}>
      {price.originalPrice != null && price.offerPrice != null ? (
        <>
          <Text style={[typography.small, { color: theme.colors.textMuted, textDecorationLine: 'line-through' }]}>{formatPrice(price.originalPrice, symbol)}</Text>
          <Text style={[typography.h2, { color: theme.colors.primary }]}>{formatPrice(price.offerPrice, symbol)}</Text>
        </>
      ) : null}
      {price.kind === 'percentage' ? <Text style={[typography.smallMedium, { color: theme.colors.rewardPressed, backgroundColor: theme.colors.rewardSoft, borderRadius: 999, paddingHorizontal: space.md, paddingVertical: 4 }]}>-{price.percent}%</Text> : null}
      {price.kind === 'fixed' && (price.originalPrice == null || price.offerPrice == null) ? <Text style={[typography.smallMedium, { color: theme.colors.rewardPressed, backgroundColor: theme.colors.rewardSoft, borderRadius: 999, paddingHorizontal: space.md, paddingVertical: 4 }]}>-{formatPrice(price.amountOff, symbol)}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  content: { gap: space.xl },
  list: { gap: space.md },
  row: { alignItems: 'center', gap: space.sm, justifyContent: 'space-between' },
  quickButtons: { gap: space.sm, flexWrap: 'wrap', marginTop: space.md },
  gallery: { flexDirection: 'row', width: '100%', height: 200, borderRadius: 20, overflow: 'hidden' },
  galleryImage: { width: '100%', height: '100%' },
  galleryFallback: { alignItems: 'center', justifyContent: 'center' },
  hoursRow: { justifyContent: 'space-between', paddingVertical: 4 },
  offerHero: { width: '100%', height: 220, borderRadius: 20 },
  businessRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, borderWidth: 1, borderRadius: 16, padding: space.md },
  businessLogo: { width: 40, height: 40, borderRadius: 10 },
  priceRow: { alignItems: 'center', gap: space.sm },


  pointsCard: { borderWidth: 1, borderRadius: radius.lg, padding: space.lg, gap: space.sm },
  pointsTopRow: { alignItems: 'center', justifyContent: 'space-between' },
  levelGroup: { alignItems: 'center', gap: space.sm },
  balanceRow: { alignItems: 'center', gap: 6 },
  progressTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { position: 'absolute', top: 0, bottom: 0, borderRadius: 4 },

  levelBadgeWrap: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center' },
  levelBadgeGlow: { position: 'absolute', width: 64, height: 64, borderRadius: 32, backgroundColor: '#F6C453' },
  levelBadgeCore: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#FBD877', alignItems: 'center', justifyContent: 'center' },
  levelBadgeHighlight: { position: 'absolute', width: 22, height: 22, borderRadius: 11, top: 5, left: 8, backgroundColor: 'rgba(255,255,255,0.45)' },
  sparkle: { position: 'absolute', width: 10, height: 2, borderRadius: 1, backgroundColor: '#5FE0C0' },
  sparkleA: { top: 2, left: -4, transform: [{ rotate: '-35deg' }] },
  sparkleB: { top: 16, left: -10, transform: [{ rotate: '-35deg' }] },
  pointsBadge: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },

  weeklyHeaderCard: { borderWidth: 1, borderRadius: radius.lg, padding: space.lg, gap: space.sm },
  weeklyHeaderRow: { alignItems: 'center', gap: space.sm },
  weeklyMetaRow: { alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: space.sm },
  countdownPill: { alignItems: 'center', gap: 4, borderRadius: radius.pill, paddingVertical: 4, paddingHorizontal: space.sm },

  offersList: { gap: space.md },
  realOfferCard: { borderWidth: 1, borderRadius: radius.lg, overflow: 'hidden' },
  realOfferTopRow: { alignItems: 'center', gap: space.md, padding: space.md },
  realOfferImageWrap: { width: 76, height: 76, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  realOfferImage: { width: '100%', height: '100%' },
  exclusiveBadge: { position: 'absolute', top: 6, alignItems: 'center', gap: 3, borderRadius: radius.pill, paddingVertical: 3, paddingHorizontal: 6 },
  exclusiveBadgeText: { color: '#fff', fontSize: 9 },
  realOfferBody: { flex: 1, gap: 3 },
  useButtonFull: { alignItems: 'center', justifyContent: 'center', paddingVertical: 12 }
})
