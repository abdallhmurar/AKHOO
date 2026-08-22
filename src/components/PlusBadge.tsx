import { StyleSheet, Text, View } from 'react-native'
import { Sparkle } from 'phosphor-react-native'
import { useTranslation } from 'react-i18next'
import { colors, font, radius } from '../lib/theme'
import { dirStyles, useIsRTL } from '../lib/direction'

export function PlusBadge({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  const { t } = useTranslation()
  const dir = dirStyles(useIsRTL())
  const md = size === 'md'

  return (
    <View style={[styles.badge, dir.row, md && styles.badgeMd]}>
      <Sparkle size={md ? 13 : 10} color={colors.sand} weight="fill" />
      <Text style={[styles.text, md && styles.textMd]}>{t('perks.plusBadge')}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', alignItems: 'center', gap: 3, backgroundColor: colors.forest, borderRadius: radius.pill, paddingVertical: 3, paddingHorizontal: 7 },
  badgeMd: { paddingVertical: 5, paddingHorizontal: 10 },
  text: { color: colors.sand, fontFamily: font.extraBold, fontSize: 9.5, letterSpacing: 0.5 },
  textMd: { fontSize: 11 }
})
