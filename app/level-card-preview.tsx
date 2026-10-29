import { Platform } from 'react-native'
import { Redirect } from 'expo-router'

export default function LevelCardPreviewRoute() {
  if (!__DEV__ || Platform.OS !== 'web') return <Redirect href="/" />
  // This fixture UI is only reachable during local web development.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { LevelCardPreview } = require('../src/features/activity/LevelCardPreview') as typeof import('../src/features/activity/LevelCardPreview')
  return <LevelCardPreview />
}
