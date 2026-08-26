import { Stack } from 'expo-router'
import { useIsRTL } from '../../src/lib/direction'
export default function MissionLayout() { const isRTL = useIsRTL(); return <Stack screenOptions={{ headerShown: false, animation: isRTL ? 'slide_from_left' : 'slide_from_right' }} /> }
