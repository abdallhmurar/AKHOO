import LottieView, { type AnimationObject } from 'lottie-react-native'
import type { StyleProp, ViewStyle } from 'react-native'

/** Native (iOS/Android): lottie-react-native's own renderer already composites transparently. */
export function LottieBackground({ source, style }: { source: AnimationObject; style?: StyleProp<ViewStyle> }) {
  return <LottieView source={source} autoPlay loop style={style} />
}
