import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native'
import { colors } from '../lib/theme'

export function PrimaryButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  tone = 'blue'
}: {
  title: string
  onPress: () => void
  loading?: boolean
  disabled?: boolean
  tone?: 'blue' | 'green' | 'light'
}) {
  const backgroundColor = tone === 'green' ? colors.green : tone === 'light' ? colors.blueSoft : colors.blue
  const textColor = tone === 'light' ? colors.blueDark : '#fff'

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [styles.button, { backgroundColor }, pressed && styles.pressed, (disabled || loading) && styles.disabled]}
    >
      {loading ? <ActivityIndicator color={textColor} /> : <Text style={[styles.text, { color: textColor }]}>{title}</Text>}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: { minHeight: 54, borderRadius: 17, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  text: { fontSize: 17, fontWeight: '800' },
  pressed: { opacity: 0.86, transform: [{ scale: 0.995 }] },
  disabled: { opacity: 0.5 }
})
