import { LinearGradient } from 'expo-linear-gradient'
import { IconCredits } from './motion/Motion.ios'
import { RewardsGift } from '../features/home/RewardsGift.ios'
import { GuideTarget } from '../features/guide/GuideProvider'
import { useEffect, useRef, useState } from 'react'
import { AccessibilityInfo, Animated, Image, Pressable, StyleSheet, Text, View } from 'react-native'
import type { LayoutChangeEvent } from 'react-native'
import * as Haptics from 'expo-haptics'
import type { BottomTabBarProps } from 'expo-router/js-tabs'
import { dirStyles, useIsRTL } from '../lib/direction'
import { useAppFont } from '../lib/typography'
import { radius, shadow, space, spring, useSanadTheme } from '../lib/theme'

// Floating pill tab bar, rendered via <Tabs tabBar={...}> in app/(tabs)/_layout.tsx
// in place of the default flat react-navigation bar. Reuses each screen's own
// `tabBarIcon`/`title` (still declared per-Tabs.Screen there) so icon/label
// config stays in one place - this component only owns the pill chrome, the
// sliding active-indicator, and the press/lift motion.
export function TabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  const theme = useSanadTheme()
  const isRTL = useIsRTL()
  const dir = dirStyles(isRTL)
  const activeFont = useAppFont('semibold')
  const inactiveFont = useAppFont('medium')

  const [reducedMotion, setReducedMotion] = useState(true)
  const [giftPress, setGiftPress] = useState(0)
  useEffect(() => {
    let mounted = true
    AccessibilityInfo.isReduceMotionEnabled().then(value => { if (mounted) setReducedMotion(value) }).catch(() => {})
    const listener = AccessibilityInfo.addEventListener('reduceMotionChanged', setReducedMotion)
    return () => { mounted = false; listener.remove() }
  }, [])
  const routeCount = state.routes.length
  const [rowWidth, setRowWidth] = useState(0)
  const segmentWidth = rowWidth / routeCount

  const indicatorAnim = useRef(new Animated.Value(state.index)).current
  const liftAnims = useRef(state.routes.map((_, i) => new Animated.Value(i === state.index ? 1 : 0))).current

  useEffect(() => {
    if (reducedMotion) { indicatorAnim.setValue(state.index); liftAnims.forEach((anim, i) => anim.setValue(i === state.index ? 1 : 0)); return }
    Animated.spring(indicatorAnim, { toValue: state.index, ...spring.soft }).start()
    liftAnims.forEach((anim, i) => {
      Animated.spring(anim, { toValue: i === state.index ? 1 : 0, ...spring.soft }).start()
    })
  }, [state.index, indicatorAnim, liftAnims, reducedMotion])

  function onRowLayout(event: LayoutChangeEvent) {
    setRowWidth(Math.max(0, event.nativeEvent.layout.width - 12))
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
    <GuideTarget id="navigation"><View style={[styles.wrap, { backgroundColor: theme.colors.background, paddingBottom: Math.max(insets.bottom, space.sm) }]}>
      <View
        style={[styles.pill, dir.row, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }, shadow.floating]}
        onLayout={onRowLayout}
      >
        {segmentWidth > 0 && (
          <Animated.View
            pointerEvents="none"
            style={[styles.indicator, { width: segmentWidth, backgroundColor: '#087fb1', transform: [{ translateX }] }]}
          ><LinearGradient colors={['#086bf2', '#078a87']} start={{x:0,y:0}} end={{x:1,y:1}} style={[StyleSheet.absoluteFill, { borderRadius: 999 }]} /></Animated.View>
        )}
        {state.routes.map((route, index) => {
          const descriptor = descriptors[route.key]
          const lift = liftAnims[index]
          if (!descriptor || !lift) return null
          const { options } = descriptor
          const isFocused = state.index === index
          const label = typeof options.tabBarLabel === 'string' ? options.tabBarLabel : (options.title ?? route.name)
          const color = isFocused ? '#fff' : theme.colors.textMuted

          function onPress() {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true })
            if (route.name === 'community' && !event.defaultPrevented) setGiftPress(value => value + 1)
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
              accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
              style={styles.tab}
            >
              <Animated.View style={[styles.tabContent, { transform: [{ translateY }, { scale }] }]}>
                {route.name === 'community' ? <RewardsGift label={label} size={32} interactive={false} active={isFocused} interaction={giftPress} idle={false} /> : route.name === 'index' || route.name === 'activity' || route.name === 'account' ? <Image accessible={false} source={route.name === 'index' ? require('./dock-assets/home.png') : route.name === 'activity' ? require('./dock-assets/activity.png') : require('./dock-assets/account.png')} style={{ width: 30, height: 30 }} resizeMode="contain" /> : options.tabBarIcon?.({ focused: isFocused, color, size: 24 })}
                <Text style={[styles.label, { color, fontFamily: isFocused ? activeFont : inactiveFont }]} numberOfLines={1}>
                  {label}
                </Text>
              </Animated.View>
            </Pressable>
          )
        })}
      </View>
      <IconCredits />
    </View></GuideTarget>
  )
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 10, paddingTop: 6 },
  pill: { borderRadius: radius.pill, borderWidth: StyleSheet.hairlineWidth, paddingVertical: 6, paddingHorizontal: 6, overflow: 'hidden' },
  indicator: { position: 'absolute', top: 6, bottom: 6, left: 6, borderRadius: radius.pill },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  tabContent: { alignItems: 'center', gap: 3 },
  label: { fontSize: 10.5 }
})
