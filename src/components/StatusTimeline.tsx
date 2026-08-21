import { Fragment } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Check } from 'phosphor-react-native'
import { colors, font, radius } from '../lib/theme'
import { dirStyles, useIsRTL } from '../lib/direction'

// A mission's progress read as a journey, not an administrative checklist
// (design brief section 22). Steps behind the current one show a
// checkmark, the current step is the only emphasized outline, steps ahead
// stay quiet. Dots/connecting-lines and labels are two separate rows -
// nesting a line inside each step's own column made the segments
// misalign with the next step's dot, since each dot centers within its
// own flex column rather than sitting at a shared fixed offset.
export function StatusTimeline({ steps, currentIndex }: { steps: { key: string; label: string }[]; currentIndex: number }) {
  const dir = dirStyles(useIsRTL())
  return (
    <View>
      <View style={[styles.dotsRow, dir.row]}>
        {steps.map((step, index) => {
          const done = index < currentIndex
          const current = index === currentIndex
          return (
            <Fragment key={step.key}>
              <View style={[styles.dot, done && styles.dotDone, current && styles.dotCurrent]}>
                {done ? <Check size={11} color="#fff" weight="bold" /> : null}
              </View>
              {index < steps.length - 1 ? <View style={[styles.line, done && styles.lineDone]} /> : null}
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
  dotsRow: { alignItems: 'center' },
  dot: { width: 22, height: 22, borderRadius: radius.pill, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  dotDone: { backgroundColor: colors.forest, borderColor: colors.forest },
  dotCurrent: { borderColor: colors.forest, borderWidth: 3 },
  line: { flex: 1, height: 2, backgroundColor: colors.border, marginHorizontal: 2 },
  lineDone: { backgroundColor: colors.forest },
  labelsRow: { marginTop: 6 },
  label: { flex: 1, color: colors.muted, fontFamily: font.medium, fontSize: 11, textAlign: 'center' },
  labelCurrent: { color: colors.forest, fontFamily: font.bold }
})
