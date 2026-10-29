import { localizeContent, BUSINESS_TEXT_FIELDS, OFFER_TEXT_FIELDS } from '../../../shared/contentTranslations'
import { useEffect, useState } from 'react'
import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import QRCode from 'react-native-qrcode-svg'
import { ClockCountdown, MapPin, Phone, Star, Tag, WhatsappLogo } from 'phosphor-react-native'
import * as Haptics from 'expo-haptics'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import { businessCategoryIcons } from '../../lib/businessCategories'
import { telHref, whatsappHref, directionsHref } from '../../lib/contactLinks'
import { useNavigationApp } from '../../lib/navigationPreference'
import { CURRENT_MARKET, CURRENT_MARKET_CODE } from '../../lib/market'
import { computeOfferPriceDisplay, formatPrice } from '../../lib/offerPricing'


import { dirStyles, useIsRTL } from '../../lib/direction'
import { radius, space, useSanadTheme } from '../../lib/theme'
import { useAppTypography } from '../../lib/typography'
import { useAuth } from '../../providers'
import { rewardRepository } from '../../repositories/rewardRepository'
import { redemptionRepository } from '../../repositories/redemptionRepository'
import type { BusinessPhoto, BusinessRating, OfferRedemption, Partner, PartnerOffer, Review } from '../../types'
import { AppScreen, MapPanel, ScreenHeader, SectionHeading } from '../../components/v2'
import { BottomSheet, Button, Card } from '../../components/ui'
import { EmptyState } from '../../components/EmptyState'
import { NavigationAppIcon } from '../../components/NavigationAppIcon'
import { OfferCard } from '../../components/OfferCard'
import { OfferGallery } from '../../components/OfferGallery'
import { RatingStars } from '../../components/RatingStars'
import { Skeleton } from '../../components/Skeleton'
import { TranslatableText } from '../../components/TranslatableText'


// Redemption windows are short-lived, so refresh the countdown every second.
function useCountdownTo(iso: string | null) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    if (!iso) return
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [iso])
  if (!iso) return null
  const diff = new Date(iso).getTime() - now
  if (diff <= 0) return null
  return { minutes: Math.floor(diff / 60_000), seconds: Math.floor((diff % 60_000) / 1000) }
}

export { BenefitsScreen as CommunityHubScreen } from '../mobileHub/BenefitsScreen'

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
  const { t, i18n } = useTranslation()
  const router = useRouter()
  const { businessId } = useLocalSearchParams<{ businessId: string }>()
  const query = useQuery({ queryKey: ['community', 'business', businessId], queryFn: () => loadBusinessDetail(String(businessId)), enabled: !!businessId })
  const navigationApp = useNavigationApp()

  if (query.isLoading) return <AppScreen header={<ScreenHeader title={t('perks.business.title')} back />}><Skeleton width="100%" height={220} /><Skeleton width="100%" height={140} /></AppScreen>
  if (!query.data) return <AppScreen header={<ScreenHeader title={t('perks.business.title')} back />} contentStyle={styles.content}><EmptyState Icon={MapPin} title={t('perks.business.notFound')} /></AppScreen>

  const { photos, rating, offers, reviews } = query.data
  const business = localizeContent(query.data.business, i18n.language, BUSINESS_TEXT_FIELDS)
  const Icon = businessCategoryIcons[business.category]
  const gallery = photos.length > 0 ? photos.map(p => p.url) : business.logo_url ? [business.logo_url] : []

  return (
    <AppScreen header={<ScreenHeader title={business.name} subtitle={t('perks.business.verified')} back />} contentStyle={styles.content}>
      {gallery.length > 0 ? (
        <OfferGallery images={gallery} title={business.name} aspectRatio={1.8} />
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
            {review.comment ? <TranslatableText text={review.comment} style={[typography.small, { color: theme.colors.textSecondary, marginTop: 4 }]} /> : null}
          </Card>
        ))}</View>
      )}
    </AppScreen>
  )
}

async function loadOfferDetail(offerId: string) {
  const { data: offer } = await supabase.from('public_offers').select('*').eq('id', offerId).maybeSingle()
  if (!offer) return null
  // A general (no-partner) offer has no business row to load at all - not an
  // error case, just nothing to fetch (see 0021_weekly_offers.sql, partner_id
  // is now genuinely optional).
  if (!offer.partner_id) return { offer: offer as PartnerOffer, business: null, rating: null }
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
  const { t, i18n } = useTranslation()
  const router = useRouter()
  const { offerId } = useLocalSearchParams<{ offerId: string }>()
  const { session } = useAuth()
  const userId = session!.user.id
  const queryClient = useQueryClient()
  const query = useQuery({ queryKey: ['community', 'offer', offerId], queryFn: () => loadOfferDetail(String(offerId)), enabled: !!offerId })
  const balanceQuery = useQuery({ queryKey: ['community', 'points', userId], queryFn: () => rewardRepository.points(userId) })
  const navigationApp = useNavigationApp()
  const [contactOpen, setContactOpen] = useState(false)
  const [insufficientOpen, setInsufficientOpen] = useState(false)
  const [redemption, setRedemption] = useState<OfferRedemption | null>(null)
  const [creating, setCreating] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const countdown = useCountdownTo(redemption?.status === 'pending' ? redemption.expires_at : null)

  const usesPoints = (query.data?.offer.points_required ?? 0) > 0

  async function handleUse() {
    if (!query.data) return
    if (!usesPoints) { setContactOpen(true); return }

    const required = query.data.offer.points_required ?? 0
    const balance = balanceQuery.data?.balance ?? 0
    if (balance < required) { setInsufficientOpen(true); return }

    setCreating(true)
    try {
      const created = await redemptionRepository.create(query.data.offer.id)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
      setRedemption(created)
      queryClient.invalidateQueries({ queryKey: ['community', 'points', userId] })
    } catch {
      // redemptionRepository.create already normalizes the error; the app's
      // global toast host (subscribeToAppErrors) surfaces it.
    } finally {
      setCreating(false)
    }
  }

  async function handleCancelRedemption() {
    if (!redemption) return
    setCancelling(true)
    try {
      await redemptionRepository.cancel(redemption.id)
      setRedemption(null)
      queryClient.invalidateQueries({ queryKey: ['community', 'points', userId] })
    } catch {
      // surfaced via the global toast host, same as handleUse above
    } finally {
      setCancelling(false)
    }
  }

  if (query.isLoading) return <AppScreen header={<ScreenHeader title={t('perks.offer.title')} back />}><Skeleton width="100%" height={220} /><Skeleton width="100%" height={140} /></AppScreen>
  if (!query.data) return <AppScreen header={<ScreenHeader title={t('perks.offer.title')} back />} contentStyle={styles.content}><EmptyState Icon={Tag} title={t('perks.offer.notFound')} /></AppScreen>

  const { offer: originalOffer, business: originalBusiness, rating } = query.data
  const offer = localizeContent(originalOffer, i18n.language, OFFER_TEXT_FIELDS)
  const business = originalBusiness ? localizeContent(originalBusiness, i18n.language, BUSINESS_TEXT_FIELDS) : null
  const price = computeOfferPriceDisplay(offer)
  const imageUri = offer.image_url ?? business?.logo_url ?? null
  const images = offer.image_urls?.length ? offer.image_urls : imageUri ? [imageUri] : []

  return (
    <AppScreen header={<ScreenHeader title={offer.title} back />} footer={<Button label={t('perks.offer.use')} variant="primary" onPress={handleUse} loading={creating} />} contentStyle={styles.content}>
      {images.length ? <OfferGallery key={offer.id} images={images} title={offer.title} /> : <View style={[styles.offerHero, styles.galleryFallback, { backgroundColor: theme.colors.rewardSoft }]} />}
      <Text style={[typography.h1, { color: theme.colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{offer.title}</Text>
      {offer.offer_type_label ? <Text style={[typography.bodyMedium, { color: theme.colors.community, textAlign: isRTL ? 'right' : 'left' }]}>{offer.offer_type_label}</Text> : null}

      {business ? (
        <Pressable onPress={() => router.push({ pathname: '/community/business/[businessId]', params: { businessId: business.id } })} style={[styles.businessRow, { ...dirStyles(isRTL).row, borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
          {business.logo_url ? <Image source={{ uri: business.logo_url }} style={styles.businessLogo} /> : <View style={[styles.businessLogo, { backgroundColor: theme.colors.primarySoft }]} />}
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[typography.bodyMedium, { color: theme.colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{business.name}</Text>
            <RatingStars rating={rating?.average_rating ?? null} count={rating?.review_count ?? 0} size={12} />
          </View>
        </Pressable>
      ) : null}

      <OfferPriceBlock price={price} />

      {usesPoints ? (
        <View style={[styles.pointsCostRow, dirStyles(isRTL).row, { backgroundColor: theme.colors.communitySoft, borderRadius: radius.md, paddingHorizontal: space.md, paddingVertical: space.sm }]}>
          <Star size={14} color={theme.colors.community} weight="fill" />
          <Text style={[typography.smallMedium, { color: theme.colors.community }]}>{t('perks.weeklyOffers.pointsCost', { points: offer.points_required })}</Text>
        </View>
      ) : null}

      {offer.description ? <Text style={[typography.body, { color: theme.colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{offer.description}</Text> : null}
      {offer.terms ? <Card title={t('perks.offer.termsTitle')} elevation="none"><Text style={[typography.small, { color: theme.colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{offer.terms}</Text></Card> : null}
      <Text style={[typography.caption, { color: theme.colors.textMuted }]}>{offer.valid_until ? t('perks.offer.validUntil', { date: new Date(offer.valid_until).toLocaleDateString() }) : t('perks.offer.validNoLimit')}</Text>

      <BottomSheet visible={insufficientOpen} onClose={() => setInsufficientOpen(false)} title={t('perks.offer.insufficientPointsTitle')} subtitle={t('perks.offer.insufficientPointsMessage', { points: offer.points_required, balance: balanceQuery.data?.balance ?? 0 })} />

      <BottomSheet visible={contactOpen} onClose={() => setContactOpen(false)} title={t('perks.offer.contactTitle')} subtitle={t('perks.offer.contactMessage')}>
        {business?.phone ? <Button label={t('perks.business.call')} variant="outline" leading={<Phone size={18} color={theme.colors.primary} />} onPress={() => Linking.openURL(telHref(business.phone!))} /> : null}
        {business?.whatsapp ? <Button label="WhatsApp" variant="outline" leading={<WhatsappLogo size={18} color={theme.colors.community} />} onPress={() => Linking.openURL(whatsappHref(business.whatsapp!))} /> : null}
        {business?.latitude != null && business?.longitude != null ? <Button label={t('perks.business.directions')} variant="outline" leading={<NavigationAppIcon app={navigationApp} size={18} />} onPress={() => Linking.openURL(directionsHref(business.latitude!, business.longitude!, navigationApp))} /> : null}
      </BottomSheet>

      <BottomSheet visible={!!redemption} onClose={() => {}} dismissible={false} title={t('perks.offer.redeemTitle')} subtitle={t('perks.offer.redeemSubtitle')}>
        {redemption ? (
          <View style={{ alignItems: 'center', gap: space.md }}>
            <View style={{ padding: space.md, backgroundColor: '#fff', borderRadius: radius.md }}>
              <QRCode value={redemption.code} size={180} />
            </View>
            <Text style={[typography.smallMedium, { color: theme.colors.textMuted }]} selectable>{redemption.code}</Text>
            {countdown ? (
              <View style={[styles.countdownPill, dirStyles(isRTL).row, { backgroundColor: theme.colors.emergencySoft }]}>
                <ClockCountdown size={13} color={theme.colors.emergency} weight="fill" />
                <Text style={[typography.caption, { color: theme.colors.emergency }]}>{t('perks.offer.redeemCountdown', { minutes: countdown.minutes, seconds: String(countdown.seconds).padStart(2, '0') })}</Text>
              </View>
            ) : (
              <Text style={[typography.caption, { color: theme.colors.textMuted }]}>{t('perks.offer.redeemExpired')}</Text>
            )}
            <Button label={t('perks.offer.cancelRedemption')} variant="outline" onPress={handleCancelRedemption} loading={cancelling} />
          </View>
        ) : null}
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
  galleryFallback: { alignItems: 'center', justifyContent: 'center' },
  hoursRow: { justifyContent: 'space-between', paddingVertical: 4 },
  offerHero: { width: '100%', height: 220, borderRadius: 20 },
  businessRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, borderWidth: 1, borderRadius: 16, padding: space.md },
  businessLogo: { width: 40, height: 40, borderRadius: 10 },
  priceRow: { alignItems: 'center', gap: space.sm },


  hubContent: { gap: space.lg, paddingHorizontal: space.lg },
  hubHeader: { alignItems: 'center', justifyContent: 'space-between', gap: space.md },
  headerCopy: { flex: 1, gap: 2 },
  hubTitle: { fontSize: 30, lineHeight: 44 },
  headerCoupon: { width: 70, height: 50 },
  pointsCard: { borderWidth: 1, borderRadius: radius.lg, padding: space.md, gap: space.sm },
  pointsTopRow: { alignItems: 'center', gap: space.sm },
  levelGroup: { flex: 1, alignItems: 'center', gap: space.sm },
  levelCopy: { flex: 1, gap: 4 },
  balanceBlock: { alignItems: 'center', paddingHorizontal: space.md, minWidth: 76 },
  balanceValue: { fontSize: 32, lineHeight: 40 },
  progressTrack: { height: 7, borderRadius: 4, overflow: 'hidden', marginTop: 4 },
  progressFill: { position: 'absolute', top: 0, bottom: 0, borderRadius: 4 },
  weeklyHeaderRow: { alignItems: 'center', justifyContent: 'space-between', gap: space.sm, flexWrap: 'wrap', marginTop: space.sm },
  countdownPill: { alignItems: 'center', gap: 4, borderRadius: radius.pill, paddingVertical: 4, paddingHorizontal: space.sm },
  offersList: { gap: space.md },
  realOfferCard: { borderWidth: 1, borderRadius: radius.lg, padding: space.sm },
  realOfferTopRow: { alignItems: 'stretch', gap: space.sm },
  realOfferImageWrap: { width: '39%', aspectRatio: 1, alignSelf: 'center', borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  realOfferImage: { position: 'absolute', width: '100%', height: '100%' },
  realOfferBody: { flex: 1, gap: 4, paddingVertical: 4 },
  hubPriceRow: { alignItems: 'center', flexWrap: 'wrap', gap: space.sm, marginTop: space.sm },
  savingsBadge: { borderRadius: 6, paddingHorizontal: space.sm, paddingVertical: 4, overflow: 'hidden' },
  pointsCostRow: { alignItems: 'center', gap: 4 },
  offerFooter: { borderTopWidth: StyleSheet.hairlineWidth, marginTop: space.sm, paddingTop: space.sm, alignItems: 'center', gap: space.sm },
  offerCost: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.sm },
  detailsButton: { flex: 1, paddingHorizontal: space.md }
})
