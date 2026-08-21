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
export function SuccessCheckmark({ tone = 'success' }: { tone?: 'success' | 'danger' }) {
  const scale = useRef(new Animated.Value(0)).current
  const glow = useRef(new Animated.Value(0)).current
  const color = tone === 'success' ? colors.success : colors.danger
  const soft = tone === 'success' ? colors.successSoft : colors.dangerSoft
  const Icon = tone === 'success' ? CheckCircle : XCircle

  useEffect(() => {
    Animated.timing(glow, { toValue: 1, duration: 450, easing: Easing.out(Easing.ease), useNativeDriver: true }).start()
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 10, delay: 90 }).start()
    Haptics.notificationAsync(tone === 'success' ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [glow, scale])

  const glowScale = glow.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.5] })
  const glowOpacity = glow.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 0.45, 0] })

  return (
    <View style={styles.wrap}>
      <Animated.View style={[styles.glow, { backgroundColor: color, opacity: glowOpacity, transform: [{ scale: glowScale }] }]} />
      <Animated.View style={[styles.iconWrap, { backgroundColor: soft, transform: [{ scale }] }]}>
        <Icon size={44} color={color} weight="fill" />
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { width: 86, height: 86, alignItems: 'center', justifyContent: 'center' },
  glow: { position: 'absolute', width: 86, height: 86, borderRadius: 43 },
  iconWrap: { width: 86, height: 86, borderRadius: 43, alignItems: 'center', justifyContent: 'center' }
})
