import { useEffect, useMemo, useRef } from 'react'
import { Animated, Easing } from 'react-native'

// Drives a short, staged reveal (design brief section 25: "1. glow 2.
// checkmark 3. content appears 4. points appear 5. next action" - never a
// single instant render, never longer than ~1-2s total). Each stage is an
// independent Animated.Value the caller fades/lifts in; stageStyle() gives
// the common opacity+translateY treatment so call sites don't repeat the
// interpolation. Built on the plain Animated API rather than
// react-native-reanimated - see theme.ts's motion section for why.
//
// The animation runs on the JS driver on purpose. With the native driver, a
// re-render after the animation (for example when the offers query finishes
// loading) re-attaches the animated props and the native value can fall back to
// its initial 0, leaving the content laid out but invisible. The JS value stays
// authoritative here, and the style objects are created once so a re-render does
// not even re-attach them.
export function useStaggeredReveal(stageCount: number, staggerMs = 140) {
  const stages = useRef(Array.from({ length: stageCount }, () => new Animated.Value(0))).current
  const styles = useMemo(() => stages.map(value => ({
    opacity: value,
    transform: [{ translateY: value.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }]
  })), [stages])

  useEffect(() => {
    const animation = Animated.stagger(
      staggerMs,
      stages.map(value => Animated.timing(value, { toValue: 1, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: false }))
    )
    animation.start()
    return () => animation.stop()
  }, [stages, staggerMs])

  function stageStyle(index: number) {
    return styles[index]!
  }

  return { stageStyle }
}
