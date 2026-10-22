import { Platform } from 'react-native'
import { Redirect } from 'expo-router'
import { CommunityHubScreen } from '../../src/features/community/CommunityScreens'

// A direct web visit resolves this route before the tab with the same URL.
// Keep it in the tab navigator so refreshing preserves the approved dock.
export default function CommunityEntry() {
  return Platform.OS === 'web' ? <Redirect href="/(tabs)/community" /> : <CommunityHubScreen />
}
