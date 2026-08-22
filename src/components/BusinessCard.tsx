import { Image, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { businessCategoryIcons } from '../lib/businessCategories'
import { colors, font, radius, shadow, space } from '../lib/theme'
import { dirStyles, useIsRTL } from '../lib/direction'
import type { BusinessRating, Partner } from '../types'
import { RatingStars } from './RatingStars'
import { Tactile } from './Tactile'

export function BusinessCard({
  business,
  rating,
  hasOffer,
  onPress
}: {
  business: Partner
  rating?: BusinessRating
  hasOffer?: boolean
  onPress: () => void
}) {
  const { t } = useTranslation()
  const dir = dirStyles(useIsRTL())
  const Icon = businessCategoryIcons[business.category]

  return (
    <Tactile onPress={onPress} style={[styles.card, dir.row]} scaleTo={0.98}>
      <View style={styles.logoWrap}>
        {business.logo_url ? <Image source={{ uri: business.logo_url }} style={styles.logo} resizeMode="cover" /> : <Icon size={24} color={colors.forest} weight="duotone" />}
      </View>
      <View style={[styles.body, dir.alignStart]}>
        <View style={[styles.titleRow, dir.row]}>
          <Text style={[styles.name, dir.textStart]} numberOfLines={1}>{business.name}</Text>
          {hasOffer ? <View style={styles.offerDot} /> : null}
        </View>
        <Text style={[styles.category, dir.textStart]}>{t(`perks.categories.${business.category}`)}</Text>
        <View style={[styles.metaRow, dir.row]}>
          <RatingStars rating={rating?.average_rating ?? null} count={rating?.review_count ?? 0} size={12} />
          {business.service_area ? <Text style={[styles.area, dir.textStart]} numberOfLines={1}>· {business.service_area}</Text> : null}
        </View>
      </View>
    </Tactile>
  )
}

const styles = StyleSheet.create({
  card: { alignItems: 'center', gap: space.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: space.md, ...shadow.soft },
  logoWrap: { width: 54, height: 54, borderRadius: radius.md, backgroundColor: colors.sageSoft, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  logo: { width: '100%', height: '100%' },
  body: { flex: 1, gap: 2 },
  titleRow: { alignItems: 'center', gap: 6 },
  name: { flex: 1, color: colors.text, fontFamily: font.bold, fontSize: 15 },
  offerDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.sand },
  category: { color: colors.muted, fontFamily: font.medium, fontSize: 12 },
  metaRow: { alignItems: 'center', gap: 6, marginTop: 2 },
  area: { color: colors.muted, fontFamily: font.regular, fontSize: 12 }
})
