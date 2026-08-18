import { StyleSheet, Text, View } from 'react-native'
import { ClockCounterClockwise, House, Storefront, UserCircle } from 'phosphor-react-native'
import { useTranslation } from 'react-i18next'
import { colors, font, space } from '../lib/theme'
import { dirStyles, useIsRTL } from '../lib/direction'
import { Tactile } from './Tactile'

export type MainTab = 'home' | 'perks' | 'activity' | 'account'

const tabs: { key: MainTab; labelKey: string; Icon: typeof House }[] = [
  { key: 'home', labelKey: 'navigation.home', Icon: House },
  { key: 'perks', labelKey: 'navigation.perks', Icon: Storefront },
  { key: 'activity', labelKey: 'navigation.activity', Icon: ClockCounterClockwise },
  { key: 'account', labelKey: 'navigation.account', Icon: UserCircle }
]

export function TabBar({ active, onChange }: { active: MainTab; onChange: (tab: MainTab) => void }) {
  const { t } = useTranslation()
  const dir = dirStyles(useIsRTL())

  return (
    <View style={[styles.wrap, dir.row]}>
      {tabs.map(tab => {
        const isActive = tab.key === active
        return (
          <Tactile key={tab.key} onPress={() => onChange(tab.key)} style={styles.tab} scaleTo={0.92}>
            <tab.Icon size={22} color={isActive ? colors.forest : colors.muted} weight={isActive ? 'fill' : 'regular'} />
            <Text style={[styles.label, isActive && styles.labelActive]}>{t(tab.labelKey)}</Text>
          </Tactile>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: space.sm,
    paddingBottom: space.lg
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 4 },
  label: { fontSize: 11.5, fontFamily: font.medium, color: colors.muted },
  labelActive: { color: colors.forest, fontFamily: font.bold }
})
