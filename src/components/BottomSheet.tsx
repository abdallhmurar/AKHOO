import { useCallback, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { StyleSheet } from 'react-native'
import GorhomBottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet'
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet'
import { colors, radius, shadow } from '../lib/theme'

export function BottomSheet({ visible, onClose, children }: { visible: boolean; onClose: () => void; children: ReactNode }) {
  const sheetRef = useRef<GorhomBottomSheet>(null)

  useEffect(() => {
    if (visible) sheetRef.current?.snapToIndex(0)
    else sheetRef.current?.close()
  }, [visible])

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.4} pressBehavior="close" />,
    []
  )

  return (
    <GorhomBottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={['50%']}
      enablePanDownToClose
      onClose={onClose}
      backgroundStyle={styles.background}
      handleIndicatorStyle={styles.handleIndicator}
      backdropComponent={renderBackdrop}
    >
      <BottomSheetView style={styles.content}>{children}</BottomSheetView>
    </GorhomBottomSheet>
  )
}

const styles = StyleSheet.create({
  background: { backgroundColor: colors.surface, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, ...shadow.soft },
  handleIndicator: { backgroundColor: colors.border, width: 40, height: 5 },
  content: { paddingHorizontal: 20, paddingBottom: 32, paddingTop: 4 }
})
