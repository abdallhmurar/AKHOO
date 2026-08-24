import { StyleSheet, Text, View } from 'react-native'
import { ClockCounterClockwise, House, Storefront, UserCircle } from 'phosphor-react-native'
import { useTranslation } from 'react-i18next'
import { colors, font, radius, shadow, space } from '../lib/theme'
import { dirStyles, useIsRTL } from '../lib/direction'
import { Tactile } from './Tactile'

export type MainTab = 'home' | 'perks' | 'activity' | 'account'

const tabs: { key: MainTab; labelKey: string; Icon: typeof House }[] = [
  { key: 'home', labelKey: 'navigation.home', Icon: House },
  { key: 'perks', labelKey: 'navigation.perks', Icon: Storefront },
  { key: 'activity', labelKey: 'navigation.activity', Icon: ClockCounterClockwise },
  { key: 'account', labelKey: 'navigation.account', Icon: UserCircle }
]

// Floating inset pill (reference board: Floating Capture Tab Bar UI / 21st
// Bottom Nav Bar + Tubelight Navbar's active-fill idea). Every tab always
// keeps its label - a consumer app used "under stress" (design brief)
// should never make someone guess what an icon means - only the active
// tab gets the filled capsule + bold label; this is still a plain flex
// sibling of the tab content, not absolutely positioned, so no screen's
// own bottom padding has to change.
export function TabBar({ active, onChange }: { active: MainTab; onChange: (tab: MainTab) => void }) {
  const { t } = useTranslation()
  const dir = dirStyles(useIsRTL())

  return (
    <View style={styles.wrap}>
      <View style={[styles.pill, dir.row]}>
        {tabs.map(tab => {
          const isActive = tab.key === active
          return (
            <Tactile key={tab.key} onPress={() => onChange(tab.key)} style={[styles.tab, isActive && styles.tabActive]} scaleTo={0.94}>
              <tab.Icon size={19} color={isActive ? '#fff' : colors.muted} weight={isActive ? 'fill' : 'regular'} />
              <Text style={[styles.label, isActive && styles.labelActive]} numberOfLines={1}>{t(tab.labelKey)}</Text>
            </Tactile>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: colors.bg, paddingHorizontal: space.md, paddingTop: space.sm, paddingBottom: space.lg },
  pill: { backgroundColor: colors.surface, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, padding: 6, alignItems: 'center', ...shadow.floating },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, paddingVertical: 8, borderRadius: radius.pill },
  tabActive: { backgroundColor: colors.forest },
  label: { fontSize: 10.5, fontFamily: font.medium, color: colors.muted },
  labelActive: { color: '#fff', fontFamily: font.bold }
})
