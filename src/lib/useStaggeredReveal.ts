import { useEffect, useRef } from 'react'
import { Animated, Easing } from 'react-native'

// Drives a short, staged reveal (design brief section 25: "1. glow 2.
// checkmark 3. content appears 4. points appear 5. next action" - never a
// single instant render, never longer than ~1-2s total). Each stage is an
// independent Animated.Value the caller fades/lifts in; stageStyle() gives
// the common opacity+translateY treatment so call sites don't repeat the
// interpolation. Built on the plain Animated API (native-driver-eligible
// transforms only) rather than react-native-reanimated - see theme.ts's
// motion section for why.
export function useStaggeredReveal(stageCount: number, staggerMs = 140) {
  const stages = useRef(Array.from({ length: stageCount }, () => new Animated.Value(0))).current

  useEffect(() => {
    Animated.stagger(
      staggerMs,
      stages.map(value => Animated.timing(value, { toValue: 1, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }))
    ).start()
  }, [stages, staggerMs])

  function stageStyle(index: number) {
    const value = stages[index]!
    return {
      opacity: value,
      transform: [{ translateY: value.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }]
    }
  }

  return { stageStyle }
}
