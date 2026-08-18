import type { ReactNode } from 'react'
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native'
import { colors, font, radius, space } from '../lib/theme'
import { dirStyles, useIsRTL } from '../lib/direction'

export function TextField({
  label,
  error,
  trailing,
  containerStyle,
  ...inputProps
}: {
  label: string
  error?: string
  trailing?: ReactNode
  containerStyle?: object
} & TextInputProps) {
  const isRTL = useIsRTL()
  const dir = dirStyles(isRTL)

  return (
    <View style={[styles.wrap, containerStyle]}>
      <Text style={[styles.label, dir.textStart]}>{label}</Text>
      <View style={[styles.inputRow, dir.row, error && styles.inputRowError]}>
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
  wrap: { gap: 6 },
  label: { color: colors.muted, fontSize: 13, fontFamily: font.medium },
  inputRow: { alignItems: 'center', minHeight: 52, borderRadius: radius.sm, backgroundColor: colors.surfaceMuted, borderWidth: 1, borderColor: colors.border },
  inputRowError: { borderColor: colors.danger },
  input: { flex: 1, height: 52, paddingHorizontal: space.lg, color: colors.text, fontSize: 15, fontFamily: font.regular },
  trailing: { paddingHorizontal: space.md },
  error: { color: colors.danger, fontSize: 12, fontFamily: font.medium }
})
