import { useEffect, useState } from 'react'
import { Image, Linking, ScrollView, StyleSheet, Text, View } from 'react-native'
import * as Haptics from 'expo-haptics'
import { ArrowLeft, ArrowRight, MapPin, Phone, Tag, WhatsappLogo } from 'phosphor-react-native'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { computeOfferPriceDisplay, formatPrice } from '../lib/offerPricing'
import { telHref, whatsappHref, directionsHref } from '../lib/contactLinks'
import { useMembership } from '../lib/membership'
import { CURRENT_MARKET, CURRENT_MARKET_FEATURES } from '../lib/market'
import { colors, font, radius, shadow, space, type } from '../lib/theme'
import { dirStyles, useIsRTL } from '../lib/direction'
import type { BusinessRating, Partner, PartnerOffer } from '../types'
import { BottomSheet } from '../components/BottomSheet'
import { EmptyState } from '../components/EmptyState'
import { MembershipSheet } from '../components/MembershipSheet'
import { PlusBadge } from '../components/PlusBadge'
import { PrimaryButton } from '../components/PrimaryButton'
import { RatingStars } from '../components/RatingStars'
import { Skeleton } from '../components/Skeleton'
import { Tactile } from '../components/Tactile'

type OfferDetailData = { offer: PartnerOffer; business: Partner; rating: BusinessRating | null }

export function OfferDetailView({
  offerId,
  userId,
  onBack,
  onOpenBusiness
}: {
  offerId: string
  userId: string
  onBack: () => void
  onOpenBusiness: (businessId: string) => void
}) {
  const { t, i18n } = useTranslation()
  const isRTL = useIsRTL()
  const dir = dirStyles(isRTL)
  const BackIcon = isRTL ? ArrowRight : ArrowLeft
  const [data, setData] = useState<OfferDetailData | null | 'not-found'>(null)
  const [membershipSheetOpen, setMembershipSheetOpen] = useState(false)
  const [contactSheetOpen, setContactSheetOpen] = useState(false)
  const { isPlusMember } = useMembership(userId)

  useEffect(() => {
    let cancelled = false
    setData(null)
    ;(async () => {
      // public_offers already encodes every visibility rule (approved,
      // within its date window, parent business verified+active) - reading
      // through it here guarantees this screen can never show an offer the
      // list itself wouldn't have shown.
      const { data: offer } = await supabase.from('public_offers').select('*').eq('id', offerId).maybeSingle()
      if (cancelled) return
      if (!offer) {
        setData('not-found')
        return
      }
      const [{ data: business }, { data: rating }] = await Promise.all([
        supabase.from('partners').select('*').eq('id', offer.partner_id).maybeSingle(),
        supabase.from('business_ratings').select('*').eq('business_id', offer.partner_id).maybeSingle()
      ])
      if (cancelled) return
      if (!business) {
        setData('not-found')
        return
      }
      setData({ offer: offer as PartnerOffer, business: business as Partner, rating: (rating ?? null) as BusinessRating | null })
    })()
    return () => { cancelled = true }
  }, [offerId])

  function handleUse() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {})
    if (data === null || data === 'not-found') return
    const requiresPlus = CURRENT_MARKET_FEATURES.sanadPlus && data.offer.member_only
    if (requiresPlus && !isPlusMember) {
      setMembershipSheetOpen(true)
      return
    }
    // No real redemption RPC exists yet (offer_redemptions is schema-only,
    // no client insert policy) - stop at an honest, useful state instead of
    // faking a QR code or confirmation.
    setContactSheetOpen(true)
  }

  if (data === null) return <DetailSkeleton onBack={onBack} BackIcon={BackIcon} />

  if (data === 'not-found') {
    return (
      <View style={styles.fill}>
        <TopBar onBack={onBack} BackIcon={BackIcon} />
        <View style={styles.notFoundWrap}>
          <EmptyState Icon={Tag} title={t('perks.offer.notFound')} />
        </View>
      </View>
    )
  }

  const { offer, business, rating } = data
  const price = computeOfferPriceDisplay(offer)
  const imageUri = offer.image_url ?? business.logo_url ?? null
  const showPlusBadge = CURRENT_MARKET_FEATURES.sanadPlus && offer.member_only

  return (
    <View style={styles.fill}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {imageUri ? <Image source={{ uri: imageUri }} style={styles.hero} resizeMode="cover" /> : <View style={[styles.hero, styles.heroFallback]} />}

        <View style={styles.body}>
          {showPlusBadge ? <PlusBadge size="md" /> : null}
          <Text style={[styles.title, dir.textStart]}>{offer.title}</Text>

          <Tactile onPress={() => onOpenBusiness(business.id)} style={[styles.businessRow, dir.row]} scaleTo={0.98}>
            {business.logo_url ? <Image source={{ uri: business.logo_url }} style={styles.businessLogo} /> : <View style={[styles.businessLogo, styles.businessLogoFallback]} />}
            <View style={[styles.businessText, dir.alignStart]}>
              <Text style={[styles.businessName, dir.textStart]}>{business.name}</Text>
              <RatingStars rating={rating?.average_rating ?? null} count={rating?.review_count ?? 0} size={12} />
            </View>
          </Tactile>

          <PriceBlock price={price} />

          {offer.description ? <Text style={[styles.description, dir.textStart]}>{offer.description}</Text> : null}

          {offer.terms ? (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, dir.textStart]}>{t('perks.offer.termsTitle')}</Text>
              <Text style={[styles.terms, dir.textStart]}>{offer.terms}</Text>
            </View>
          ) : null}

          <Text style={[styles.validity, dir.textStart]}>
            {offer.valid_until ? t('perks.offer.validUntil', { date: new Date(offer.valid_until).toLocaleDateString(i18n.language, { dateStyle: 'long' }) }) : t('perks.offer.validNoLimit')}
          </Text>
        </View>
      </ScrollView>

      <TopBar onBack={onBack} BackIcon={BackIcon} />

      <View style={styles.footer}>
        <PrimaryButton title={t('perks.offer.use')} onPress={handleUse} />
      </View>

      <MembershipSheet visible={membershipSheetOpen} onClose={() => setMembershipSheetOpen(false)} offerLocked />

      <BottomSheet visible={contactSheetOpen} onClose={() => setContactSheetOpen(false)}>
        <Text style={[styles.contactTitle, dir.textStart]}>{t('perks.offer.contactTitle')}</Text>
        <Text style={[styles.contactMessage, dir.textStart]}>{t('perks.offer.contactMessage')}</Text>
        <View style={[styles.contactActions, dir.row]}>
          {business.phone ? (
            <Tactile onPress={() => Linking.openURL(telHref(business.phone!))} style={styles.contactButton} scaleTo={0.94}>
              <Phone size={18} color={colors.forest} weight="fill" />
              <Text style={styles.contactButtonText}>{t('perks.business.call')}</Text>
            </Tactile>
          ) : null}
          {business.whatsapp ? (
            <Tactile onPress={() => Linking.openURL(whatsappHref(business.whatsapp!))} style={styles.contactButton} scaleTo={0.94}>
              <WhatsappLogo size={18} color={colors.forest} weight="fill" />
              <Text style={styles.contactButtonText}>{t('perks.business.whatsapp')}</Text>
            </Tactile>
          ) : null}
          {business.latitude != null && business.longitude != null ? (
            <Tactile onPress={() => Linking.openURL(directionsHref(business.latitude!, business.longitude!))} style={styles.contactButton} scaleTo={0.94}>
              <MapPin size={18} color={colors.forest} weight="fill" />
              <Text style={styles.contactButtonText}>{t('perks.business.directions')}</Text>
            </Tactile>
          ) : null}
        </View>
      </BottomSheet>
    </View>
  )
}

function PriceBlock({ price }: { price: ReturnType<typeof computeOfferPriceDisplay> }) {
  const { t } = useTranslation()
  const dir = dirStyles(useIsRTL())
  const symbol = CURRENT_MARKET.currencySymbol

  if (price.kind === 'free_benefit') {
    return <Text style={styles.freeText}>{t('perks.offer.free')}</Text>
  }

  if (price.kind === 'percentage') {
    return (
      <View style={[styles.priceRow, dir.row]}>
        {price.originalPrice != null && price.offerPrice != null ? (
          <>
            <Text style={styles.strike}>{formatPrice(price.originalPrice, symbol)}</Text>
            <Text style={styles.offerPrice}>{formatPrice(price.offerPrice, symbol)}</Text>
          </>
        ) : null}
        <View style={styles.percentPill}>
          <Text style={styles.percentPillText}>-{price.percent}%</Text>
        </View>
      </View>
    )
  }

  if (price.kind === 'fixed') {
    return (
      <View style={[styles.priceRow, dir.row]}>
        {price.originalPrice != null && price.offerPrice != null ? (
          <>
            <Text style={styles.strike}>{formatPrice(price.originalPrice, symbol)}</Text>
            <Text style={styles.offerPrice}>{formatPrice(price.offerPrice, symbol)}</Text>
          </>
        ) : (
          <View style={styles.percentPill}>
            <Text style={styles.percentPillText}>-{formatPrice(price.amountOff, symbol)}</Text>
          </View>
        )}
      </View>
    )
  }

  return (
    <View style={[styles.priceRow, dir.row]}>
      {price.originalPrice != null ? <Text style={styles.strike}>{formatPrice(price.originalPrice, symbol)}</Text> : null}
      {price.offerPrice != null ? <Text style={styles.offerPrice}>{formatPrice(price.offerPrice, symbol)}</Text> : null}
    </View>
  )
}

function TopBar({ onBack, BackIcon }: { onBack: () => void; BackIcon: typeof ArrowLeft }) {
  return (
    <View style={styles.topBar}>
      <Tactile onPress={onBack} style={styles.backButton} scaleTo={0.92}>
        <BackIcon size={18} color={colors.text} />
      </Tactile>
    </View>
  )
}

function DetailSkeleton({ onBack, BackIcon }: { onBack: () => void; BackIcon: typeof ArrowLeft }) {
  return (
    <View style={styles.fill}>
      <Skeleton width="100%" height={220} radius={0} />
      <View style={styles.body}>
        <Skeleton width="70%" height={22} />
        <Skeleton width="50%" height={16} style={styles.skeletonGap} />
        <Skeleton width="100%" height={60} radius={radius.lg} style={styles.skeletonGapLg} />
      </View>
      <TopBar onBack={onBack} BackIcon={BackIcon} />
    </View>
  )
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
  scrollContent: { paddingBottom: 120 },
  notFoundWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl },

  hero: { width: '100%', height: 220 },
  heroFallback: { backgroundColor: colors.sageSoft },

  body: { padding: space.lg, gap: space.md },
  title: { ...type.h1, color: colors.text },

  businessRow: { alignItems: 'center', gap: space.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: space.md },
  businessLogo: { width: 40, height: 40, borderRadius: radius.sm },
  businessLogoFallback: { backgroundColor: colors.sageSoft },
  businessText: { flex: 1, gap: 2 },
  businessName: { color: colors.text, fontFamily: font.bold, fontSize: 14 },

  priceRow: { alignItems: 'center', gap: space.sm },
  strike: { color: colors.muted, fontFamily: font.regular, fontSize: 14, textDecorationLine: 'line-through' },
  offerPrice: { color: colors.forest, fontFamily: font.extraBold, fontSize: 22 },
  percentPill: { backgroundColor: colors.sageSoft, borderRadius: radius.pill, paddingVertical: 5, paddingHorizontal: space.md },
  percentPillText: { color: colors.forest, fontFamily: font.extraBold, fontSize: 15 },
  freeText: { color: colors.forest, fontFamily: font.extraBold, fontSize: 20 },

  description: { color: colors.text, fontFamily: font.regular, fontSize: 14, lineHeight: 21 },
  section: { gap: 6 },
  sectionTitle: { color: colors.text, fontFamily: font.extraBold, fontSize: 15 },
  terms: { color: colors.muted, fontFamily: font.regular, fontSize: 13, lineHeight: 19 },
  validity: { color: colors.muted, fontFamily: font.medium, fontSize: 12.5 },

  topBar: { position: 'absolute', top: space.lg, insetInlineStart: space.lg },
  backButton: { width: 42, height: 42, borderRadius: radius.pill, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...shadow.floating },

  footer: { position: 'absolute', bottom: 0, insetInlineStart: 0, insetInlineEnd: 0, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border, padding: space.lg, paddingBottom: space.xxl },

  contactTitle: { ...type.h3, color: colors.text },
  contactMessage: { color: colors.muted, fontFamily: font.regular, fontSize: 13, lineHeight: 19, marginTop: 6, marginBottom: space.lg },
  contactActions: { gap: space.sm },
  contactButton: { flex: 1, alignItems: 'center', gap: 4, backgroundColor: colors.sageSoft, borderRadius: radius.md, paddingVertical: space.md },
  contactButtonText: { color: colors.forest, fontFamily: font.bold, fontSize: 12 },

  skeletonGap: { marginTop: space.xs },
  skeletonGapLg: { marginTop: space.md }
})
