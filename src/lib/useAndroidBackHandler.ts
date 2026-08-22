import { useEffect } from 'react'
import { BackHandler } from 'react-native'

// Registers a hardware/system back handler scoped to whichever screen calls
// it. Confirmed on a real Android device: with zero BackHandler use
// anywhere in the app, system back on a nested screen (e.g. Request Help
// step 2) exited the app instead of going up a level, since there's no
// React Navigation stack to intercept it. `onBack` should perform the same
// navigation the screen's own visible back arrow already does - always
// returns true (press handled, never falls through to the OS default of
// closing the app). No-ops safely on iOS/web (BackHandler.addEventListener
// there is an inert stub), so this hook is used unconditionally.
export function useAndroidBackHandler(onBack: () => void) {
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onBack()
      return true
    })
    return () => subscription.remove()
  }, [onBack])
}
