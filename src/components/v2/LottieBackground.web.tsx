import { useEffect, useRef } from 'react'
import { View } from 'react-native'
import type { StyleProp, ViewStyle } from 'react-native'
import type { AnimationObject } from 'lottie-react-native'
import lottie from 'lottie-web'

/**
 * Web: the user's own working HTML preview used lottie-web's classic SVG
 * renderer (transparent by nature, composites over the photo behind it with
 * no extra config) - not the WASM/canvas engine lottie-react-native's web
 * wrapper uses, which was painting an opaque backdrop over the photo no
 * matter what background config was passed. This talks to lottie-web
 * directly, the same way that working preview did.
 */
export function LottieBackground({ source, style }: { source: AnimationObject; style?: StyleProp<ViewStyle> }) {
  const containerRef = useRef<View>(null)

  useEffect(() => {
    const node = containerRef.current as unknown as HTMLElement | null
    if (!node) return
    const anim = lottie.loadAnimation({
      container: node,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      animationData: source
    })
    return () => anim.destroy()
  }, [source])

  return <View ref={containerRef} style={style} />
}
