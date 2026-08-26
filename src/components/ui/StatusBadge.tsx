import { StyleSheet, Text, View } from 'react-native'
import { radius, space, useSanadTheme } from '../../lib/theme'
import { useAppTypography } from '../../lib/typography'

export type StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'reward'

export function StatusBadge({ label, tone = 'neutral', dot = false }: { label: string; tone?: StatusTone; dot?: boolean }) {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const fills = { neutral: theme.colors.surfaceMuted, info: theme.colors.infoSoft, success: theme.colors.successSoft, warning: theme.colors.warningSoft, danger: theme.colors.dangerSoft, reward: theme.colors.rewardSoft }
  const inks = { neutral: theme.colors.textSecondary, info: theme.colors.info, success: theme.colors.success, warning: theme.colors.rewardPressed, danger: theme.colors.danger, reward: theme.colors.rewardPressed }
  return (
    <View accessibilityRole="text" style={[styles.badge, { backgroundColor: fills[tone] }]}>
      {dot ? <View style={[styles.dot, { backgroundColor: inks[tone] }]} /> : null}
      <Text style={[typography.caption, { color: inks[tone] }]}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({ badge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: radius.pill, paddingHorizontal: space.md, paddingVertical: 6 }, dot: { width: 7, height: 7, borderRadius: 4 } })
