import { StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { colors, font, radius, space } from '../lib/theme'
import { dirStyles, useIsRTL } from '../lib/direction'
import { setAppLanguage } from '../lib/i18n'
import type { AppLanguage } from '../lib/i18n'
import { Tactile } from './Tactile'

const options: { code: AppLanguage; label: string }[] = [
  { code: 'ar', label: 'العربية' },
  { code: 'he', label: 'עברית' },
  { code: 'en', label: 'English' }
]

export function LanguagePicker() {
  const { i18n } = useTranslation()
  const dir = dirStyles(useIsRTL())

  return (
    <View style={[styles.row, dir.row]}>
      {options.map(option => {
        const active = i18n.language === option.code
        return (
          <Tactile key={option.code} onPress={() => setAppLanguage(option.code)} style={[styles.chip, active && styles.chipActive]}>
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{option.label}</Text>
          </Tactile>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  row: { gap: space.sm },
  chip: { flex: 1, alignItems: 'center', backgroundColor: colors.sageSoft, borderRadius: radius.pill, paddingVertical: 10 },
  chipActive: { backgroundColor: colors.forest },
  chipText: { color: colors.forest, fontFamily: font.bold, fontSize: 13 },
  chipTextActive: { color: '#fff' }
})
