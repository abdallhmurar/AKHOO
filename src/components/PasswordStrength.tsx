import { StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { colors, font } from '../lib/theme'
import { dirStyles, useIsRTL } from '../lib/direction'

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

const levelKeys = ['', 'weak', 'fair', 'good', 'strong'] as const
const levelColors = [colors.border, colors.danger, colors.warning, colors.sage, colors.success]

export function PasswordStrength({ password }: { password: string }) {
  const { t } = useTranslation()
  const isRTL = useIsRTL()
  const dir = dirStyles(isRTL)
  if (!password) return null
  const score = scorePassword(password)
  const color = levelColors[score] ?? levelColors[0]!
  const label = score === 0 ? '' : t(`auth.passwordStrength.${levelKeys[score]}`)

  return (
    <View style={[styles.wrap, dir.row]}>
      <View style={[styles.track, dir.row]}>
        {[0, 1, 2, 3].map(i => (
          <View key={i} style={[styles.segment, { backgroundColor: i < score ? color : colors.border }]} />
        ))}
      </View>
      <Text style={[styles.label, dir.textEnd, { color }]}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 8, marginTop: -4 },
  track: { flex: 1, gap: 4 },
  segment: { flex: 1, height: 5, borderRadius: 3 },
  label: { fontSize: 12, fontFamily: font.bold, minWidth: 44 }
})
