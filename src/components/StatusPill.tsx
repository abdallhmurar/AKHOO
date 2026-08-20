import { StyleSheet, Text, View } from 'react-native'
import { colors, font, radius, space } from '../lib/theme'
import { dirStyles, useIsRTL } from '../lib/direction'

// Small live/status indicator - a colored dot + label. Used anywhere the UI
// needs to say "this is happening right now" without a full banner.
export function StatusPill({ label, tone = 'success', pulse = false }: { label: string; tone?: 'success' | 'info' | 'warning' | 'brand'; pulse?: boolean }) {
  const dir = dirStyles(useIsRTL())
  return (
    <View style={[styles.pill, dir.row, toneStyles[tone].pill]}>
      <View style={[styles.dot, toneStyles[tone].dot, pulse && styles.dotPulse]} />
      <Text style={[styles.label, toneStyles[tone].label]} numberOfLines={1}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  pill: { alignSelf: 'flex-start', alignItems: 'center', gap: 6, borderRadius: radius.pill, paddingVertical: 6, paddingHorizontal: space.md },
  dot: { width: 7, height: 7, borderRadius: 4 },
  dotPulse: { shadowColor: colors.success, shadowOpacity: 0.6, shadowRadius: 4, shadowOffset: { width: 0, height: 0 } },
  label: { fontFamily: font.bold, fontSize: 12.5 }
})

const toneStyles = {
  success: StyleSheet.create({ pill: { backgroundColor: colors.successSoft }, dot: { backgroundColor: colors.success }, label: { color: colors.success } }),
  info: StyleSheet.create({ pill: { backgroundColor: colors.infoSoft }, dot: { backgroundColor: colors.info }, label: { color: colors.info } }),
  warning: StyleSheet.create({ pill: { backgroundColor: colors.warningSoft }, dot: { backgroundColor: colors.warning }, label: { color: colors.warning } }),
  brand: StyleSheet.create({ pill: { backgroundColor: colors.sageSoft }, dot: { backgroundColor: colors.forest }, label: { color: colors.forest } })
}
