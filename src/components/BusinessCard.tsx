import { Image, StyleSheet, Text, View } from 'react-native'
import { Tag } from 'phosphor-react-native'
import { useTranslation } from 'react-i18next'
import { businessCategoryIcons } from '../lib/businessCategories'
import { colors, font, radius, shadow, space } from '../lib/theme'
import { dirStyles, useIsRTL } from '../lib/direction'
import type { BusinessRating, Partner } from '../types'
import { RatingStars } from './RatingStars'
import { Tactile } from './Tactile'

// Two anatomies sharing one card language: `grid` (default) is a 2-column
// image-forward card matching OfferCard's rail-card treatment - this
// round's rebuild deliberately moves the main directory off a single
// vertical list of rows (see reference board + Businesses aggressive-
// rebuild scope) so Offers and Businesses read as one consistent card
// system. `row` stays a dense horizontal line, kept for filtered/search
// results where scanning many hits matters more than browsing.
export function BusinessCard({
  business,
  rating,
  hasOffer,
  variant = 'grid',
  onPress
}: {
  business: Partner
  rating?: BusinessRating
  hasOffer?: boolean
  variant?: 'grid' | 'row'
  onPress: () => void
}) {
  const { t } = useTranslation()
  const dir = dirStyles(useIsRTL())
  const Icon = businessCategoryIcons[business.category]

  if (variant === 'row') {
    return (
      <Tactile onPress={onPress} style={[styles.row, dir.row]} scaleTo={0.98}>
        <View style={styles.rowLogoWrap}>
          {business.logo_url ? <Image source={{ uri: business.logo_url }} style={styles.logo} resizeMode="cover" /> : <Icon size={22} color={colors.forest} weight="duotone" />}
        </View>
        <View style={[styles.rowBody, dir.alignStart]}>
          <Text style={[styles.rowName, dir.textStart]} numberOfLines={1}>{business.name}</Text>
          <View style={[styles.rowMeta, dir.row]}>
            <Text style={styles.rowCategory}>{t(`perks.categories.${business.category}`)}</Text>
            <RatingStars rating={rating?.average_rating ?? null} count={rating?.review_count ?? 0} size={11} />
          </View>
        </View>
        {hasOffer ? (
          <View style={styles.rowOfferDot}><Tag size={10} color={colors.forest} weight="fill" /></View>
        ) : null}
      </Tactile>
    )
  }

  return (
    <Tactile onPress={onPress} style={styles.card} scaleTo={0.97}>
      <View style={styles.imageWrap}>
        {business.logo_url ? (
          <Image source={{ uri: business.logo_url }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, styles.imageFallback]}>
            <Icon size={30} color={colors.forest} weight="duotone" />
          </View>
        )}
        {hasOffer ? (
          <View style={styles.offerBadge}>
            <Tag size={10} color={colors.forest} weight="fill" />
            <Text style={styles.offerBadgeText}>{t('perks.business.hasOffer')}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.body}>
        <Text style={[styles.name, dir.textStart]} numberOfLines={1}>{business.name}</Text>
        <Text style={[styles.category, dir.textStart]} numberOfLines={1}>{t(`perks.categories.${business.category}`)}</Text>
        <View style={[styles.footer, dir.row]}>
          <RatingStars rating={rating?.average_rating ?? null} count={rating?.review_count ?? 0} size={11.5} />
          {business.service_area ? <Text style={[styles.area, dir.textStart]} numberOfLines={1}>{business.service_area}</Text> : null}
        </View>
      </View>
    </Tactile>
  )
}

const styles = StyleSheet.create({
  // grid variant
  card: { width: '48%', backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', ...shadow.soft },
  imageWrap: { position: 'relative' },
  image: { width: '100%', height: 92 },
  imageFallback: { backgroundColor: colors.sageSoft, alignItems: 'center', justifyContent: 'center' },
  offerBadge: { position: 'absolute', top: 8, insetInlineStart: 8, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: colors.sandSoft, borderRadius: radius.pill, paddingVertical: 3, paddingHorizontal: 7 },
  offerBadgeText: { color: colors.forestPressed, fontFamily: font.bold, fontSize: 9.5 },
  body: { padding: space.md, gap: 3 },
  name: { color: colors.text, fontFamily: font.bold, fontSize: 13.5 },
  category: { color: colors.muted, fontFamily: font.medium, fontSize: 11 },
  footer: { alignItems: 'center', justifyContent: 'space-between', marginTop: 4, gap: 6 },
  area: { flex: 1, color: colors.muted, fontFamily: font.regular, fontSize: 10.5, textAlign: 'right' },

  // row variant (filtered results)
  row: { alignItems: 'center', gap: space.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: space.md },
  rowLogoWrap: { width: 46, height: 46, borderRadius: radius.sm, backgroundColor: colors.sageSoft, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  logo: { width: '100%', height: '100%' },
  rowBody: { flex: 1, gap: 2 },
  rowName: { color: colors.text, fontFamily: font.bold, fontSize: 14 },
  rowMeta: { alignItems: 'center', gap: 6 },
  rowCategory: { color: colors.muted, fontFamily: font.medium, fontSize: 11.5 },
  rowOfferDot: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.sandSoft, alignItems: 'center', justifyContent: 'center' }
})
