import { useEffect, useRef, useState } from 'react'
import { AccessibilityInfo, Animated, AppState, Easing, Image, Platform, StyleSheet, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useTranslation } from 'react-i18next'
import { dirStyles, useIsRTL } from '../../lib/direction'
import { useAppFont } from '../../lib/typography'
import { civicColors, useSanadTheme } from '../../lib/theme'

const car = require('../../../previews/help-counter/assets/akhoo-helper-car-v1.png')

/** Original artwork, only used in the guarded local concept preview. */
export function IllustratedHelpCounter({ completedCount, animate, replay }: {
  completedCount: number
  animate: boolean
  replay: number
}) {
  const { t } = useTranslation(), theme = useSanadTheme(), rtl = useIsRTL()
  const regular = useAppFont('regular'), bold = useAppFont('extraBold')
  const [width, setWidth] = useState(358), [reduced, setReduced] = useState(true)
  const [active, setActive] = useState(AppState.currentState === 'active')
  const drive = useRef(new Animated.Value(0)).current
  const arrival = useRef(new Animated.Value(1)).current
  const count = Number.isFinite(completedCount) ? Math.max(0, Math.floor(completedCount)) : 0
  const align = rtl ? 'right' as const : 'left' as const
  const numberSize = Math.min(width < 330 ? 52 : 68, ((width - 52) / 2) / (String(count).length * 0.72))
  const blue = theme.isDark ? '#79b5ff' : civicColors.signalBlue
  const teal = theme.isDark ? '#68d6b8' : civicColors.communityTeal

  useEffect(() => {
    let mounted = true
    const reducedSubscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced)
    const appSubscription = AppState.addEventListener('change', state => setActive(state === 'active'))
    AccessibilityInfo.isReduceMotionEnabled().then(value => { if (mounted) setReduced(value) }).catch(() => {})
    return () => { mounted = false; reducedSubscription.remove(); appSubscription.remove() }
  }, [])

  useEffect(() => {
    if (!animate || reduced || !active) { drive.setValue(0); return }
    const options = { duration: 2400, easing: Easing.inOut(Easing.sin), useNativeDriver: Platform.OS !== 'web', isInteraction: false }
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(drive, { ...options, toValue: 1 }),
      Animated.timing(drive, { ...options, toValue: 0 }),
    ]))
    animation.start()
    return () => animation.stop()
  }, [active, animate, drive, reduced])

  useEffect(() => {
    if (!animate || reduced || !active) { arrival.setValue(1); return }
    arrival.setValue(0)
    const animation = Animated.timing(arrival, {
      toValue: 1, duration: 480, easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web', isInteraction: false,
    })
    animation.start()
    return () => animation.stop()
  }, [active, animate, arrival, count, reduced, replay])

  return <LinearGradient
    testID="illustrated-help-counter"
    accessible accessibilityRole="text" accessibilityLabel={t('helpCounter.total', { count })}
    colors={theme.isDark ? ['#102b41', '#103b38'] : ['#ffffff', '#edf9ff']}
    start={{ x: 0.8, y: 0 }} end={{ x: 0, y: 1 }}
    onLayout={event => setWidth(event.nativeEvent.layout.width)}
    style={[styles.card, { borderColor: theme.isDark ? '#315269' : '#cfe8f7' }]}
  >
    <View style={[styles.content, dirStyles(rtl).row]}>
      <View style={styles.copy}>
        <Text style={[styles.title, { color: teal, fontFamily: bold, textAlign: align, fontSize: width < 330 ? 17 : 20 }]}>{t('helpCounter.title')}</Text>
        <Animated.Text testID="illustrated-count" adjustsFontSizeToFit numberOfLines={1} maxFontSizeMultiplier={1.2}
          style={[styles.count, { color: blue, textAlign: align, fontSize: numberSize,
            transform: [{ scale: arrival.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) }] }]}>{count}</Animated.Text>
        <Text style={[styles.unit, { color: theme.colors.textPrimary, fontFamily: regular, textAlign: align }]}>{t('counterConcept.completed')}</Text>
      </View>
      <View pointerEvents="none" accessible={false} style={styles.scene}>
        <Animated.View testID="car-motion-layer" style={{ width: '100%', transform: [
          { translateX: drive.interpolate({ inputRange: [0, 1], outputRange: [rtl ? -4 : 4, rtl ? 4 : -4] }) },
          { translateY: drive.interpolate({ inputRange: [0, 1], outputRange: [0, -2] }) },
          { rotate: drive.interpolate({ inputRange: [0, 1], outputRange: ['-0.5deg', '0.5deg'] }) },
          { scaleX: rtl ? 1 : -1 },
        ] }}>
          <Image testID="helper-car-art" source={car} resizeMode="contain" style={[styles.car, { height: Math.max(90, (width - 54) / 3) }]} accessibilityIgnoresInvertColors />
        </Animated.View>
      </View>
    </View>
  </LinearGradient>
}

const styles = StyleSheet.create({
  card: { width: '100%', borderRadius: 28, borderWidth: 1, overflow: 'hidden', padding: 20, minHeight: 218, boxShadow: '0 12px 28px rgba(17, 77, 122, 0.06)' },
  content: { flex: 1, alignItems: 'center', gap: 12 },
  copy: { flex: 1, minWidth: 0, gap: 2 },
  title: { lineHeight: 34 },
  count: { fontFamily: 'Inter_800ExtraBold', writingDirection: 'ltr', lineHeight: 84, letterSpacing: -2 },
  unit: { fontSize: 12, lineHeight: 24 },
  scene: { flex: 1, minWidth: 0, paddingTop: 25, alignItems: 'center', justifyContent: 'center' },
  car: { width: '100%' },
})
