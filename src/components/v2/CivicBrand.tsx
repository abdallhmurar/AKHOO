import { StyleSheet, Text, View } from 'react-native'
import { Broadcast, MapPin } from 'phosphor-react-native'
import { useIsRTL } from '../../lib/direction'
import { palette, radius, space, useSanadTheme } from '../../lib/theme'
import { useAppTypography } from '../../lib/typography'
import { useV2Text } from '../../features/v2Copy'

export function CivicMark({ size = 54, inverse = false }: { size?: number; inverse?: boolean }) {
  const theme = useSanadTheme()
  return (
    <View style={[styles.mark, { width: size, height: size, borderRadius: size * 0.31, backgroundColor: inverse ? palette.onCivic : theme.colors.textPrimary }]}>
      <Broadcast size={size * 0.54} color={inverse ? theme.colors.primary : palette.onCivic} weight="duotone" />
    </View>
  )
}

export function CivicWordmark({ compact = false, inverse = false }: { compact?: boolean; inverse?: boolean }) {
  const t = useV2Text()
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  return (
    <View style={[styles.wordmark, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
      <CivicMark size={compact ? 38 : 50} inverse={inverse} />
      <View style={styles.wordCopy}>
        <Text style={[compact ? typography.h3 : typography.h2, { color: inverse ? palette.onCivic : theme.colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{t('brand.name')}</Text>
        {!compact ? <Text style={[typography.caption, { color: inverse ? palette.onCivicMuted : theme.colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{t('brand.promise')}</Text> : null}
      </View>
    </View>
  )
}

export function JerusalemSignal() {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  return <View style={[styles.city, { backgroundColor: theme.colors.communitySoft }]}><MapPin size={14} color={theme.colors.community} weight="fill" /><Text style={[typography.caption, { color: theme.colors.community }]}>Jerusalem · القدس · ירושלים</Text></View>
}

const styles = StyleSheet.create({
  mark: { alignItems: 'center', justifyContent: 'center' },
  wordmark: { alignItems: 'center', gap: space.md },
  wordCopy: { gap: 1 },
  city: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', borderRadius: radius.pill, paddingHorizontal: space.md, paddingVertical: 6 }
})
