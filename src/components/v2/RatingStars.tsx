import { Pressable, StyleSheet, View } from 'react-native'
import { Star } from 'phosphor-react-native'
import { space, useSanadTheme } from '../../lib/theme'

export function RatingStars({ value, onChange, size = 34 }: { value: number; onChange?: (value: number) => void; size?: number }) {
  const theme = useSanadTheme()
  return <View accessibilityRole="radiogroup" style={styles.row}>{[1, 2, 3, 4, 5].map(score => <Pressable key={score} accessibilityRole="radio" accessibilityLabel={`${score} stars`} accessibilityState={{ checked: value === score }} disabled={!onChange} onPress={() => onChange?.(score)} hitSlop={6}><Star size={size} color={score <= value ? theme.colors.reward : theme.colors.borderStrong} weight={score <= value ? 'fill' : 'regular'} /></Pressable>)}</View>
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm } })
