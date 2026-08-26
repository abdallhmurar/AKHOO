import { useEffect, useRef } from 'react'
import { Animated, StyleSheet } from 'react-native'
import type { DimensionValue, ViewStyle } from 'react-native'
import { radius, useSanadTheme } from '../../lib/theme'

export function Skeleton({ width = '100%', height = 18, radiusSize = radius.sm, style }: { width?: DimensionValue; height?: number; radiusSize?: number; style?: ViewStyle }) {
  const theme = useSanadTheme()
  const opacity = useRef(new Animated.Value(0.45)).current
  useEffect(() => {
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 760, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0.45, duration: 760, useNativeDriver: true })
    ]))
    animation.start()
    return () => animation.stop()
  }, [opacity])
  return <Animated.View accessibilityLabel="Loading" style={[styles.base, { width, height, borderRadius: radiusSize, backgroundColor: theme.colors.skeleton, opacity }, style]} />
}

const styles = StyleSheet.create({ base: { overflow: 'hidden' } })
