import { ActivityIndicator, StyleSheet, Text, ViewStyle } from 'react-native'
import { colors, font, radius } from '../lib/theme'
import { Tactile } from './Tactile'

export function PrimaryButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  tone = 'forest',
  style
}: {
  title: string
  onPress: () => void
  loading?: boolean
  disabled?: boolean
  tone?: 'forest' | 'sage' | 'light' | 'red' | 'blue' | 'green'
  style?: ViewStyle
}) {
  const backgroundColor =
    tone === 'sage' || tone === 'green' ? colors.forest :
    tone === 'red' ? colors.dangerSoft :
    tone === 'light' ? colors.sageSoft :
    colors.forest
  const textColor = tone === 'red' ? colors.danger : tone === 'light' ? colors.forest : '#fff'

  return (
    <Tactile onPress={disabled || loading ? () => {} : onPress} style={[styles.button, { backgroundColor }, style, (disabled || loading) && styles.disabled]}>
      {loading ? <ActivityIndicator color={textColor} /> : <Text style={[styles.text, { color: textColor }]}>{title}</Text>}
    </Tactile>
  )
}

const styles = StyleSheet.create({
  button: { minHeight: 54, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  text: { fontSize: 16, fontFamily: font.bold },
  disabled: { opacity: 0.5 }
})
