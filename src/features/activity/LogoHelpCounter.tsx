import { useEffect, useRef, useState } from 'react'
import { AccessibilityInfo, Animated, AppState, Easing, Platform, StyleSheet, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useTranslation } from 'react-i18next'
import { dirStyles, useIsRTL } from '../../lib/direction'
import { useAppFont } from '../../lib/typography'
import { useSanadTheme } from '../../lib/theme'

const logo = require('../../../previews/help-counter/assets/akhoo-logo-dimensional-v1.png')

/** Local design fixture only; no WebGL or live data dependencies. */
export function LogoHelpCounter({ completedCount, animate, replay }: {
  completedCount: number
  animate: boolean
  replay: number
}) {
  const { t } = useTranslation(), theme = useSanadTheme(), rtl = useIsRTL()
  const regular = useAppFont('regular'), bold = useAppFont('extraBold')
  const [width, setWidth] = useState(358), [reduced, setReduced] = useState(true)
  const [active, setActive] = useState(AppState.currentState === 'active')
  // 0: below the frame, 1: arrived, 2: completed one turn, 3: above the frame.
  const phase = useRef(new Animated.Value(1)).current
  const pulse = useRef(new Animated.Value(1)).current
  const count = Number.isFinite(completedCount) ? Math.max(0, Math.floor(completedCount)) : 0
  const align = rtl ? 'right' as const : 'left' as const
  const numberSize = Math.min(width < 330 ? 52 : 68, ((width - 52) / 2) / (String(count).length * 0.72))
  const artworkSize = Math.min(190, (width - 54) * 0.62)
  const navy = theme.isDark ? '#c8e2ff' : '#082f60'

  useEffect(() => {
    let mounted = true
    const motionSubscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced)
    const appSubscription = AppState.addEventListener('change', state => setActive(state === 'active'))
    AccessibilityInfo.isReduceMotionEnabled().then(value => { if (mounted) setReduced(value) }).catch(() => {})
    return () => { mounted = false; motionSubscription.remove(); appSubscription.remove() }
  }, [])

  useEffect(() => {
    phase.stopAnimation()
    if (!animate || reduced || !active) { phase.setValue(1); return }
    phase.setValue(0)
    const options = { useNativeDriver: Platform.OS !== 'web', isInteraction: false }
    const animation = Animated.loop(Animated.sequence([
      Animated.delay(250),
      Animated.timing(phase, { ...options, toValue: 1, duration: 850, easing: Easing.out(Easing.cubic) }),
      Animated.delay(400),
      Animated.timing(phase, { ...options, toValue: 2, duration: 1800, easing: Easing.inOut(Easing.cubic) }),
      Animated.delay(600),
      Animated.timing(phase, { ...options, toValue: 3, duration: 950, easing: Easing.in(Easing.quad) }),
      Animated.delay(700),
    ]))
    animation.start()
    return () => animation.stop()
  }, [active, animate, phase, reduced, replay])

  useEffect(() => {
    pulse.stopAnimation()
    if (!animate || reduced || !active) { pulse.setValue(1); return }
    pulse.setValue(0)
    const animation = Animated.timing(pulse, {
      toValue: 1, duration: 450, easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web', isInteraction: false,
    })
    animation.start()
    return () => animation.stop()
  }, [active, animate, count, pulse, reduced])

  return <LinearGradient testID="logo-help-counter"
    accessible accessibilityRole="text" accessibilityLabel={t('helpCounter.total', { count })}
    colors={theme.isDark ? ['#132e43', '#163d40', '#d9f2f2'] : ['#ffffff', '#f5fdfd', '#edfbfc']}
    locations={[0, 0.42, 1]}
    start={{ x: rtl ? 1 : 0, y: 0.5 }} end={{ x: rtl ? 0 : 1, y: 0.5 }}
    onLayout={event => setWidth(event.nativeEvent.layout.width)}
    style={[styles.card, { borderColor: theme.isDark ? '#345b69' : '#cfe9ef' }]}
  >
    <View style={[styles.content, dirStyles(rtl).row]}>
      <View style={styles.copy}>
        <Text testID="logo-counter-heading" style={[styles.title, { color: navy, fontFamily: bold, textAlign: align, fontSize: width < 330 ? 17 : 21 }]}>{t('logoCounter.title')}</Text>
        <Animated.Text testID="logo-counter-count" adjustsFontSizeToFit numberOfLines={1} maxFontSizeMultiplier={1.2}
          style={[styles.count, { color: navy, textAlign: align, fontSize: numberSize,
            transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) }] }]}>{count}</Animated.Text>
        <Text style={[styles.unit, { color: theme.isDark ? '#8de1d6' : '#147d78', fontFamily: regular, textAlign: align }]}>{t('counterConcept.completed')}</Text>
      </View>
      <View testID="logo-animation-stage" pointerEvents="none" accessible={false} style={styles.scene}>
        <Animated.View testID="logo-motion-layer" style={{ width: artworkSize, height: artworkSize,
          opacity: phase.interpolate({ inputRange: [0, 0.18, 0.8, 2, 2.8, 3], outputRange: [0, 0.4, 1, 1, 0.5, 0] }),
          transform: [
            { translateY: phase.interpolate({ inputRange: [0, 1, 2, 3], outputRange: [210, 0, 0, -210] }) },
            { scale: phase.interpolate({ inputRange: [0, 1, 2, 3], outputRange: [0.85, 1, 1, 0.96] }) },
          ],
        }}>
          <Animated.Image testID="logo-turn-front" source={logo} resizeMode="contain" accessibilityIgnoresInvertColors
            style={[styles.face, { transform: [{ perspective: 700 }, { rotateY: phase.interpolate({ inputRange: [0, 1, 2, 3], outputRange: ['0deg', '0deg', '360deg', '360deg'] }) }] }]} />
          <Animated.Image testID="logo-turn-back" source={logo} resizeMode="contain" accessibilityIgnoresInvertColors
            style={[styles.face, { transform: [{ perspective: 700 }, { rotateY: phase.interpolate({ inputRange: [0, 1, 2, 3], outputRange: ['-180deg', '-180deg', '180deg', '180deg'] }) }] }]} />
        </Animated.View>
      </View>
    </View>
  </LinearGradient>
}

const styles = StyleSheet.create({
  card: { width: '100%', borderRadius: 28, borderWidth: 1, overflow: 'hidden', paddingHorizontal: 20, paddingVertical: 14, minHeight: 218, boxShadow: '0 12px 28px rgba(17, 77, 122, 0.06)' },
  content: { alignItems: 'center', gap: 12 },
  copy: { flex: 1, minWidth: 0, gap: 2 },
  title: { lineHeight: 31 },
  count: { fontFamily: 'Inter_800ExtraBold', writingDirection: 'ltr', lineHeight: 84, letterSpacing: -2 },
  unit: { fontSize: 12, lineHeight: 24 },
  scene: { flex: 1, minWidth: 0, height: 188, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  face: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backfaceVisibility: 'hidden' },
})
