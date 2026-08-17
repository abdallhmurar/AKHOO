import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { Animated, Modal, Pressable, StyleSheet, View } from 'react-native'
import { colors, radius, shadow } from '../lib/theme'

export function BottomSheet({ visible, onClose, children }: { visible: boolean; onClose: () => void; children: ReactNode }) {
  const progress = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(progress, { toValue: visible ? 1 : 0, duration: 220, useNativeDriver: true }).start()
  }, [visible, progress])

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.backdrop, { opacity: progress }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <Animated.View
        pointerEvents={visible ? 'box-none' : 'none'}
        style={[
          styles.sheetWrap,
          {
            opacity: progress,
            transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }]
          }
        ]}
      >
        <View style={styles.sheet}>
          <View style={styles.handle} />
          {children}
        </View>
      </Animated.View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#20342A66' },
  sheetWrap: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, padding: 20, paddingBottom: 32, ...shadow.soft },
  handle: { width: 40, height: 5, borderRadius: 3, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 16 }
})
