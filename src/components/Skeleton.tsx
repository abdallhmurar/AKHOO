import { useEffect, useRef } from 'react'
import { Animated, Easing, StyleSheet } from 'react-native'
import type { DimensionValue } from 'react-native'
import { colors, radius } from '../lib/theme'

export function Skeleton({ width, height, radius: cornerRadius = radius.sm, style }: { width: DimensionValue; height: number; radius?: number; style?: object }) {
  const pulse = useRef(new Animated.Value(0.4)).current

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [pulse])

  return <Animated.View style={[styles.base, { width, height, borderRadius: cornerRadius, opacity: pulse }, style]} />
}

const styles = StyleSheet.create({
  base: { backgroundColor: colors.border }
})
