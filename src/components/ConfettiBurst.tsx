import { useEffect, useRef } from 'react'
import { Animated, Easing, StyleSheet, View, useWindowDimensions } from 'react-native'
import { civicColors } from '../lib/theme'

const COLORS = [civicColors.communityTeal, civicColors.signalBlue, civicColors.rewardGold]
const PIECE_COUNT = 16

// One-shot celebratory burst for a completion screen - plain Animated
// falling/rotating rectangles rather than a Lottie asset, matching this
// app's convention of using the built-in Animated API for a single
// lightweight effect instead of pulling in a new animation file (see
// MissionTimeline's pulse, SuccessCheckmark's glow). Colors are the
// existing brand palette only (teal/blue/gold), never new ones.
export function ConfettiBurst() {
  const { width } = useWindowDimensions()
  const pieces = useRef(
    Array.from({ length: PIECE_COUNT }, (_, index) => ({
      left: Math.random() * width,
      size: 6 + Math.random() * 6,
      color: COLORS[index % COLORS.length],
      delay: Math.random() * 250,
      duration: 1400 + Math.random() * 700,
      fall: 220 + Math.random() * 140,
      drift: (Math.random() - 0.5) * 60,
      rotate: 180 + Math.random() * 360,
      progress: new Animated.Value(0)
    }))
  ).current

  useEffect(() => {
    const animations = pieces.map(piece =>
      Animated.timing(piece.progress, { toValue: 1, duration: piece.duration, delay: piece.delay, easing: Easing.out(Easing.quad), useNativeDriver: true })
    )
    Animated.stagger(20, animations).start()
  }, [pieces])

  return (
    <View pointerEvents="none" style={styles.overlay}>
      {pieces.map((piece, index) => {
        const translateY = piece.progress.interpolate({ inputRange: [0, 1], outputRange: [-20, piece.fall] })
        const translateX = piece.progress.interpolate({ inputRange: [0, 1], outputRange: [0, piece.drift] })
        const rotate = piece.progress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${piece.rotate}deg`] })
        const opacity = piece.progress.interpolate({ inputRange: [0, 0.15, 0.75, 1], outputRange: [0, 1, 1, 0] })
        return (
          <Animated.View
            key={index}
            style={[
              styles.piece,
              {
                left: piece.left,
                width: piece.size,
                height: piece.size * 0.4,
                backgroundColor: piece.color,
                opacity,
                transform: [{ translateY }, { translateX }, { rotate }]
              }
            ]}
          />
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, height: 360, zIndex: 5 },
  piece: { position: 'absolute', top: 0, borderRadius: 2 }
})
