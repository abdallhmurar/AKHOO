import { StyleSheet, Text, View } from 'react-native'
import { Star } from 'phosphor-react-native'
import { useTranslation } from 'react-i18next'
import { colors, font } from '../lib/theme'
import { dirStyles, useIsRTL } from '../lib/direction'

export function RatingStars({ rating, count, size = 13 }: { rating: number | null; count: number; size?: number }) {
  const { t } = useTranslation()
  const dir = dirStyles(useIsRTL())

  if (!rating || count === 0) {
    return <Text style={[styles.newText, { fontSize: size }]}>{t('perks.rating.new')}</Text>
  }

  return (
    <View style={[styles.row, dir.row]}>
      <Star size={size + 2} color={colors.sand} weight="fill" />
      <Text style={[styles.rating, { fontSize: size }]}>{rating.toFixed(1)}</Text>
      <Text style={[styles.count, { fontSize: size }]}>({count})</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  row: { alignItems: 'center', gap: 3 },
  rating: { color: colors.text, fontFamily: font.bold },
  count: { color: colors.muted, fontFamily: font.regular },
  newText: { color: colors.muted, fontFamily: font.medium }
})
