import { Image, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { colors, font, radius, shadow, space } from '../lib/theme'
import { dirStyles, useIsRTL } from '../lib/direction'
import { computeOfferPriceDisplay, formatPrice, type OfferPriceDisplay } from '../lib/offerPricing'
import { CURRENT_MARKET } from '../lib/market'
import type { BusinessRating, Partner, PartnerOffer } from '../types'
import { RatingStars } from './RatingStars'
import { PlusBadge } from './PlusBadge'
import { Tactile } from './Tactile'

export function OfferCard({
  offer,
  business,
  rating,
  variant = 'rail',
  onPress
}: {
  offer: PartnerOffer
  business: Partner | undefined
  rating?: BusinessRating
  variant?: 'rail' | 'list'
  onPress: () => void
}) {
  const dir = dirStyles(useIsRTL())
  const price = computeOfferPriceDisplay(offer)
  const imageUri = offer.image_url ?? business?.logo_url ?? null

  return (
    <Tactile onPress={onPress} style={[styles.card, variant === 'rail' ? styles.railCard : styles.listCard]} scaleTo={0.97}>
      <View style={styles.imageWrap}>
        {imageUri ? <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" /> : <View style={[styles.image, styles.imageFallback]} />}
        {offer.member_only ? <View style={styles.badgeWrap}><PlusBadge /></View> : null}
      </View>
      <View style={styles.body}>
        <Text style={[styles.title, dir.textStart]} numberOfLines={2}>{offer.title}</Text>
        {business ? <Text style={[styles.business, dir.textStart]} numberOfLines={1}>{business.name}</Text> : null}
        <View style={[styles.footer, dir.row]}>
          <PriceLine price={price} />
          {rating ? <RatingStars rating={rating.average_rating} count={rating.review_count} size={11.5} /> : null}
        </View>
      </View>
    </Tactile>
  )
}

function PriceLine({ price }: { price: OfferPriceDisplay }) {
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
        <Text style={styles.percentBadge}>-{price.percent}%</Text>
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
          <Text style={styles.percentBadge}>-{formatPrice(price.amountOff, symbol)}</Text>
        )}
      </View>
    )
  }

  // special_price
  return (
    <View style={[styles.priceRow, dir.row]}>
      {price.originalPrice != null ? <Text style={styles.strike}>{formatPrice(price.originalPrice, symbol)}</Text> : null}
      {price.offerPrice != null ? <Text style={styles.offerPrice}>{formatPrice(price.offerPrice, symbol)}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', ...shadow.soft },
  railCard: { width: 220 },
  listCard: { width: '100%' },
  imageWrap: { position: 'relative' },
  image: { width: '100%', height: 130 },
  imageFallback: { backgroundColor: colors.sageSoft },
  badgeWrap: { position: 'absolute', top: 10, insetInlineStart: 10 },
  body: { padding: space.md, gap: 3 },
  title: { color: colors.text, fontFamily: font.bold, fontSize: 14.5, lineHeight: 19, minHeight: 38 },
  business: { color: colors.muted, fontFamily: font.medium, fontSize: 12 },
  footer: { alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  priceRow: { alignItems: 'center', gap: 6 },
  strike: { color: colors.muted, fontFamily: font.regular, fontSize: 12, textDecorationLine: 'line-through' },
  offerPrice: { color: colors.forest, fontFamily: font.extraBold, fontSize: 15 },
  percentBadge: { color: colors.forest, fontFamily: font.extraBold, fontSize: 14 },
  freeText: { color: colors.forest, fontFamily: font.extraBold, fontSize: 14 }
})
