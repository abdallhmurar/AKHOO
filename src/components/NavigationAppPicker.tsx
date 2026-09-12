import { useEffect, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { colors, font, radius, space } from '../lib/theme'
import { dirStyles, useIsRTL } from '../lib/direction'
import { getNavigationApp, setNavigationApp } from '../lib/navigationPreference'
import type { NavigationApp } from '../lib/contactLinks'
import { NavigationAppIcon } from './NavigationAppIcon'
import { Tactile } from './Tactile'

const options: { code: NavigationApp; labelKey: string }[] = [
  { code: 'google', labelKey: 'account.navigationApp.google' },
  { code: 'waze', labelKey: 'account.navigationApp.waze' }
]

export function NavigationAppPicker() {
  const { t } = useTranslation()
  const dir = dirStyles(useIsRTL())
  const [selected, setSelected] = useState<NavigationApp>('google')

  useEffect(() => {
    getNavigationApp().then(setSelected)
  }, [])

  async function select(app: NavigationApp) {
    setSelected(app)
    await setNavigationApp(app)
  }

  return (
    <View style={[styles.row, dir.row]}>
      {options.map(option => {
        const active = selected === option.code
        return (
          <Tactile key={option.code} onPress={() => select(option.code)} style={[styles.chip, dir.row, active && styles.chipActive]}>
            <NavigationAppIcon app={option.code} size={18} />
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{t(option.labelKey)}</Text>
          </Tactile>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  row: { gap: space.sm },
  chip: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.sageSoft, borderRadius: radius.pill, paddingVertical: 10 },
  chipActive: { backgroundColor: colors.forest },
  chipText: { color: colors.forest, fontFamily: font.bold, fontSize: 13 },
  chipTextActive: { color: '#fff' }
})
