import { Platform, SafeAreaView as IOSSafeAreaView } from 'react-native'
import type { ViewProps } from 'react-native'
import { SafeAreaView as AndroidSafeAreaView } from 'react-native-safe-area-context'

// React Native's built-in SafeAreaView only applies insets on iOS.
export function NativeSafeAreaView(props: ViewProps) {
  return Platform.OS === 'android' ? <AndroidSafeAreaView {...props} /> : <IOSSafeAreaView {...props} />
}
