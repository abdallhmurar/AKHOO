import { Pressable } from 'react-native'
import type { MembershipTiltProps } from './MembershipTilt.types'
export function MembershipTilt({ front, back, flipped, onFlip, height, label, hint }: MembershipTiltProps) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityHint={hint} onPress={onFlip} style={{ height }}>{flipped ? back : front}</Pressable>
}
