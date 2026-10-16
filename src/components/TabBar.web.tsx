import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import Svg, { Circle, Path, Rect } from 'react-native-svg'
import * as Haptics from 'expo-haptics'
import type { BottomTabBarProps } from 'expo-router/js-tabs'
import { GuideTarget } from '../features/guide/GuideProvider'
import { dirStyles, useIsRTL } from '../lib/direction'
import { useAppFont } from '../lib/typography'
import { radius, space, useSanadTheme } from '../lib/theme'

// Keep the approved colorful dock on web; native continues to use TabBar.tsx.
const iconColors = {
  index: { ink: '#3172BD', soft: '#E4EFFF', darkInk: '#93BFFA', darkSoft: '#173B62' },
  community: { ink: '#087F6B', soft: '#DFF5E9', darkInk: '#77D9BB', darkSoft: '#143F38' },
  activity: { ink: '#7152C9', soft: '#EEE7FC', darkInk: '#C1ADFA', darkSoft: '#352957' },
  account: { ink: '#3172BD', soft: '#E4EFFF', darkInk: '#93BFFA', darkSoft: '#173B62' }
} as const

type DockRoute = keyof typeof iconColors

function isDockRoute(name: string): name is DockRoute {
  return Object.prototype.hasOwnProperty.call(iconColors, name)
}

function DockIcon({ name, focused, dark, size }: { name: DockRoute; focused: boolean; dark: boolean; size: number }) {
  const palette = iconColors[name]
  const ink = focused ? '#FFFFFF' : dark ? palette.darkInk : palette.ink
  const soft = dark ? palette.darkSoft : palette.soft

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {!focused && <Rect x={1} y={1} width={22} height={22} rx={7} fill={soft} />}
      {name === 'index' && <>
        <Path d="m3 10 7.7-6.2a2.1 2.1 0 0 1 2.6 0L21 10" stroke={ink} strokeWidth={2.4} />
        <Path d="M5 10.4 12 5l7 5.4V19a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2Z" fill={ink} fillOpacity={0.25} />
        <Path d="M5 12v7a2 2 0 0 0 2 2h3v-5a2 2 0 0 1 4 0v5h3a2 2 0 0 0 2-2v-7l-7-5.4Z" fill={ink} />
      </>}
      {name === 'community' && <>
        <Path d="M5 11h14v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2Z" fill={ink} fillOpacity={0.24} />
        <Rect x={4} y={8} width={16} height={4} rx={1.5} fill={ink} />
        <Path d="M12 8H8.7A2.2 2.2 0 1 1 11 5.2L12 8Zm0 0h3.3A2.2 2.2 0 1 0 13 5.2L12 8Zm0 4v8" stroke={ink} strokeWidth={1.7} />
      </>}
      {name === 'activity' && <>
        <Circle cx={12} cy={12} r={7} fill={ink} fillOpacity={0.16} stroke={ink} strokeWidth={1.5} />
        <Path d="M12 7.8v4.6l3 1.8" stroke={ink} strokeWidth={2} />
      </>}
      {name === 'account' && <>
        <Circle cx={12} cy={8.1} r={3.3} fill={ink} />
        <Path d="M5.5 18.4c0-3.3 2.6-5.4 6.5-5.4s6.5 2.1 6.5 5.4c0 1.3-2.8 2.1-6.5 2.1s-6.5-.8-6.5-2.1Z" fill={ink} fillOpacity={0.32} />
      </>}
    </Svg>
  )
}

export function TabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  const theme = useSanadTheme()
  const dir = dirStyles(useIsRTL())
  const activeFont = useAppFont('bold')
  const inactiveFont = useAppFont('semibold')
  const { width } = useWindowDimensions()
  const compact = width < 360
  const isHome = state.routes[state.index]?.name === 'index'

  return (
    <GuideTarget id="navigation">
      <View style={[styles.wrap, {
        backgroundColor: isHome && !theme.isDark ? '#F5F8FC' : theme.colors.background,
        paddingBottom: Math.max(insets.bottom, space.sm)
      }]}>
        <LinearGradient
          colors={theme.isDark ? [theme.colors.surface, '#0C2D32'] : ['#FFFFFF', '#EFFBF8']}
          start={{ x: 0, y: 0.25 }} end={{ x: 1, y: 0.75 }}
          style={[styles.pill, dir.row, {
            borderColor: theme.isDark ? '#29514E' : '#CFE8E6',
            boxShadow: theme.isDark ? '0 8px 24px rgba(0, 0, 0, 0.25)' : '0 8px 24px rgba(10, 119, 108, 0.10)'
          }]}
        >
          {state.routes.map((route, index) => {
            const descriptor = descriptors[route.key]
            if (!descriptor) return null
            const { options } = descriptor
            const isFocused = state.index === index
            const label = typeof options.tabBarLabel === 'string' ? options.tabBarLabel : (options.title ?? route.name)
            const color = isFocused ? '#FFFFFF' : theme.isDark ? theme.colors.textSecondary : '#526A80'

            function onPress() {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true })
              if (!isFocused && !event.defaultPrevented) {
                Haptics.selectionAsync().catch(() => {})
                navigation.navigate(route.name)
              }
            }

            return (
              <Pressable
                key={route.key}
                onPress={onPress}
                onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
                accessibilityRole="button"
                accessibilityState={{ selected: isFocused }}
                aria-current={isFocused ? 'page' : undefined}
                accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
                testID={options.tabBarButtonTestID}
                style={({ pressed }) => [styles.tab, { flex: isFocused ? 1.5 : 1, opacity: pressed ? 0.8 : 1 }]}
              >
                <LinearGradient
                  colors={isFocused ? ['#0869E4', '#087F83'] : ['transparent', 'transparent']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={[styles.tabContent, isFocused && styles.activeContent, isFocused && dir.row]}
                >
                  {isDockRoute(route.name)
                    ? <DockIcon name={route.name} focused={isFocused} dark={theme.isDark} size={isFocused ? 23 : 28} />
                    : options.tabBarIcon?.({ focused: isFocused, color, size: 23 })}
                  <Text style={[styles.label, {
                    color,
                    fontFamily: isFocused ? activeFont : inactiveFont,
                    fontSize: compact ? 10 : isFocused ? 12 : 11,
                    flexShrink: 1
                  }]} numberOfLines={1}>
                    {label}
                  </Text>
                </LinearGradient>
              </Pressable>
            )
          })}
        </LinearGradient>
      </View>
    </GuideTarget>
  )
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: space.lg, paddingTop: space.sm },
  pill: { width: '100%', maxWidth: 560, alignSelf: 'center', alignItems: 'center', gap: 3, borderRadius: radius.pill, borderWidth: 1, padding: 6 },
  tab: { minWidth: 44, minHeight: 52, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill },
  tabContent: { width: '100%', minHeight: 52, alignItems: 'center', justifyContent: 'center', gap: 2, borderRadius: radius.pill, paddingHorizontal: 2 },
  activeContent: { minHeight: 48, gap: 5, paddingHorizontal: 6, boxShadow: '0 4px 12px rgba(8, 127, 131, 0.18)' },
  label: { lineHeight: 19, textAlign: 'center' }
})
