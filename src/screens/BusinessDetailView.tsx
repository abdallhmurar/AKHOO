import { useEffect, useState } from 'react'
import { Image, Linking, ScrollView, StyleSheet, Text, View } from 'react-native'
import { ArrowLeft, ArrowRight, MapPin, Phone, Star, Tag, WhatsappLogo } from 'phosphor-react-native'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { businessCategoryIcons } from '../lib/businessCategories'
import { telHref, whatsappHref, directionsHref } from '../lib/contactLinks'
import { CURRENT_MARKET_CODE } from '../lib/market'
import { colors, font, radius, shadow, space, type } from '../lib/theme'
import { dirStyles, useIsRTL } from '../lib/direction'
import { useAndroidBackHandler } from '../lib/useAndroidBackHandler'
import type { BusinessPhoto, BusinessRating, Partner, PartnerOffer, Review } from '../types'
import { EmptyState } from '../components/EmptyState'
import { OfferCard } from '../components/OfferCard'
import { RatingStars } from '../components/RatingStars'
import { Skeleton } from '../components/Skeleton'
import { Surface } from '../components/Surface'
import { SanadMap } from '../components/SanadMap'
import { Tactile } from '../components/Tactile'

const DAY_ORDER = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const

type BusinessDetailData = {
  business: Partner
  photos: BusinessPhoto[]
  rating: BusinessRating | null
  offers: PartnerOffer[]
  reviews: Review[]
}

export function BusinessDetailView({ businessId, onBack, onOpenOffer }: { businessId: string; onBack: () => void; onOpenOffer: (offerId: string) => void }) {
  const { t, i18n } = useTranslation()
  const isRTL = useIsRTL()
  const dir = dirStyles(isRTL)
  const BackIcon = isRTL ? ArrowRight : ArrowLeft
  const [data, setData] = useState<BusinessDetailData | null | 'not-found'>(null)

  // System back returns to the previous Perks frame, same as the visible
  // back arrow (PerksScreen's own drill-down stack, see pop()).
  useAndroidBackHandler(onBack)

  useEffect(() => {
    let cancelled = false
    setData(null)
    ;(async () => {
      const { data: business } = await supabase.from('partners').select('*').eq('id', businessId).eq('status', 'verified').eq('is_active', true).eq('market', CURRENT_MARKET_CODE).maybeSingle()
      if (cancelled) return
      if (!business) {
        setData('not-found')
        return
      }

      const [{ data: photos }, { data: rating }, { data: offers }, { data: reviews }] = await Promise.all([
        supabase.from('business_photos').select('*').eq('business_id', businessId).order('sort_order'),
        supabase.from('business_ratings').select('*').eq('business_id', businessId).maybeSingle(),
        supabase.from('public_offers').select('*').eq('partner_id', businessId).order('created_at', { ascending: false }),
        supabase.from('reviews').select('*').eq('business_id', businessId).eq('is_hidden', false).order('created_at', { ascending: false }).limit(20)
      ])
      if (cancelled) return
      setData({
        business: business as Partner,
        photos: (photos ?? []) as BusinessPhoto[],
        rating: (rating ?? null) as BusinessRating | null,
        offers: (offers ?? []) as PartnerOffer[],
        reviews: (reviews ?? []) as Review[]
      })
    })()
    return () => { cancelled = true }
  }, [businessId])

  if (data === null) return <DetailSkeleton onBack={onBack} />

  if (data === 'not-found') {
    return (
      <View style={styles.fill}>
        <TopBar onBack={onBack} BackIcon={BackIcon} />
        <View style={styles.notFoundWrap}>
          <EmptyState Icon={MapPin} title={t('perks.business.notFound')} />
        </View>
      </View>
    )
  }

  const { business, photos, rating, offers, reviews } = data
  const Icon = businessCategoryIcons[business.category]
  const galleryImages = photos.length > 0 ? photos.map(p => p.url) : business.logo_url ? [business.logo_url] : []

  return (
    <View style={styles.fill}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {galleryImages.length > 0 ? (
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={styles.gallery}>
            {galleryImages.map((url, i) => (
              <Image key={`${url}-${i}`} source={{ uri: url }} style={styles.galleryImage} resizeMode="cover" />
            ))}
          </ScrollView>
        ) : (
          <View style={[styles.gallery, styles.galleryFallback]}>
            <Icon size={40} color={colors.forest} weight="duotone" />
          </View>
        )}

        {/* Identity card floats on the gallery/body seam, same overlap
            language as the Active Request status capsule and the Offer
            card's avatar badge (unified-system requirement - one recurring
            "floating capsule bridges two zones" motif reused across the
            app instead of a different trick per screen). */}
        <View style={styles.identityWrap}>
          <Surface elevation="elevated" padding="lg" style={styles.identityCard}>
            <Text style={[styles.name, dir.textStart]}>{business.name}</Text>
            <View style={[styles.metaRow, dir.row]}>
              <Text style={[styles.category, dir.textStart]}>{t(`perks.categories.${business.category}`)}</Text>
              <RatingStars rating={rating?.average_rating ?? null} count={rating?.review_count ?? 0} size={13} />
            </View>

            {business.description ? <Text style={[styles.description, dir.textStart]}>{business.description}</Text> : null}

            <View style={[styles.actionsRow, dir.row]}>
              {business.phone ? (
                <ContactAction Icon={Phone} label={t('perks.business.call')} onPress={() => Linking.openURL(telHref(business.phone!))} />
              ) : null}
              {business.whatsapp ? (
                <ContactAction Icon={WhatsappLogo} label={t('perks.business.whatsapp')} onPress={() => Linking.openURL(whatsappHref(business.whatsapp!))} />
              ) : null}
              {business.latitude != null && business.longitude != null ? (
                <ContactAction Icon={MapPin} label={t('perks.business.directions')} onPress={() => Linking.openURL(directionsHref(business.latitude!, business.longitude!))} />
              ) : null}
            </View>
          </Surface>
        </View>

        <View style={styles.body}>
          {business.latitude != null && business.longitude != null ? (
            <SanadMap latitude={business.latitude} longitude={business.longitude} height={160} />
          ) : null}

          {business.opening_hours && Object.keys(business.opening_hours).length > 0 ? (
            <Surface elevation="none" tone="muted" padding="lg" style={styles.section}>
              <Text style={[styles.sectionTitle, dir.textStart]}>{t('perks.business.hoursTitle')}</Text>
              {DAY_ORDER.filter(day => business.opening_hours?.[day]).map(day => (
                <View key={day} style={[styles.hoursRow, dir.row]}>
                  <Text style={[styles.hoursDay, dir.textStart]}>{t(`perks.business.days.${day}`)}</Text>
                  <Text style={styles.hoursValue}>{business.opening_hours![day]}</Text>
                </View>
              ))}
            </Surface>
          ) : null}

          {business.service_area ? (
            <Surface elevation="none" tone="muted" padding="lg" style={styles.section}>
              <Text style={[styles.sectionTitle, dir.textStart]}>{t('perks.business.serviceAreaTitle')}</Text>
              <Text style={[styles.serviceAreaText, dir.textStart]}>{business.service_area}</Text>
            </Surface>
          ) : null}

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, dir.textStart]}>{t('perks.business.offersTitle')}</Text>
            {offers.length === 0 ? (
              <EmptyState Icon={Tag} title={t('perks.business.noOffers')} />
            ) : (
              <View style={styles.offersList}>
                {offers.map(offer => (
                  <OfferCard key={offer.id} offer={offer} business={business} rating={rating ?? undefined} variant="list" onPress={() => onOpenOffer(offer.id)} />
                ))}
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, dir.textStart]}>{t('perks.business.reviewsTitle')}</Text>
            {reviews.length === 0 ? (
              <EmptyState Icon={Star} title={t('perks.business.noReviews')} />
            ) : (
              <View style={styles.reviewsList}>
                {reviews.map(review => (
                  <Surface key={review.id} elevation="none" padding="md" style={styles.reviewCard}>
                    <View style={[styles.reviewTop, dir.row]}>
                      <RatingStars rating={review.rating} count={1} size={12.5} />
                      <Text style={styles.reviewDate}>{new Date(review.created_at).toLocaleDateString(i18n.language, { dateStyle: 'medium' })}</Text>
                    </View>
                    {review.comment ? <Text style={[styles.reviewComment, dir.textStart]}>{review.comment}</Text> : null}
                  </Surface>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <TopBar onBack={onBack} BackIcon={BackIcon} />
    </View>
  )
}

function ContactAction({ Icon, label, onPress }: { Icon: typeof Phone; label: string; onPress: () => void }) {
  return (
    <Tactile onPress={onPress} style={styles.actionButton} scaleTo={0.94}>
      <Icon size={18} color={colors.forest} weight="fill" />
      <Text style={styles.actionLabel}>{label}</Text>
    </Tactile>
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

function DetailSkeleton({ onBack }: { onBack: () => void }) {
  const isRTL = useIsRTL()
  const BackIcon = isRTL ? ArrowRight : ArrowLeft
  return (
    <View style={styles.fill}>
      <Skeleton width="100%" height={220} radius={0} />
      <View style={styles.body}>
        <Skeleton width="70%" height={22} />
        <Skeleton width="40%" height={14} style={styles.skeletonGap} />
        <Skeleton width="100%" height={80} radius={radius.lg} style={styles.skeletonGapLg} />
      </View>
      <TopBar onBack={onBack} BackIcon={BackIcon} />
    </View>
  )
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
  scrollContent: { paddingBottom: space.xxxl },
  notFoundWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl },

  gallery: { width: '100%', height: 220 },
  galleryImage: { width: 400, height: 220 },
  galleryFallback: { backgroundColor: colors.sageSoft, alignItems: 'center', justifyContent: 'center' },

  identityWrap: { marginTop: -32, paddingHorizontal: space.lg, zIndex: 2 },
  identityCard: { gap: space.sm },
  body: { padding: space.lg, paddingTop: space.md, gap: space.md },
  name: { ...type.h1, color: colors.text },
  metaRow: { alignItems: 'center', gap: space.md },
  category: { color: colors.muted, fontFamily: font.bold, fontSize: 13 },
  description: { color: colors.text, fontFamily: font.regular, fontSize: 14, lineHeight: 21 },

  actionsRow: { gap: space.sm },
  actionButton: { flex: 1, alignItems: 'center', gap: 4, backgroundColor: colors.sageSoft, borderRadius: radius.md, paddingVertical: space.md },
  actionLabel: { color: colors.forest, fontFamily: font.bold, fontSize: 12 },

  section: { gap: space.sm },
  sectionTitle: { color: colors.text, fontFamily: font.extraBold, fontSize: 16 },
  hoursRow: { justifyContent: 'space-between', paddingVertical: 4 },
  hoursDay: { color: colors.muted, fontFamily: font.medium, fontSize: 13 },
  hoursValue: { color: colors.text, fontFamily: font.bold, fontSize: 13 },
  serviceAreaText: { color: colors.text, fontFamily: font.regular, fontSize: 13.5, lineHeight: 20 },

  offersList: { gap: space.md },
  reviewsList: { gap: space.sm },
  reviewCard: { borderWidth: 1, borderColor: colors.border, gap: 6 },
  reviewTop: { alignItems: 'center', justifyContent: 'space-between' },
  reviewDate: { color: colors.muted, fontFamily: font.regular, fontSize: 11.5 },
  reviewComment: { color: colors.text, fontFamily: font.regular, fontSize: 13.5, lineHeight: 20 },

  topBar: { position: 'absolute', top: space.lg, insetInlineStart: space.lg },
  backButton: { width: 42, height: 42, borderRadius: radius.pill, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...shadow.floating },

  skeletonGap: { marginTop: space.xs },
  skeletonGapLg: { marginTop: space.md }
})
