import { Stack } from 'expo-router'
import { RequestComposerProvider } from '../../src/features/requester/RequestComposerContext'
import { useIsRTL } from '../../src/lib/direction'

export default function RequesterLayout() {
  const isRTL = useIsRTL()
  return <RequestComposerProvider><Stack screenOptions={{ headerShown: false, animation: isRTL ? 'slide_from_left' : 'slide_from_right' }} /></RequestComposerProvider>
}
