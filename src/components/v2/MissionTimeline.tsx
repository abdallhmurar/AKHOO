import { StyleSheet, Text, View } from 'react-native'
import { Check, CircleIcon } from 'phosphor-react-native'
import { dirStyles, useIsRTL } from '../../lib/direction'
import { radius, space, useSanadTheme } from '../../lib/theme'
import { useAppTypography } from '../../lib/typography'

export type TimelineStep = { key: string; label: string; detail?: string }

export function MissionTimeline({ steps, activeIndex }: { steps: TimelineStep[]; activeIndex: number }) {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  return <View>{steps.map((step, index) => {
    const done = index < activeIndex
    const active = index === activeIndex
    const color = done || active ? theme.colors.primary : theme.colors.borderStrong
    return (
      <View key={step.key} style={[styles.row, dirStyles(isRTL).row]}>
        <View style={styles.rail}>
          <View style={[styles.node, { backgroundColor: done || active ? color : theme.colors.surface, borderColor: color }]}>{done ? <Check size={13} color={theme.colors.onPrimary} weight="bold" /> : active ? <CircleIcon size={8} color={theme.colors.onPrimary} weight="fill" /> : null}</View>
          {index < steps.length - 1 ? <View style={[styles.line, { backgroundColor: done ? theme.colors.primary : theme.colors.border }]} /> : null}
        </View>
        <View style={styles.copy}><Text style={[typography.smallMedium, { color: active ? theme.colors.primary : done ? theme.colors.textPrimary : theme.colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>{step.label}</Text>{step.detail ? <Text style={[typography.caption, { color: theme.colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>{step.detail}</Text> : null}</View>
      </View>
    )
  })}</View>
}

const styles = StyleSheet.create({ row: { minHeight: 62, gap: space.md }, rail: { width: 28, alignItems: 'center' }, node: { width: 26, height: 26, borderRadius: radius.pill, borderWidth: 2, alignItems: 'center', justifyContent: 'center' }, line: { width: 2, flex: 1, marginVertical: 3 }, copy: { flex: 1, paddingTop: 3, gap: 2 } })
