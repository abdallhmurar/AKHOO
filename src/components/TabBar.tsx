import { StyleSheet, Text, View } from 'react-native'
import { ClockCounterClockwise, House, Storefront, UserCircle } from 'phosphor-react-native'
import { colors, font, space } from '../lib/theme'
import { Tactile } from './Tactile'

export type MainTab = 'home' | 'perks' | 'activity' | 'account'

const tabs: { key: MainTab; label: string; Icon: typeof House }[] = [
  { key: 'home', label: 'الرئيسية', Icon: House },
  { key: 'perks', label: 'مزايا سَنَد', Icon: Storefront },
  { key: 'activity', label: 'نشاطي', Icon: ClockCounterClockwise },
  { key: 'account', label: 'حسابي', Icon: UserCircle }
]

export function TabBar({ active, onChange }: { active: MainTab; onChange: (tab: MainTab) => void }) {
  return (
    <View style={styles.wrap}>
      {tabs.map(tab => {
        const isActive = tab.key === active
        return (
          <Tactile key={tab.key} onPress={() => onChange(tab.key)} style={styles.tab} scaleTo={0.92}>
            <tab.Icon size={22} color={isActive ? colors.forest : colors.muted} weight={isActive ? 'fill' : 'regular'} />
            <Text style={[styles.label, isActive && styles.labelActive]}>{tab.label}</Text>
          </Tactile>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row-reverse',
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
