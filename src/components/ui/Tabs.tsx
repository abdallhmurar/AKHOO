import { Pressable, StyleSheet, Text, View } from 'react-native'
import { dirStyles, useIsRTL } from '../../lib/direction'
import { radius, space, useSanadTheme } from '../../lib/theme'
import { useAppTypography } from '../../lib/typography'

export type TabOption<T extends string> = { value: T; label: string }

export function Tabs<T extends string>({ value, options, onChange, label, appearance = 'default' }: { value: T; options: readonly TabOption<T>[]; onChange: (value: T) => void; label?: string; appearance?: 'default' | 'pill' }) {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  return (
    <View accessibilityRole="tablist" accessibilityLabel={label} style={[styles.wrap, appearance === 'pill' && { borderRadius: radius.pill }, { backgroundColor: appearance === 'pill' ? theme.colors.surface : theme.colors.surfaceMuted, borderColor: theme.colors.border, ...dirStyles(isRTL).row }]}>
      {options.map(option => {
        const selected = option.value === value
        return (
          <Pressable key={option.value} accessibilityRole="tab" accessibilityState={{ selected }} onPress={() => onChange(option.value)} style={[styles.tab, appearance === 'pill' && { minHeight: 44, borderRadius: radius.pill, backgroundColor: theme.colors.background }, selected && { backgroundColor: appearance === 'pill' ? theme.colors.primary : theme.colors.community }]}>
            <Text style={[typography.smallMedium, { color: selected ? theme.colors.onCommunity : theme.colors.textMuted }]}>{option.label}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({ wrap: { padding: 4, borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, gap: 3 }, tab: { flex: 1, minHeight: 38, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.sm } })
