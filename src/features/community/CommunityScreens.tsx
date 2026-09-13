import { useEffect, useState } from 'react'
import { Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { ClockCountdown, Coins, Crown, DeviceMobile, Fire, Gift, MapPin, Phone, PlugsConnected, Star, Tag, WhatsappLogo, Wind } from 'phosphor-react-native'
import type { Icon as PhosphorIcon } from 'phosphor-react-native'
import * as Haptics from 'expo-haptics'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import { businessCategoryIcons } from '../../lib/businessCategories'
import { telHref, whatsappHref, directionsHref } from '../../lib/contactLinks'
import { useNavigationApp } from '../../lib/navigationPreference'
import { CURRENT_MARKET, CURRENT_MARKET_CODE } from '../../lib/market'
import { useMembership, resolveOfferUseAction } from '../../lib/membership'
import { computeOfferPriceDisplay, formatPrice } from '../../lib/offerPricing'
import { getVolunteerActivityLevel, ACTIVITY_LEVEL_LABEL_KEYS, ACTIVITY_LEVEL_THRESHOLDS } from '../../lib/activityLevel'
import { dirStyles, useIsRTL } from '../../lib/direction'
import { colors, radius, space, useSanadTheme } from '../../lib/theme'
import { useAppTypography } from '../../lib/typography'
import { useAuth } from '../../providers'
import { rewardRepository } from '../../repositories/rewardRepository'
import type { BusinessPhoto, BusinessRating, Partner, PartnerOffer, Review } from '../../types'
import { AppScreen, MapPanel, ScreenHeader, SectionHeading } from '../../components/v2'
import { BottomSheet, Button, Card, useToast } from '../../components/ui'
import { EmptyState } from '../../components/EmptyState'
import { MembershipSheet } from '../../components/MembershipSheet'
import { NavigationAppIcon } from '../../components/NavigationAppIcon'
import { OfferCard } from '../../components/OfferCard'
import { PlusBadge } from '../../components/PlusBadge'
import { RatingStars } from '../../components/RatingStars'
import { Skeleton } from '../../components/Skeleton'

const TOP_THRESHOLD = ACTIVITY_LEVEL_THRESHOLDS.green
const TIER_MARKS = [ACTIVITY_LEVEL_THRESHOLDS.bronze, ACTIVITY_LEVEL_THRESHOLDS.silver, ACTIVITY_LEVEL_THRESHOLDS.gold, ACTIVITY_LEVEL_THRESHOLDS.green]

// Static preview content for the "this week's offers" section - there is no
// points-redemption backend yet (no points-cost column, no redemption RPC,
// no featured-offer flag on public_offers - confirmed absent, not just
// unwired). The user asked to see the real product-page design before
// deciding whether to build that backend, so these 3 cards are intentionally
// fixed placeholder data, not read from partners/public_offers. "Use offer"
// below only shows a toast, on purpose, until that decision is made.
type WeeklyOffer = {
  id: string
  nameKey: string
  categoryKey: string
  Icon: PhosphorIcon
  tone: 'primary' | 'community' | 'reward'
  originalPrice: number
  offerPrice: number
  pointsCost: number
}

const WEEKLY_OFFERS: WeeklyOffer[] = [
  { id: 'phone-mount', nameKey: 'perks.weeklyOffers.items.phoneMount.name', categoryKey: 'perks.weeklyOffers.items.phoneMount.category', Icon: DeviceMobile, tone: 'primary', originalPrice: 120, offerPrice: 70, pointsCost: 100 },
  { id: 'jump-cables', nameKey: 'perks.weeklyOffers.items.jumpCables.name', categoryKey: 'perks.weeklyOffers.items.jumpCables.category', Icon: PlugsConnected, tone: 'community', originalPrice: 120, offerPrice: 70, pointsCost: 70 },
  { id: 'tire-inflator', nameKey: 'perks.weeklyOffers.items.tireInflator.name', categoryKey: 'perks.weeklyOffers.items.tireInflator.category', Icon: Wind, tone: 'reward', originalPrice: 200, offerPrice: 120, pointsCost: 120 }
]

// Ticks toward the coming Sunday at local midnight - a real, moving
// countdown (not a hardcoded "4 days left") even though the offers behind
// it are still static.
function useNextSundayCountdown() {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(interval)
  }, [])
  const target = new Date(now)
  const daysUntilSunday = (7 - target.getDay()) % 7 || 7
  target.setDate(target.getDate() + daysUntilSunday)
  target.setHours(0, 0, 0, 0)
  const diff = Math.max(0, target.getTime() - now)
  return { days: Math.floor(diff / 86_400_000), hours: Math.floor((diff % 86_400_000) / 3_600_000) }
}

// Real SANAD Perks - business/offer discovery (search, categories, nearby
// businesses grid) moved out per redesign request; BusinessDetailScreen and
// OfferDetailScreen below are untouched and still work for any offer/business
// reached some other way. The points/level card reuses the same real
// mechanic as ActivityScreen and VolunteerPointsCard (completed-count
// thresholds, rewardRepository's summed balance) - not a new one.
export function CommunityHubScreen() {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const { t } = useTranslation()
  const { profile } = useAuth()
  const toast = useToast()
  const countdown = useNextSundayCountdown()

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

  const balance = pointsQuery.data?.balance ?? 0
  const completedCount = completedCountQuery.data ?? 0
  const level = getVolunteerActivityLevel(completedCount)
  const nextThreshold = TIER_MARKS.find(mark => mark > completedCount) ?? null
  const progressFraction = Math.min(completedCount, TOP_THRESHOLD) / TOP_THRESHOLD
  const levelLabelKey = level === 'none' ? 'activityLevel.none' : ACTIVITY_LEVEL_LABEL_KEYS[level]

  function useOffer() {
    Haptics.selectionAsync().catch(() => {})
    toast.show(t('perks.weeklyOffers.comingSoon'), 'info')
  }

  return (
    <AppScreen
      header={
        <ScreenHeader
          title={t('perks.title')}
          subtitle={t('perks.subtitle')}
          trailing={
            <View style={[styles.headerGiftWrap, { backgroundColor: theme.colors.communitySoft }]}>
              <Gift size={20} color={theme.colors.community} weight="fill" />
            </View>
          }
        />
      }
      contentStyle={styles.content}
    >
      <View style={[styles.pointsCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <View style={[styles.pointsTopRow, dirStyles(isRTL).row]}>
          <View style={[styles.pointsColumn, dirStyles(isRTL).row]}>
            <View style={[styles.pointsIconWrap, { backgroundColor: theme.colors.communitySoft, borderColor: theme.colors.community }]}>
              <Star size={20} color={theme.colors.community} weight="fill" />
            </View>
            <View>
              <Text style={[typography.h2, { color: theme.colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{balance}</Text>
              <Text style={[typography.caption, { color: theme.colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{t('perks.pointsCard.balanceLabel')}</Text>
            </View>
          </View>
          <View style={[styles.levelColumn, dirStyles(isRTL).row]}>
            <View style={{ alignItems: isRTL ? 'flex-start' : 'flex-end' }}>
              <Text style={[typography.caption, { color: theme.colors.textSecondary, textAlign: isRTL ? 'left' : 'right' }]}>{t('perks.pointsCard.levelLabel')}</Text>
              <Text style={[typography.bodyMedium, { color: theme.colors.textPrimary, textAlign: isRTL ? 'left' : 'right' }]}>{t(levelLabelKey)}</Text>
            </View>
            <View style={[styles.pointsIconWrap, { backgroundColor: theme.colors.rewardSoft, borderColor: theme.colors.reward }]}>
              <Star size={18} color={theme.colors.reward} weight="fill" />
            </View>
          </View>
        </View>
        <View style={[styles.progressTrack, { backgroundColor: theme.colors.surfaceMuted }]}>
          <View style={[styles.progressFill, { width: `${progressFraction * 100}%`, backgroundColor: theme.colors.community, [isRTL ? 'right' : 'left']: 0 }]} />
        </View>
        <Text style={[typography.caption, { color: theme.colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>
          {nextThreshold !== null ? t('points.nextTier', { remaining: nextThreshold - completedCount }) : t('points.topTier')}
        </Text>
      </View>

      <View style={[styles.weeklyHeaderRow, dirStyles(isRTL).row]}>
        <Fire size={18} color={theme.colors.emergency} weight="fill" />
        <Text style={[typography.h3, { color: theme.colors.textPrimary }]}>{t('perks.weeklyOffers.title')}</Text>
      </View>
      <View style={[styles.weeklyMetaRow, dirStyles(isRTL).row]}>
        <Text style={[typography.caption, { color: theme.colors.textSecondary }]}>{t('perks.weeklyOffers.subtitle', { count: WEEKLY_OFFERS.length })}</Text>
        <View style={[styles.countdownPill, dirStyles(isRTL).row, { backgroundColor: theme.colors.emergencySoft }]}>
          <ClockCountdown size={13} color={theme.colors.emergency} weight="fill" />
          <Text style={[typography.caption, { color: theme.colors.emergency }]}>{t('perks.weeklyOffers.countdown', { days: countdown.days, hours: countdown.hours })}</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.offersRail, dirStyles(isRTL).row]}>
        {WEEKLY_OFFERS.map(offer => <WeeklyOfferCard key={offer.id} offer={offer} onUse={useOffer} />)}
      </ScrollView>

      <ProMaxBanner />
    </AppScreen>
  )
}

function WeeklyOfferCard({ offer, onUse }: { offer: WeeklyOffer; onUse: () => void }) {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const { t } = useTranslation()
  const tint = offer.tone === 'primary' ? theme.colors.primary : offer.tone === 'community' ? theme.colors.community : theme.colors.rewardPressed
  const softTint = offer.tone === 'primary' ? theme.colors.primarySoft : offer.tone === 'community' ? theme.colors.communitySoft : theme.colors.rewardSoft
  const savings = offer.originalPrice - offer.offerPrice
  const Icon = offer.Icon
  return (
    <View style={[styles.offerCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      <View style={[styles.offerImage, { backgroundColor: softTint }]}>
        <Icon size={38} color={tint} weight="duotone" />
        <View style={[styles.exclusiveBadge, dirStyles(isRTL).row, { backgroundColor: colors.ink }]}>
          <Crown size={10} color={colors.sand} weight="fill" />
          <Text style={[typography.caption, styles.exclusiveBadgeText]}>{t('perks.weeklyOffers.exclusive')}</Text>
        </View>
      </View>
      <View style={styles.offerBody}>
        <Text numberOfLines={1} style={[typography.smallMedium, { color: theme.colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{t(offer.nameKey)}</Text>
        <Text numberOfLines={1} style={[typography.caption, { color: theme.colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>{t(offer.categoryKey)}</Text>
        <View style={[styles.priceRow, dirStyles(isRTL).row]}>
          <Text style={[typography.caption, styles.strikePrice, { color: theme.colors.textMuted }]}>{formatPrice(offer.originalPrice, CURRENT_MARKET.currencySymbol)}</Text>
          <Text style={[typography.bodyMedium, { color: tint }]}>{formatPrice(offer.offerPrice, CURRENT_MARKET.currencySymbol)}</Text>
        </View>
        <View style={[styles.pointsPill, dirStyles(isRTL).row, { backgroundColor: theme.colors.rewardSoft }]}>
          <Coins size={11} color={theme.colors.rewardPressed} weight="fill" />
          <Text style={[typography.caption, { color: theme.colors.rewardPressed }]}>{t('perks.weeklyOffers.pointsCost', { points: offer.pointsCost })}</Text>
        </View>
        <Text style={[typography.caption, { color: theme.colors.community, textAlign: isRTL ? 'right' : 'left' }]}>{t('perks.weeklyOffers.savings', { amount: formatPrice(savings, CURRENT_MARKET.currencySymbol) })}</Text>
        <Pressable onPress={onUse} style={[styles.useButton, { backgroundColor: theme.colors.community }]}>
          <Text style={[typography.smallMedium, { color: theme.colors.onCommunity }]}>{t('perks.weeklyOffers.useOffer')}</Text>
        </Pressable>
      </View>
    </View>
  )
}

// Deliberately named differently from the real AKHOO+ (SANAD+) membership
// tier already wired in lib/membership.ts (which stays untouched and
// unmarketed here now that PlusHeroCard is off this screen) - this is a
// second, distinct, not-yet-real tier, so its own name avoids implying two
// paid tiers are simultaneously live.
function ProMaxBanner() {
  const { t } = useTranslation()
  const isRTL = useIsRTL()
  return (
    <View style={styles.proMaxCard}>
      <View style={[styles.proMaxRow, dirStyles(isRTL).row]}>
        <View style={styles.proMaxIconWrap}>
          <Crown size={22} color={colors.sand} weight="fill" />
        </View>
        <View style={styles.proMaxTextWrap}>
          <Text style={[styles.proMaxTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{t('perks.proMax.title')}</Text>
          <Text style={[styles.proMaxSubtitle, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={2}>{t('perks.proMax.subtitle')}</Text>
        </View>
        <View style={[styles.proMaxComingSoon, dirStyles(isRTL).row]}>
          <ClockCountdown size={12} color={colors.sand} />
          <Text style={styles.proMaxComingSoonText}>{t('perks.proMax.comingSoon')}</Text>
        </View>
      </View>
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

  headerGiftWrap: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },

  pointsCard: { borderWidth: 1, borderRadius: radius.lg, padding: space.lg, gap: space.sm },
  pointsTopRow: { alignItems: 'center', justifyContent: 'space-between' },
  pointsColumn: { alignItems: 'center', gap: space.sm },
  levelColumn: { alignItems: 'center', gap: space.sm },
  pointsIconWrap: { width: 40, height: 40, borderRadius: radius.pill, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  progressTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { position: 'absolute', top: 0, bottom: 0, borderRadius: 4 },

  weeklyHeaderRow: { alignItems: 'center', gap: space.sm },
  weeklyMetaRow: { alignItems: 'center', justifyContent: 'space-between' },
  countdownPill: { alignItems: 'center', gap: 4, borderRadius: radius.pill, paddingVertical: 4, paddingHorizontal: space.sm },

  offersRail: { gap: space.md, paddingBottom: space.xs },
  offerCard: { width: 152, borderWidth: 1, borderRadius: radius.lg, overflow: 'hidden' },
  offerImage: { width: '100%', height: 96, alignItems: 'center', justifyContent: 'center' },
  exclusiveBadge: { position: 'absolute', top: 8, alignItems: 'center', gap: 3, borderRadius: radius.pill, paddingVertical: 3, paddingHorizontal: 7 },
  exclusiveBadgeText: { color: '#fff', fontSize: 10 },
  offerBody: { padding: space.sm, gap: 5 },
  strikePrice: { textDecorationLine: 'line-through' },
  pointsPill: { alignSelf: 'flex-start', alignItems: 'center', gap: 4, borderRadius: radius.pill, paddingVertical: 3, paddingHorizontal: 8 },
  useButton: { alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm, paddingVertical: 9, marginTop: 2 },

  proMaxCard: { backgroundColor: colors.ink, borderColor: colors.inkBorder, borderWidth: 1, borderRadius: radius.lg, padding: space.lg },
  proMaxRow: { alignItems: 'center', gap: space.md },
  proMaxIconWrap: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.inkElevated, alignItems: 'center', justifyContent: 'center' },
  proMaxTextWrap: { flex: 1, gap: 2 },
  proMaxTitle: { color: colors.inkText, fontWeight: '800', fontSize: 16 },
  proMaxSubtitle: { color: colors.inkMuted, fontSize: 12 },
  proMaxComingSoon: { alignItems: 'center', gap: 4, backgroundColor: colors.inkElevated, borderRadius: radius.pill, paddingVertical: 6, paddingHorizontal: space.sm },
  proMaxComingSoonText: { color: colors.sand, fontSize: 11, fontWeight: '700' }
})
