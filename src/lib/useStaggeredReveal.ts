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
// Every stage runs on its own. Animated.stagger() is a parallel group that stops
// all stages as soon as one is stopped, and a stage is stopped whenever its view
// unmounts mid-animation (the perks points card is swapped for another panel when
// its data arrives). That froze the later stages at their current, often fully
// transparent, value and left the weekly offers laid out but invisible. Here a
// stopped stage does not affect the others, and whatever way the reveal ends every
// stage is finished at 1. The JS driver keeps each value authoritative on re-render.
export function useStaggeredReveal(stageCount: number, staggerMs = 140) {
  const stages = useRef(Array.from({ length: stageCount }, () => new Animated.Value(0))).current
  const styles = useMemo(() => stages.map(value => ({
    opacity: value,
    transform: [{ translateY: value.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }]
  })), [stages])

  useEffect(() => {
    const reveal = Animated.parallel(
      stages.map((value, index) => Animated.sequence([
        Animated.delay(staggerMs * index),
        Animated.timing(value, { toValue: 1, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: false })
      ])),
      { stopTogether: false }
    )
    reveal.start(() => stages.forEach(value => value.setValue(1)))
    return () => reveal.stop()
  }, [stages, staggerMs])

  function stageStyle(index: number) {
    return styles[index]!
  }

  return { stageStyle }
}
