import { Fragment, type ReactNode } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Check } from 'phosphor-react-native'
import { dirStyles, useIsRTL } from '../lib/direction'
import { radius, space, useSanadTheme } from '../lib/theme'
import { useAppTypography } from '../lib/typography'
import { Modal } from './ui'

export type ChoiceOption<T extends string> = { value: T; label: string; icon?: ReactNode }

// A single quick decision (e.g. navigation app) inside the app's standard
// centered Modal, rather than a whole pushed settings screen: a filled
// check-circle marks the current choice, and an optional trailing icon
// previews what picking that row does. Picking a row selects and closes.
export function ChoiceModal<T extends string>({
  visible,
  onClose,
  title,
  options,
  value,
  onSelect
}: {
  visible: boolean
  onClose: () => void
  title: string
  options: ChoiceOption<T>[]
  value: T
  onSelect: (value: T) => void
}) {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const textAlign = isRTL ? 'right' : 'left'

  return (
    <Modal visible={visible} onClose={onClose} title={title}>
      <View style={[styles.list, { borderColor: theme.colors.border }]}>
        {options.map((option, index) => {
          const selected = option.value === value
          return (
            <Fragment key={option.value}>
              {index > 0 ? <View style={[styles.divider, { backgroundColor: theme.colors.border }]} /> : null}
              <Pressable
                onPress={() => { onSelect(option.value); onClose() }}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                style={[styles.row, dirStyles(isRTL).row, { backgroundColor: selected ? theme.colors.primarySoft : 'transparent' }]}
              >
                <View style={[styles.radio, { borderColor: selected ? theme.colors.primary : theme.colors.borderStrong, backgroundColor: selected ? theme.colors.primary : 'transparent' }]}>
                  {selected ? <Check size={13} color={theme.colors.onPrimary} weight="bold" /> : null}
                </View>
                <Text style={[typography.bodyMedium, styles.label, { color: theme.colors.textPrimary, textAlign }]}>{option.label}</Text>
                {option.icon}
              </Pressable>
            </Fragment>
          )
        })}
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  list: { borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.lg, overflow: 'hidden' },
  divider: { height: StyleSheet.hairlineWidth },
  row: { alignItems: 'center', gap: space.md, paddingVertical: space.md, paddingHorizontal: space.md },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  label: { flex: 1 }
})
