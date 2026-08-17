import { useRef } from 'react'
import type { ReactNode } from 'react'
import { Animated, Pressable, StyleProp, ViewStyle } from 'react-native'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export function Tactile({ onPress, style, children, scaleTo = 0.97 }: { onPress: () => void; style?: StyleProp<ViewStyle>; children: ReactNode; scaleTo?: number }) {
  const scale = useRef(new Animated.Value(1)).current

  function pressIn() {
    Animated.spring(scale, { toValue: scaleTo, useNativeDriver: true, speed: 40, bounciness: 4 }).start()
  }
  function pressOut() {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 6 }).start()
  }

  return (
    <AnimatedPressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} style={[style, { transform: [{ scale }] }]}>
      {children}
    </AnimatedPressable>
  )
}
