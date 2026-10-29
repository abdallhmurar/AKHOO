import { Redirect } from 'expo-router'
import { Platform } from 'react-native'

export default function DesignPreviewRoute() {
  if (!__DEV__ || Platform.OS !== 'web') return <Redirect href="/" />
  // Keep labelled fixture screens behind the local web-only guard.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { MobileHubPreview } = require('../src/features/mobileHub/MobileHubPreview') as typeof import('../src/features/mobileHub/MobileHubPreview')
  return <MobileHubPreview />
}
