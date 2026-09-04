import { DotLottieReact } from '@lottiefiles/dotlottie-react'
import type { AnimationObject } from 'lottie-react-native'
import type { StyleProp, ViewStyle } from 'react-native'

/**
 * Web: lottie-react-native's own web wrapper doesn't expose the underlying
 * WASM canvas's backgroundColor config, and it defaults to opaque - the
 * animation was painting over the photo behind it instead of compositing
 * with it. Talking to DotLottieReact directly lets us force it transparent.
 */
export function LottieBackground({ source, style }: { source: AnimationObject; style?: StyleProp<ViewStyle> }) {
  return <DotLottieReact data={JSON.stringify(source)} autoplay loop backgroundColor="#00000000" style={style as React.CSSProperties} />
}
