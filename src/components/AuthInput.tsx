import type { ReactNode, ComponentType } from 'react'
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native'
import type { IconProps } from 'phosphor-react-native'
import { colors, font, radius, space } from '../lib/theme'
import { dirStyles, useIsRTL } from '../lib/direction'

// Auth V2 field - a leading-icon pill with placeholder text and no separate
// label row, matching the reference's field anatomy/density (SANAD's other
// screens keep their own labeled TextField untouched; this is Auth-only).
export function AuthInput({
  Icon,
  error,
  trailing,
  containerStyle,
  ...inputProps
}: {
  Icon: ComponentType<IconProps>
  error?: string
  trailing?: ReactNode
  containerStyle?: object
} & TextInputProps) {
  const isRTL = useIsRTL()
  const dir = dirStyles(isRTL)

  return (
    <View style={containerStyle}>
      <View style={[styles.row, dir.row, error && styles.rowError]}>
        <Icon size={19} color={colors.muted} />
        <TextInput
          placeholderTextColor={colors.muted}
          style={styles.input}
          textAlign={isRTL ? 'right' : 'left'}
          {...inputProps}
        />
        {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
      </View>
      {error ? <Text style={[styles.error, dir.textStart]}>{error}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  row: { alignItems: 'center', gap: space.md, minHeight: 56, borderRadius: radius.lg, backgroundColor: colors.surfaceMuted, borderWidth: 1, borderColor: 'transparent', paddingHorizontal: space.lg },
  rowError: { borderColor: colors.danger },
  input: { flex: 1, height: 56, color: colors.text, fontSize: 15, fontFamily: font.regular },
  trailing: { paddingStart: space.sm },
  error: { color: colors.danger, fontSize: 12, fontFamily: font.medium, marginTop: 6 }
})
