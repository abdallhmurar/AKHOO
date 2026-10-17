import type { PropsWithChildren } from 'react'
import { StyleSheet } from 'react-native'
import MaskedView from '@react-native-masked-view/masked-view'
import { LinearGradient } from 'expo-linear-gradient'

// Feather the artwork itself, including its poster, into the parent surface.
// The parent's gradient/theme shows through; no painted rectangle is added.
export function BlendedArt({ children, edge = 'right', start = 0.76 }: PropsWithChildren<{ edge?: 'left' | 'right' | 'bottom' | 'soft'; start?: number }>) {
  if (edge === 'soft') return <MaskedView style={styles.fill} pointerEvents="none" maskElement={
    <LinearGradient colors={['#0000', '#000', '#000', '#0000']} locations={[0, 0.12, 0.88, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.fill} />
  }><MaskedView style={styles.fill} maskElement={
    <LinearGradient colors={['#0000', '#000', '#000', '#0000']} locations={[0, 0.12, 0.84, 1]} style={styles.fill} />
  }>{children}</MaskedView></MaskedView>
  return <MaskedView style={styles.fill} pointerEvents="none" maskElement={
    <LinearGradient colors={['#000', '#000', '#0000']} locations={[0, start, 1]}
      start={edge === 'left' ? { x: 1, y: 0 } : { x: 0, y: 0 }}
      end={edge === 'bottom' ? { x: 0, y: 1 } : edge === 'left' ? { x: 0, y: 0 } : { x: 1, y: 0 }} style={styles.fill} />
  }>{children}</MaskedView>
}
const styles = StyleSheet.create({ fill: { flex: 1 } })
