import { useMemo, useState } from 'react'
import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { MagnifyingGlass, MapPin, Phone, Star, Storefront, Tag, WhatsappLogo } from 'phosphor-react-native'
import * as Haptics from 'expo-haptics'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import { businessCategoryIcons } from '../../lib/businessCategories'
import { telHref, whatsappHref, directionsHref } from '../../lib/contactLinks'
import { CURRENT_MARKET, CURRENT_MARKET_CODE } from '../../lib/market'
import { useMembership, resolveOfferUseAction } from '../../lib/membership'
import { computeOfferPriceDisplay, formatPrice } from '../../lib/offerPricing'
import { useIsRTL } from '../../lib/direction'
import { space, useSanadTheme } from '../../lib/theme'
import { useAppTypography } from '../../lib/typography'
import { useAuth } from '../../providers'
import type { BusinessPhoto, BusinessRating, Partner, PartnerCategory, PartnerOffer, Review } from '../../types'
import { AppScreen, MapPanel, ScreenHeader, SectionHeading } from '../../components/v2'
import { BottomSheet, Button, Card, TextField } from '../../components/ui'
import { BusinessCard } from '../../components/BusinessCard'
import { CategoryChipsRow } from '../../components/CategoryChipsRow'
import { EmptyState } from '../../components/EmptyState'
import { MembershipSheet } from '../../components/MembershipSheet'
import { OfferCard } from '../../components/OfferCard'
import { PlusBadge } from '../../components/PlusBadge'
import { PlusHeroCard } from '../../components/PlusHeroCard'
import { RatingStars } from '../../components/RatingStars'
import { Skeleton } from '../../components/Skeleton'

type DiscoverData = { businesses: Partner[]; offers: PartnerOffer[]; ratings: Record<string, BusinessRating> }

async function loadDiscoverData(): Promise<DiscoverData> {
  const { data: businesses, error: businessesError } = await supabase
    .from('partners').select('*').eq('status', 'verified').eq('is_active', true).eq('market', CURRENT_MARKET_CODE).order('name')
  if (businessesError) throw businessesError
  const businessRows = (businesses ?? []) as Partner[]
  const ids = businessRows.map(b => b.id)
  const [{ data: offers, error: offersError }, { data: ratingRows }] = await Promise.all([
    ids.length ? supabase.from('public_offers').select('*').in('partner_id', ids).order('created_at', { ascending: false }) : Promise.resolve({ data: [] as PartnerOffer[], error: null }),
    ids.length ? supabase.from('business_ratings').select('*').in('business_id', ids) : Promise.resolve({ data: [] as BusinessRating[] })
  ])
  if (offersError) throw offersError
  return { businesses: businessRows, offers: (offers ?? []) as PartnerOffer[], ratings: Object.fromEntries((ratingRows ?? []).map(r => [r.business_id, r as BusinessRating])) }
}

// Real SANAD Perks - the same discover/business/offer content as the intact
// src/screens/PerksScreen.tsx, BusinessDetailView.tsx and OfferDetailView.tsx,
// ported onto AppScreen/ScreenHeader chrome + Expo Router while keeping their
// already-correct cards (BusinessCard, OfferCard, RatingStars, PlusHeroCard,
// MembershipSheet). Not ccodex's invented points/rewards marketplace or paid
// SANAD+ checkout - there is no redemption RPC and no rewards catalog in the
// real product; "Use offer" only ever opens a contact sheet or, for
// member-only offers, an honest "not available yet" membership sheet.
export function CommunityHubScreen() {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const { t } = useTranslation()
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<PartnerCategory | 'all'>('all')
  const [membershipOpen, setMembershipOpen] = useState(false)
  const query = useQuery({ queryKey: ['community', 'discover', CURRENT_MARKET_CODE], queryFn: loadDiscoverData })
  const data = query.data

  const businessById = useMemo(() => Object.fromEntries((data?.businesses ?? []).map(b => [b.id, b])), [data])
  const businessHasOffer = useMemo(() => new Set((data?.offers ?? []).map(o => o.partner_id)), [data])
  const isFiltering = category !== 'all' || search.trim().length > 0

  const filteredBusinesses = useMemo(() => {
    if (!data) return []
    const q = search.trim().toLowerCase()
    return data.businesses.filter(business => {
      if (category !== 'all' && business.category !== category) return false
      if (q && !business.name.toLowerCase().includes(q)) return false
      return true
    })
  }, [data, category, search])

  const filteredOffers = useMemo(() => {
    if (!data) return []
    const q = search.trim().toLowerCase()
    return data.offers.filter(offer => {
      const business = businessById[offer.partner_id]
      if (category !== 'all' && business?.category !== category) return false
      if (q && !offer.title.toLowerCase().includes(q) && !business?.name.toLowerCase().includes(q)) return false
      return true
    })
  }, [data, category, search, businessById])

  function openBusiness(id: string) { router.push({ pathname: '/community/business/[businessId]', params: { businessId: id } }) }
  function openOffer(id: string) { router.push({ pathname: '/community/offer/[offerId]', params: { offerId: id } }) }

  return (
    <AppScreen header={<ScreenHeader title={t('perks.title')} subtitle={t('perks.subtitle')} />} contentStyle={styles.content}>
      <TextField value={search} onChangeText={setSearch} placeholder={t('perks.searchPlaceholder')} />
      <CategoryChipsRow selected={category} onSelect={category => { Haptics.selectionAsync().catch(() => {}); setCategory(category) }} />
      <PlusHeroCard onPress={() => setMembershipOpen(true)} />

      {query.isError ? (
        <View style={styles.center}>
          <Text style={[typography.small, { color: theme.colors.textSecondary }]}>{t('perks.errors.loadFailed')}</Text>
          <Button label={t('common.retry')} variant="outline" onPress={() => query.refetch()} />
        </View>
      ) : !data ? (
        <>
          <Skeleton width="100%" height={130} />
          <Skeleton width="100%" height={80} />
          <Skeleton width="100%" height={80} />
        </>
      ) : isFiltering ? (
        filteredOffers.length === 0 && filteredBusinesses.length === 0 ? (
          <EmptyState Icon={MagnifyingGlass} title={t('perks.empty.searchTitle')} message={t('perks.empty.searchMessage')} />
        ) : (
          <>
            {filteredOffers.length > 0 ? (
              <>
                <SectionHeading title={t('perks.offersTitle')} />
                <View style={styles.list}>{filteredOffers.map(offer => <OfferCard key={offer.id} offer={offer} business={businessById[offer.partner_id]} rating={data.ratings[offer.partner_id]} variant="list" onPress={() => openOffer(offer.id)} />)}</View>
              </>
            ) : null}
            {filteredBusinesses.length > 0 ? (
              <>
                <SectionHeading title={t('perks.businessesTitle')} />
                <View style={styles.list}>{filteredBusinesses.map(business => <BusinessCard key={business.id} business={business} rating={data.ratings[business.id]} variant="row" onPress={() => openBusiness(business.id)} />)}</View>
              </>
            ) : null}
          </>
        )
      ) : (
        <>
          <SectionHeading title={t('perks.offersTitle')} />
          {data.offers.length === 0 ? (
            <EmptyState Icon={Tag} title={t('perks.empty.offersTitle')} message={t('perks.empty.offersMessage')} />
          ) : (
            <View style={[styles.rail, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>{data.offers.map(offer => <OfferCard key={offer.id} offer={offer} business={businessById[offer.partner_id]} rating={data.ratings[offer.partner_id]} onPress={() => openOffer(offer.id)} />)}</View>
          )}
          <SectionHeading title={t('perks.businessesTitle')} />
          {data.businesses.length === 0 ? (
            <EmptyState Icon={Storefront} title={t('perks.empty.businessesTitle')} message={t('perks.empty.businessesMessage')} />
          ) : (
            <View style={[styles.grid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>{data.businesses.map(business => <BusinessCard key={business.id} business={business} rating={data.ratings[business.id]} hasOffer={businessHasOffer.has(business.id)} onPress={() => openBusiness(business.id)} />)}</View>
          )}
        </>
      )}

      <MembershipSheet visible={membershipOpen} onClose={() => setMembershipOpen(false)} />
    </AppScreen>
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
        <View style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Text style={[typography.caption, { color: theme.colors.textSecondary }]}>{t(`perks.categories.${business.category}`)}</Text>
          <RatingStars rating={rating?.average_rating ?? null} count={rating?.review_count ?? 0} />
        </View>
        {business.description ? <Text style={[typography.body, { color: theme.colors.textPrimary, textAlign: isRTL ? 'right' : 'left', marginTop: space.sm }]}>{business.description}</Text> : null}
        <View style={[styles.quickButtons, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          {business.phone ? <Button fullWidth={false} label={t('perks.business.call')} variant="outline" leading={<Phone size={18} color={theme.colors.primary} />} onPress={() => Linking.openURL(telHref(business.phone!))} /> : null}
          {business.whatsapp ? <Button fullWidth={false} label="WhatsApp" variant="outline" leading={<WhatsappLogo size={18} color={theme.colors.community} />} onPress={() => Linking.openURL(whatsappHref(business.whatsapp!))} /> : null}
          {business.latitude != null && business.longitude != null ? <Button fullWidth={false} label={t('perks.business.directions')} variant="outline" leading={<MapPin size={18} color={theme.colors.primary} />} onPress={() => Linking.openURL(directionsHref(business.latitude!, business.longitude!))} /> : null}
        </View>
      </Card>

      {business.latitude != null && business.longitude != null ? <MapPanel latitude={business.latitude} longitude={business.longitude} height={220} interactive={false} /> : null}

      {business.opening_hours && Object.keys(business.opening_hours).length > 0 ? (
        <Card title={t('perks.business.hoursTitle')} elevation="none">
          <View>{(['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const).filter(day => business.opening_hours?.[day]).map(day => (
            <View key={day} style={[styles.hoursRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
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
            <View style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
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
    <AppScreen header={<ScreenHeader title={t('perks.offer.title')} back />} footer={<Button label={t('perks.offer.use')} variant={offer.member_only ? 'reward' : 'primary'} onPress={handleUse} />} contentStyle={styles.content}>
      {imageUri ? <Image source={{ uri: imageUri }} style={styles.offerHero} resizeMode="cover" /> : <View style={[styles.offerHero, styles.galleryFallback, { backgroundColor: theme.colors.rewardSoft }]} />}
      {offer.member_only ? <PlusBadge size="md" /> : null}
      <Text style={[typography.h1, { color: theme.colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{offer.title}</Text>

      <Pressable onPress={() => router.push({ pathname: '/community/business/[businessId]', params: { businessId: business.id } })} style={[styles.businessRow, { flexDirection: isRTL ? 'row-reverse' : 'row', borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
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
        {business.latitude != null && business.longitude != null ? <Button label={t('perks.business.directions')} variant="outline" leading={<MapPin size={18} color={theme.colors.primary} />} onPress={() => Linking.openURL(directionsHref(business.latitude!, business.longitude!))} /> : null}
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
    <View style={[styles.priceRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
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
  center: { alignItems: 'center', gap: space.md, paddingVertical: space.xl },
  list: { gap: space.md },
  rail: { gap: space.md, flexWrap: 'wrap' },
  grid: { flexWrap: 'wrap', gap: space.md },
  row: { alignItems: 'center', gap: space.sm, justifyContent: 'space-between' },
  quickButtons: { gap: space.sm, flexWrap: 'wrap', marginTop: space.md },
  gallery: { flexDirection: 'row', width: '100%', height: 200, borderRadius: 20, overflow: 'hidden' },
  galleryImage: { width: '100%', height: '100%' },
  galleryFallback: { alignItems: 'center', justifyContent: 'center' },
  hoursRow: { justifyContent: 'space-between', paddingVertical: 4 },
  offerHero: { width: '100%', height: 220, borderRadius: 20 },
  businessRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, borderWidth: 1, borderRadius: 16, padding: space.md },
  businessLogo: { width: 40, height: 40, borderRadius: 10 },
  priceRow: { alignItems: 'center', gap: space.sm }
})
