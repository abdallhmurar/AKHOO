import { StyleSheet, Text, View } from 'react-native'
import { useIsRTL } from '../../lib/direction'
import { radius, space, useSanadTheme } from '../../lib/theme'
import { useAppTypography } from '../../lib/typography'

export function ProgressHeader({ step, total, label }: { step: number; total: number; label: string }) {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const progress = Math.min(1, Math.max(0, step / total))
  return (
    <View style={styles.wrap}>
      <View style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}><Text style={[typography.caption, { color: theme.colors.textSecondary }]}>{label}</Text><Text style={[typography.caption, { color: theme.colors.textMuted }]}>{step}/{total}</Text></View>
      <View style={[styles.track, { backgroundColor: theme.colors.surfaceStrong }]}><View style={[styles.fill, { backgroundColor: theme.colors.primary, width: `${progress * 100}%` }]} /></View>
    </View>
  )
}

const styles = StyleSheet.create({ wrap: { gap: space.sm }, row: { justifyContent: 'space-between' }, track: { height: 5, borderRadius: radius.pill, overflow: 'hidden' }, fill: { height: 5, borderRadius: radius.pill } })
