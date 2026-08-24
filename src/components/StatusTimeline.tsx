import { Fragment } from 'react'
import type { ComponentType } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Check } from 'phosphor-react-native'
import type { IconProps } from 'phosphor-react-native'
import { colors, font, radius, shadow } from '../lib/theme'
import { dirStyles, useIsRTL } from '../lib/direction'

// Horizontal segmented tracker with icon nodes (reference board: 21st.dev
// Order Status Tracker / Order Tracking Parallax Card - "compact horizontal
// progression + state emphasis") - replaces the previous thin-line dot
// timeline. Done steps show a checkmark, the current step shows its own
// icon on a filled node with a visible ring so "you are here" reads at a
// glance, upcoming steps preview their own icon outlined and muted instead
// of a plain empty dot.
export function StatusTimeline({
  steps,
  currentIndex,
  icons
}: {
  steps: { key: string; label: string }[]
  currentIndex: number
  icons?: Record<string, ComponentType<IconProps>>
}) {
  const dir = dirStyles(useIsRTL())
  return (
    <View>
      <View style={[styles.nodesRow, dir.row]}>
        {steps.map((step, index) => {
          const done = index < currentIndex
          const current = index === currentIndex
          const StepIcon = icons?.[step.key] ?? Check
          const Icon = done ? Check : StepIcon
          return (
            <Fragment key={step.key}>
              <View style={[styles.node, done && styles.nodeDone, current && styles.nodeCurrent]}>
                <Icon size={13} color={done || current ? '#fff' : colors.muted} weight={done || current ? 'fill' : 'regular'} />
              </View>
              {index < steps.length - 1 ? <View style={[styles.track, done && styles.trackDone]} /> : null}
            </Fragment>
          )
        })}
      </View>
      <View style={[styles.labelsRow, dir.row]}>
        {steps.map((step, index) => (
          <Text key={step.key} style={[styles.label, index === currentIndex && styles.labelCurrent]} numberOfLines={2}>{step.label}</Text>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  nodesRow: { alignItems: 'center' },
  node: { width: 28, height: 28, borderRadius: radius.pill, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  nodeDone: { backgroundColor: colors.forest, borderColor: colors.forest },
  nodeCurrent: { backgroundColor: colors.forest, borderColor: colors.surface, borderWidth: 3, ...shadow.floating },
  track: { flex: 1, height: 3, borderRadius: 2, backgroundColor: colors.border, marginHorizontal: 3 },
  trackDone: { backgroundColor: colors.forest },
  labelsRow: { marginTop: 8 },
  label: { flex: 1, color: colors.muted, fontFamily: font.medium, fontSize: 10.5, textAlign: 'center' },
  labelCurrent: { color: colors.text, fontFamily: font.bold }
})
