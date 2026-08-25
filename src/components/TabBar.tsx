import { useEffect, useRef } from 'react'
import { Animated, StyleSheet, Text, View } from 'react-native'
import { ClockCounterClockwise, House, Storefront, UserCircle } from 'phosphor-react-native'
import { useTranslation } from 'react-i18next'
import { colors, font, radius, shadow, space, spring } from '../lib/theme'
import { dirStyles, useIsRTL } from '../lib/direction'
import { Tactile } from './Tactile'

export type MainTab = 'home' | 'perks' | 'activity' | 'account'

const tabs: { key: MainTab; labelKey: string; Icon: typeof House }[] = [
  { key: 'home', labelKey: 'navigation.home', Icon: House },
  { key: 'perks', labelKey: 'navigation.perks', Icon: Storefront },
  { key: 'activity', labelKey: 'navigation.activity', Icon: ClockCounterClockwise },
  { key: 'account', labelKey: 'navigation.account', Icon: UserCircle }
]

// Floating inset pill. Every tab always keeps its label - a consumer app
// used "under stress" (design brief) should never make someone guess what
// an icon means.
//
// MCP source: ported from 21st.dev "Bottom Nav Bar" (arunachalam0606, id
// 8343) - ACTUAL SOURCE FETCHED via get_component. Taken from its real
// code: the pill container (`rounded-full`, bordered, `p-2`, one shadow)
// and, concretely, its active-tab treatment is a SOFT TINT
// (`bg-primary/10`) with tinted icon/label, not a solid fill - ported here
// as sageSoft-tinted background with forest icon/label, replacing an
// earlier round's solid forest capsule. Also ported: the bar's own
// mount-in spring (Framer Motion `initial scale:0.9/opacity:0 -> animate
// scale:1/opacity:1`) via RN Animated, and the exact `whileTap` press
// scale (0.97) on each tab. NOT ported: the source's per-tab
// show-label-only-when-active animation - SANAD's own usability
// requirement (labels always visible) overrides that.
export function TabBar({ active, onChange }: { active: MainTab; onChange: (tab: MainTab) => void }) {
  const { t } = useTranslation()
  const dir = dirStyles(useIsRTL())
  const mount = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.spring(mount, { toValue: 1, ...spring.soft }).start()
  }, [mount])

  const scale = mount.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] })

  return (
    <View style={styles.wrap}>
      <Animated.View style={[styles.pill, dir.row, { opacity: mount, transform: [{ scale }] }]}>
        {tabs.map(tab => {
          const isActive = tab.key === active
          return (
            <Tactile key={tab.key} onPress={() => onChange(tab.key)} style={[styles.tab, isActive && styles.tabActive]} scaleTo={0.97}>
              <tab.Icon size={19} color={isActive ? colors.forest : colors.muted} weight={isActive ? 'fill' : 'regular'} />
              <Text style={[styles.label, isActive && styles.labelActive]} numberOfLines={1}>{t(tab.labelKey)}</Text>
            </Tactile>
          )
        })}
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: colors.bg, paddingHorizontal: space.md, paddingTop: space.sm, paddingBottom: space.lg },
  pill: { backgroundColor: colors.surface, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, padding: 6, alignItems: 'center', ...shadow.floating },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, paddingVertical: 8, borderRadius: radius.pill },
  tabActive: { backgroundColor: colors.sageSoft },
  label: { fontSize: 10.5, fontFamily: font.medium, color: colors.muted },
  labelActive: { color: colors.forest, fontFamily: font.bold }
})
