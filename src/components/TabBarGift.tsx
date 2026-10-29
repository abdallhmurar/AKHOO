import { Image } from 'react-native'

type Props = {
  label: string
  size?: number
  interactive?: boolean
  active?: boolean
  interaction?: number
  idle?: boolean
}

// Android keeps the native tab lift/press animation without mounting a WebView
// every time the benefits tab is selected. The parent owns accessibility.
export function TabBarGift({ size = 44 }: Props) {
  return <Image accessible={false} source={require('./dock-assets/gift.png')} style={{ width: size, height: size }} resizeMode="contain" />
}
