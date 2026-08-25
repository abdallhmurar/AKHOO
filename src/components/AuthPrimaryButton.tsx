import { ActivityIndicator, StyleSheet, Text } from 'react-native'
import { colors, font, radius } from '../lib/theme'
import { Tactile } from './Tactile'

// Auth V2's own CTA - fully rounded pill matching the reference's button
// proportions (SANAD's shared PrimaryButton elsewhere keeps its own
// radius.sm shape; this is Auth-only, not a global button restyle).
export function AuthPrimaryButton({ title, onPress, loading = false, disabled = false }: { title: string; onPress: () => void; loading?: boolean; disabled?: boolean }) {
  return (
    <Tactile onPress={disabled || loading ? () => {} : onPress} style={[styles.button, (disabled || loading) && styles.disabled]}>
      {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.text}>{title}</Text>}
    </Tactile>
  )
}

const styles = StyleSheet.create({
  button: { minHeight: 56, borderRadius: radius.pill, backgroundColor: colors.forest, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  text: { color: '#fff', fontSize: 16, fontFamily: font.bold },
  disabled: { opacity: 0.5 }
})
