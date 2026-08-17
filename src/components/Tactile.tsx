import { useRef } from 'react'
import type { ReactNode } from 'react'
import { Animated, Pressable, StyleProp, ViewStyle } from 'react-native'

export function Tactile({ onPress, style, children, scaleTo = 0.97 }: { onPress: () => void; style?: StyleProp<ViewStyle>; children: ReactNode; scaleTo?: number }) {
  const scale = useRef(new Animated.Value(1)).current

  function pressIn() {
    Animated.spring(scale, { toValue: scaleTo, useNativeDriver: true, speed: 40, bounciness: 4 }).start()
  }
  function pressOut() {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 6 }).start()
  }

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} style={style}>
        {children}
      </Pressable>
    </Animated.View>
  )
}
