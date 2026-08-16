import { StyleSheet, Text, View } from 'react-native'
import { colors } from '../lib/theme'

function scorePassword(password: string) {
  if (!password) return 0
  let score = 0
  if (password.length >= 6) score++
  if (password.length >= 10) score++
  if (/[0-9]/.test(password)) score++
  if (/[a-zA-Z]/.test(password) && /[A-Z]/.test(password)) score++
  if (/[^a-zA-Z0-9]/.test(password)) score++
  return Math.min(score, 4)
}

const levels = [
  { label: '', color: colors.border },
  { label: 'ضعيفة', color: colors.red },
  { label: 'مقبولة', color: '#F5A623' },
  { label: 'جيدة', color: colors.blue },
  { label: 'قوية', color: colors.green }
]

export function PasswordStrength({ password }: { password: string }) {
  if (!password) return null
  const score = scorePassword(password)
  const level = levels[score] ?? levels[0]!

  return (
    <View style={styles.wrap}>
      <View style={styles.track}>
        {[0, 1, 2, 3].map(i => (
          <View key={i} style={[styles.segment, { backgroundColor: i < score ? level.color : colors.border }]} />
        ))}
      </View>
      <Text style={[styles.label, { color: level.color }]}>{level.label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginTop: -4 },
  track: { flex: 1, flexDirection: 'row-reverse', gap: 4 },
  segment: { flex: 1, height: 5, borderRadius: 3 },
  label: { fontSize: 12, fontWeight: '800', minWidth: 44, textAlign: 'left' }
})
