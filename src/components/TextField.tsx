import type { ReactNode } from 'react'
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native'
import { colors, font, radius, space } from '../lib/theme'

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
  return (
    <View style={[styles.wrap, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputRow, error && styles.inputRowError]}>
        <TextInput
          placeholderTextColor={colors.muted}
          style={styles.input}
          textAlign="right"
          {...inputProps}
        />
        {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { color: colors.muted, fontSize: 13, fontFamily: font.medium, textAlign: 'right' },
  inputRow: { flexDirection: 'row-reverse', alignItems: 'center', minHeight: 52, borderRadius: radius.sm, backgroundColor: colors.surfaceMuted, borderWidth: 1, borderColor: colors.border },
  inputRowError: { borderColor: colors.danger },
  input: { flex: 1, height: 52, paddingHorizontal: space.lg, color: colors.text, fontSize: 15, fontFamily: font.regular },
  trailing: { paddingHorizontal: space.md },
  error: { color: colors.danger, fontSize: 12, fontFamily: font.medium, textAlign: 'right' }
})
