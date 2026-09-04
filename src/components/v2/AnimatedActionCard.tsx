import type { ImageSourcePropType } from 'react-native'
import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import LottieView, { type AnimationObject } from 'lottie-react-native'
import { useIsRTL } from '../../lib/direction'
import { radius, shadow, space } from '../../lib/theme'
import { useAppTypography } from '../../lib/typography'

const CARD_HEIGHT = 210

/**
 * A hero-style card with a photo background and a looping Lottie motion
 * overlay (glow/smoke/shine effects) behind translatable text - unlike
 * ActionCard's baked-text Arabic image, nothing here is locked to one
 * language, so it renders the same way for ar/he/en.
 */
export function AnimatedActionCard({
  title,
  description,
  background,
  animation,
  onPress
}: {
  title: string
  description: string
  background: ImageSourcePropType
  animation: AnimationObject
  onPress: () => void
}) {
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [styles.card, shadow.soft, pressed && styles.pressed]}
    >
      <Image source={background} resizeMode="cover" style={StyleSheet.absoluteFill} />
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <LottieView source={animation} autoPlay loop style={StyleSheet.absoluteFill} />
      </View>
      <View style={[styles.copy, isRTL ? styles.copyRTL : styles.copyLTR]}>
        <Text style={[typography.h2, styles.title, { textAlign: isRTL ? 'right' : 'left' }]}>{title}</Text>
        <Text style={[typography.small, styles.description, { textAlign: isRTL ? 'right' : 'left' }]}>{description}</Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: { height: CARD_HEIGHT, borderRadius: radius.xl, overflow: 'hidden' },
  copy: { position: 'absolute', top: '22%', width: '48%', paddingHorizontal: space.md },
  copyRTL: { right: 0 },
  copyLTR: { left: 0 },
  title: { color: '#fff', textShadowColor: 'rgba(0,0,0,0.35)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 8 },
  description: { color: '#fff', opacity: 0.92, marginTop: 6, textShadowColor: 'rgba(0,0,0,0.35)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6 },
  pressed: { opacity: 0.94 }
})
