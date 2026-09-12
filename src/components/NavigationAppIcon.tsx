import { Image } from 'react-native'
import type { NavigationApp } from '../lib/contactLinks'

// Official app icons (Google Maps' pin, Waze's face mark - waze.com's own
// apple-touch-icon.png, since Waze has no square icon-only asset on
// Wikimedia Commons) rather than a generic pin glyph, so the button
// literally shows which app it opens.
export function NavigationAppIcon({ app, size = 20 }: { app: NavigationApp; size?: number }) {
  const source = app === 'waze' ? require('../../assets/images/waze-icon.png') : require('../../assets/images/google-maps-icon.png')
  return <Image source={source} style={{ width: size, height: size }} resizeMode="contain" />
}
