import { StyleSheet, Text, View } from 'react-native'
import { Sparkle } from 'phosphor-react-native'
import { useTranslation } from 'react-i18next'
import { colors, font, radius, shadow, space } from '../lib/theme'
import { dirStyles, useIsRTL } from '../lib/direction'
import { CURRENT_MARKET_FEATURES } from '../lib/market'
import { Tactile } from './Tactile'

// Only rendered where the market's own sanadPlus feature flag is on - no
// point marketing a membership that can't actually be purchased yet in this
// market (memberships.market currently only allows 'JO').
//
// Reference board takeaway (Offers/SANAD+, 21st Elite Plan Card): the paid
// tier gets its own dark "ink" surface distinct from forest-green, which
// every other hero element in the app already uses - so SANAD+ finally
// reads as a separate, premium tier instead of "forest card, but here too."
export function PlusHeroCard({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation()
  const dir = dirStyles(useIsRTL())

  if (!CURRENT_MARKET_FEATURES.sanadPlus) return null

  return (
    <Tactile onPress={onPress} style={styles.card} scaleTo={0.985}>
      <View style={[styles.row, dir.row]}>
        <View style={styles.iconWrap}>
          <Sparkle size={22} color={colors.sand} weight="fill" />
        </View>
        <View style={[styles.textWrap, dir.alignStart]}>
          <Text style={[styles.title, dir.textStart]}>{t('perks.hero.title')}</Text>
          <Text style={[styles.subtitle, dir.textStart]} numberOfLines={2}>{t('perks.hero.subtitle')}</Text>
        </View>
      </View>
      <View style={styles.ctaWrap}>
        <Text style={styles.cta}>{t('perks.hero.cta')}</Text>
      </View>
    </Tactile>
  )
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.ink, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.inkBorder, padding: space.lg, ...shadow.elevated },
  row: { alignItems: 'center', gap: space.md },
  iconWrap: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.inkElevated, alignItems: 'center', justifyContent: 'center' },
  textWrap: { flex: 1 },
  title: { color: colors.inkText, fontFamily: font.extraBold, fontSize: 17 },
  subtitle: { color: colors.inkMuted, fontFamily: font.regular, fontSize: 12.5, lineHeight: 18, marginTop: 2 },
  ctaWrap: { alignSelf: 'flex-start', backgroundColor: colors.inkElevated, borderRadius: radius.pill, paddingVertical: 7, paddingHorizontal: space.md, marginTop: space.md },
  cta: { color: colors.sand, fontFamily: font.bold, fontSize: 12.5 }
})
