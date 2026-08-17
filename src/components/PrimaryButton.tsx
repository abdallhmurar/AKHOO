import { useRef } from 'react'
import { ActivityIndicator, Animated, Pressable, StyleSheet, Text, ViewStyle } from 'react-native'
import { colors, font, radius } from '../lib/theme'

export function PrimaryButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  tone = 'forest',
  style
}: {
  title: string
  onPress: () => void
  loading?: boolean
  disabled?: boolean
  tone?: 'forest' | 'sage' | 'light' | 'red' | 'blue' | 'green'
  style?: ViewStyle
}) {
  const scale = useRef(new Animated.Value(1)).current

  const backgroundColor =
    tone === 'sage' || tone === 'green' ? colors.forest :
    tone === 'red' ? colors.dangerSoft :
    tone === 'light' ? colors.sageSoft :
    colors.forest
  const textColor = tone === 'red' ? colors.danger : tone === 'light' ? colors.forest : '#fff'

  function pressIn() {
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 40, bounciness: 4 }).start()
  }
  function pressOut() {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 6 }).start()
  }

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        disabled={disabled || loading}
        style={[styles.button, { backgroundColor }, style, (disabled || loading) && styles.disabled]}
      >
        {loading ? <ActivityIndicator color={textColor} /> : <Text style={[styles.text, { color: textColor }]}>{title}</Text>}
      </Pressable>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  button: { minHeight: 54, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  text: { fontSize: 16, fontFamily: font.bold },
  disabled: { opacity: 0.5 }
})
