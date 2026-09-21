import { useEffect, useState } from 'react'
import { Image, View } from 'react-native'
import type { StyleProp, ViewStyle } from 'react-native'
import { radius, useSanadTheme } from '../../lib/theme'

const ratioCache = new Map<string, number>()

// A poster shown at its own aspect ratio (never cropped), with the ratio
// clamped so an extreme image can't take over the whole screen. The ratio is
// read once per URL and cached; until then it holds a neutral 4:3 box.
export function PosterImage({ uri, minRatio = 0.6, maxRatio = 2, style }: { uri: string; minRatio?: number; maxRatio?: number; style?: StyleProp<ViewStyle> }) {
  const theme = useSanadTheme()
  const [ratio, setRatio] = useState(ratioCache.get(uri) ?? 4 / 3)

  useEffect(() => {
    if (ratioCache.has(uri)) return
    let cancelled = false
    Image.getSize(
      uri,
      (width, height) => {
        if (cancelled || width <= 0 || height <= 0) return
        const next = Math.min(maxRatio, Math.max(minRatio, width / height))
        ratioCache.set(uri, next)
        setRatio(next)
      },
      () => {}
    )
    return () => { cancelled = true }
  }, [uri, minRatio, maxRatio])

  return (
    <View style={[{ width: '100%', aspectRatio: ratio, backgroundColor: theme.colors.surfaceMuted, borderRadius: radius.lg, overflow: 'hidden' }, style]}>
      <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="contain" accessible={false} />
    </View>
  )
}
