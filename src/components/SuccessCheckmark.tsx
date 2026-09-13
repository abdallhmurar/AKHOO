import { useEffect, useRef } from 'react'
import { Animated, Easing, StyleSheet, View } from 'react-native'
import * as Haptics from 'expo-haptics'
import { CheckCircle, XCircle } from 'phosphor-react-native'
import { colors } from '../lib/theme'

// The first two beats of the completion sequence (design brief section 25):
// a soft radial glow blooms outward, then the icon itself scales in with a
// small spring bounce - "checkmark draw" via a real SVG stroke animation
// was considered but a scale-in icon is the same technique already proven
// elsewhere in this app (RequestHelpScreen's selection badge, the
// "sent email" success scene) rather than a first-of-its-kind SVG
// animation for one screen's entrance beat.
export function SuccessCheckmark({ tone = 'success', size = 86, pulse = false }: { tone?: 'success' | 'danger'; size?: number; pulse?: boolean }) {
  const scale = useRef(new Animated.Value(0)).current
  const glow = useRef(new Animated.Value(0)).current
  const breathe = useRef(new Animated.Value(0)).current
  const color = tone === 'success' ? colors.success : colors.danger
  const soft = tone === 'success' ? colors.successSoft : colors.dangerSoft
  const Icon = tone === 'success' ? CheckCircle : XCircle
  const radius = size / 2
  const iconSize = Math.round(size * 0.51)

  useEffect(() => {
    Animated.timing(glow, { toValue: 1, duration: 450, easing: Easing.out(Easing.ease), useNativeDriver: true }).start()
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 10, delay: 90 }).start()
    Haptics.notificationAsync(tone === 'success' ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [glow, scale])

  // Slow continuous "breathing" glow for celebratory screens (design brief:
  // "3D/Animated" success moment) - starts after the entrance bloom finishes
  // rather than fighting it, and loops indefinitely at a gentle pace so it
  // reads as alive without being distracting.
  useEffect(() => {
    if (!pulse) return
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: true, delay: 500 }),
        Animated.timing(breathe, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [pulse, breathe])

  const glowScale = glow.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.5] })
  const glowOpacity = glow.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 0.45, 0] })
  const breatheScale = breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] })
  const breatheOpacity = breathe.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.05] })

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Animated.View style={[styles.glow, { width: size, height: size, borderRadius: radius, backgroundColor: color, opacity: glowOpacity, transform: [{ scale: glowScale }] }]} />
      {pulse ? (
        <Animated.View pointerEvents="none" style={[styles.glow, { width: size, height: size, borderRadius: radius, backgroundColor: color, opacity: breatheOpacity, transform: [{ scale: breatheScale }] }]} />
      ) : null}
      <Animated.View style={[styles.iconWrap, { width: size, height: size, borderRadius: radius, backgroundColor: soft, transform: [{ scale }] }]}>
        <Icon size={iconSize} color={color} weight="fill" />
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  // alignSelf: 'center' is required, not redundant - this component is a
  // fixed-width box inside column-flex containers that default to
  // alignItems: 'stretch'. A fixed-width child can't actually stretch, and
  // on a real Android device in RTL that fallback was observed rendering
  // the icon flush to the right instead of centered (confirmed on-device,
  // Arabic). Centering itself here fixes every call site at once instead
  // of requiring every parent container to remember alignItems: 'center'.
  wrap: { alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  glow: { position: 'absolute' },
  iconWrap: { alignItems: 'center', justifyContent: 'center' }
})
