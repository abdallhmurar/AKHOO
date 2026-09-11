import { useEffect, useRef } from 'react'
import { Animated, Easing, StyleSheet, Text, View } from 'react-native'
import { Check } from 'phosphor-react-native'
import type { Icon } from 'phosphor-react-native'
import { useIsRTL } from '../../lib/direction'
import { shadow, useSanadTheme } from '../../lib/theme'
import { useAppTypography } from '../../lib/typography'

export type TimelineStep = { key: string; label: string; detail?: string; Icon?: Icon }

// Horizontal row of icon nodes connected by a line - done steps get a
// checkmark, the active one gets a soft pulsing glow (plain Animated API,
// same native-driver-friendly convention as SearchingCard/useStaggeredReveal
// elsewhere in this app), upcoming ones stay a plain outline.
export function MissionTimeline({ steps, activeIndex }: { steps: TimelineStep[]; activeIndex: number }) {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const pulse = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 1400, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: 0, useNativeDriver: true })
    ]))
    loop.start()
    return () => loop.stop()
  }, [pulse])

  const glowStyle = {
    opacity: pulse.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0.45, 0.15, 0] }),
    transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.7] }) }]
  }

  return (
    <View style={[styles.row, isRTL && styles.rowRTL]}>
      {steps.map((step, index) => {
        const done = index < activeIndex
        const active = index === activeIndex
        const StepIcon = step.Icon
        return (
          <View key={step.key} style={styles.item}>
            <View style={styles.nodeRow}>
              {index > 0 ? <View style={[styles.line, { backgroundColor: index <= activeIndex ? theme.colors.community : theme.colors.border }]} /> : <View style={styles.lineStub} />}
              <View style={styles.nodeWrap}>
                {active ? <Animated.View style={[styles.glow, { backgroundColor: theme.colors.primary }, glowStyle]} /> : null}
                <View style={[styles.node, active ? shadow.soft : undefined, { backgroundColor: done ? theme.colors.community : active ? theme.colors.primary : theme.colors.surface, borderColor: done ? theme.colors.community : active ? theme.colors.primary : theme.colors.border }]}>
                  {done ? <Check size={16} color={theme.colors.onCommunity} weight="bold" /> : StepIcon ? <StepIcon size={15} color={active ? theme.colors.onPrimary : theme.colors.textMuted} weight={active ? 'fill' : 'regular'} /> : null}
                </View>
              </View>
              {index < steps.length - 1 ? <View style={[styles.line, { backgroundColor: index < activeIndex ? theme.colors.community : theme.colors.border }]} /> : <View style={styles.lineStub} />}
            </View>
            <Text numberOfLines={2} style={[typography.caption, styles.label, { color: active ? theme.colors.primary : done ? theme.colors.textPrimary : theme.colors.textMuted }]}>{step.label}</Text>
          </View>
        )
      })}
    </View>
  )
}

const NODE_SIZE = 36

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  rowRTL: { flexDirection: 'row-reverse' },
  item: { flex: 1, alignItems: 'center', gap: 6 },
  nodeRow: { flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch' },
  nodeWrap: { width: NODE_SIZE, height: NODE_SIZE, alignItems: 'center', justifyContent: 'center' },
  glow: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: NODE_SIZE / 2 },
  node: { width: NODE_SIZE, height: NODE_SIZE, borderRadius: NODE_SIZE / 2, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  line: { flex: 1, height: 2 },
  lineStub: { flex: 1 },
  label: { textAlign: 'center', paddingHorizontal: 2 }
})
