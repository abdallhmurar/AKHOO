import { useEffect, useRef } from 'react'
import { Animated, PanResponder, Pressable, StyleSheet } from 'react-native'
import * as Haptics from 'expo-haptics'
import type { MembershipTiltProps } from './MembershipTilt.types'

export function MembershipTilt({ front, back, height, flipped, onFlip, active, reduced, label, hint }: MembershipTiltProps) {
  const rotation = useRef(new Animated.Value(0)).current
  const tilt = useRef(new Animated.Value(0)).current
  const enabled = active && !reduced
  useEffect(() => {
    rotation.stopAnimation()
    if (!enabled) { rotation.setValue(flipped ? 180 : 0); tilt.setValue(0); return }
    const animation = Animated.spring(rotation, { toValue: flipped ? 180 : 0, damping: 23, stiffness: 140, mass: 1, useNativeDriver: true })
    animation.start()
    return () => animation.stop()
  }, [enabled, flipped, rotation, tilt])
  const responder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => enabled && Math.abs(gesture.dx) > 8 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
    onPanResponderMove: (_, gesture) => tilt.setValue(Math.max(-5, Math.min(5, gesture.dx / 12))),
    onPanResponderRelease: () => Animated.spring(tilt, { toValue: 0, useNativeDriver: true }).start(),
    onPanResponderTerminate: () => tilt.setValue(0),
  })
  const face = { height, backfaceVisibility: 'hidden' as const, overflow: 'hidden' as const, borderRadius: 22 }
  return <Pressable {...responder.panHandlers} accessibilityRole="button" accessibilityLabel={label} accessibilityHint={hint}
    accessibilityState={{ expanded: flipped }} onPress={() => { if (enabled) void Haptics.selectionAsync().catch(() => {}); onFlip() }} style={{ height }}>
    <Animated.View accessibilityElementsHidden={flipped} style={[face, styles.face, { opacity: reduced && flipped ? 0 : 1,
      transform: reduced ? [] : [{ perspective: 1000 }, { rotateY: Animated.add(rotation, tilt).interpolate({ inputRange: [-10, 190], outputRange: ['-15deg', '185deg'] }) }, { rotateZ: '1deg' }] }]}>{front}</Animated.View>
    <Animated.View accessibilityElementsHidden={!flipped} style={[face, styles.face, { opacity: reduced && !flipped ? 0 : 1,
      transform: reduced ? [] : [{ perspective: 1000 }, { rotateY: Animated.add(rotation, tilt).interpolate({ inputRange: [0, 180], outputRange: ['175deg', '355deg'] }) }, { rotateZ: '1deg' }] }]}>{back}</Animated.View>
  </Pressable>
}
const styles = StyleSheet.create({ face: { position: 'absolute', left: 0, right: 0, top: 0, boxShadow: '0 12px 20px -8px rgba(10,55,78,.30)' } })
