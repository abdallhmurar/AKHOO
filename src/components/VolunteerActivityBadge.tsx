import { StyleSheet, Text, View } from 'react-native'
import { Star } from 'phosphor-react-native'
import { useTranslation } from 'react-i18next'
import { font } from '../lib/theme'
import { dirStyles, useIsRTL } from '../lib/direction'
import { getVolunteerActivityLevel, ACTIVITY_LEVEL_COLORS, ACTIVITY_LEVEL_LABEL_KEYS } from '../lib/activityLevel'

// The star means only "this person has really helped people through
// SANAD" - never render it next to certification-sounding language.
export function VolunteerActivityBadge({
  completedCount,
  compact = true,
  showLabel = false
}: {
  completedCount: number
  compact?: boolean
  showLabel?: boolean
}) {
  const { t } = useTranslation()
  const dir = dirStyles(useIsRTL())
  const level = getVolunteerActivityLevel(completedCount)

  if (level === 'none') return null

  const color = ACTIVITY_LEVEL_COLORS[level]
  const size = compact ? 14 : 18

  if (!showLabel) {
    return <Star size={size} color={color} weight="fill" />
  }

  return (
    <View style={[styles.row, dir.row]}>
      <Star size={size} color={color} weight="fill" />
      <Text style={[styles.label, { color }]}>{t(ACTIVITY_LEVEL_LABEL_KEYS[level])}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  row: { alignItems: 'center', gap: 4 },
  label: { fontFamily: font.bold, fontSize: 13 }
})
