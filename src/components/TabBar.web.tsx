import { GuideTarget } from '../features/guide/GuideProvider'
import { useEffect, useRef, useState } from 'react'
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native'
import type { LayoutChangeEvent } from 'react-native'
import * as Haptics from 'expo-haptics'
import type { BottomTabBarProps } from 'expo-router/js-tabs'
import { dirStyles, useIsRTL } from '../lib/direction'
import { useAppFont } from '../lib/typography'
import { radius, space, spring, useSanadTheme } from '../lib/theme'

// Web-only dock polish. Reuse the existing tab icons (including the blue
// perks coupon), labels, and navigation; native keeps TabBar.tsx.
export function TabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  const theme = useSanadTheme()
  const isRTL = useIsRTL()
  const dir = dirStyles(isRTL)
  const activeFont = useAppFont('semibold')
  const inactiveFont = useAppFont('medium')

  const routeCount = state.routes.length
  const [rowWidth, setRowWidth] = useState(0)
  const segmentWidth = Math.max(0, rowWidth - 12) / routeCount
  const isHome = state.routes[state.index]?.name === 'index'

  const indicatorAnim = useRef(new Animated.Value(state.index)).current
  const liftAnims = useRef(state.routes.map((_, i) => new Animated.Value(i === state.index ? 1 : 0))).current

  useEffect(() => {
    Animated.spring(indicatorAnim, { toValue: state.index, ...spring.soft }).start()
    liftAnims.forEach((anim, i) => {
      Animated.spring(anim, { toValue: i === state.index ? 1 : 0, ...spring.soft }).start()
    })
  }, [state.index, indicatorAnim, liftAnims])

  function onRowLayout(event: LayoutChangeEvent) {
    setRowWidth(event.nativeEvent.layout.width)
  }

  // Left/right are physical (not logical) in RN, but on both native (row-reverse)
  // and web (ambient dir=rtl mirroring plain row - see lib/direction.ts) an RTL
  // bar ends up rendering tab 0 on the physical right either way. Flipping the
  // index here keeps the indicator under the tab it's actually supposed to be
  // under regardless of which of those two mirroring mechanisms is in play.
  const translateX = indicatorAnim.interpolate({
    inputRange: state.routes.map((_, i) => i),
    outputRange: state.routes.map((_, i) => (isRTL ? routeCount - 1 - i : i) * segmentWidth)
  })

  return (
    <GuideTarget id="navigation"><View style={[styles.wrap, { backgroundColor: isHome && !theme.isDark ? '#F5F8FC' : theme.colors.background, paddingBottom: Math.max(insets.bottom, space.sm) }]}>
      <View
        style={[styles.pill, dir.row, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, boxShadow: theme.isDark ? '0 8px 24px rgba(0, 0, 0, 0.25)' : '0 8px 24px rgba(11, 31, 51, 0.09)' }]}
        onLayout={onRowLayout}
      >
        {segmentWidth > 0 && (
          <Animated.View
            pointerEvents="none"
            style={[styles.indicator, { width: segmentWidth, backgroundColor: theme.colors.primarySoft, transform: [{ translateX }] }]}
          />
        )}
        {state.routes.map((route, index) => {
          const descriptor = descriptors[route.key]
          const lift = liftAnims[index]
          if (!descriptor || !lift) return null
          const { options } = descriptor
          const isFocused = state.index === index
          const label = typeof options.tabBarLabel === 'string' ? options.tabBarLabel : (options.title ?? route.name)
          const color = isFocused ? theme.colors.primary : theme.colors.textMuted

          function onPress() {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true })
            if (!isFocused && !event.defaultPrevented) {
              Haptics.selectionAsync().catch(() => {})
              navigation.navigate(route.name)
            }
          }

          function onLongPress() {
            navigation.emit({ type: 'tabLongPress', target: route.key })
          }

          const translateY = lift.interpolate({ inputRange: [0, 1], outputRange: [0, -3] })
          const scale = lift.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] })

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              onLongPress={onLongPress}
              accessibilityRole="button"
              accessibilityState={{ selected: isFocused }}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              style={styles.tab}
            >
              <Animated.View style={[styles.tabContent, { transform: [{ translateY }, { scale }] }]}>
                {options.tabBarIcon?.({ focused: isFocused, color, size: 22 })}
                <Text style={[styles.label, { color, fontFamily: isFocused ? activeFont : inactiveFont }]} numberOfLines={1}>
                  {label}
                </Text>
              </Animated.View>
            </Pressable>
          )
        })}
      </View>
    </View></GuideTarget>
  )
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: space.lg, paddingTop: space.sm },
  pill: { width: '100%', maxWidth: 560, alignSelf: 'center', borderRadius: radius.pill, borderWidth: StyleSheet.hairlineWidth, paddingVertical: 6, paddingHorizontal: 6, overflow: 'hidden' },
  indicator: { position: 'absolute', top: 6, bottom: 6, left: 6, borderRadius: radius.pill },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  tabContent: { alignItems: 'center', gap: 3 },
  label: { fontSize: 10.5 }
})
