import type { PropsWithChildren } from 'react'
import { Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useIsRTL } from '../../lib/direction'
import { radius, shadow, space, useSanadTheme } from '../../lib/theme'
import { useAppTypography } from '../../lib/typography'
import { useLanguageDirection } from '../../providers/LanguageDirectionProvider'

export type BottomSheetProps = PropsWithChildren<{
  visible: boolean
  onClose: () => void
  title?: string
  subtitle?: string
  scrollable?: boolean
  dismissible?: boolean
}>

export function BottomSheet({ visible, onClose, title, subtitle, scrollable = true, dismissible = true, children }: BottomSheetProps) {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const { language } = useLanguageDirection()
  const closeLabel = language === 'en' ? 'Close' : language === 'he' ? 'סגירה' : 'إغلاق'
  const body = (
    <>
      <View style={[styles.handle, { backgroundColor: theme.colors.borderStrong }]} />
      {title ? <Text style={[typography.h2, { color: theme.colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{title}</Text> : null}
      {subtitle ? <Text style={[typography.body, { color: theme.colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{subtitle}</Text> : null}
      {children}
    </>
  )
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={dismissible ? onClose : undefined} statusBarTranslucent>
      <View style={[styles.overlay, { backgroundColor: theme.colors.overlay }]}>
        <Pressable accessibilityRole="button" accessibilityLabel={closeLabel} disabled={!dismissible} onPress={onClose} style={StyleSheet.absoluteFill} />
        <SafeAreaView accessibilityViewIsModal style={[styles.sheet, shadow.floating, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          {scrollable ? <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>{body}</ScrollView> : <View style={styles.content}>{body}</View>}
        </SafeAreaView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: { maxHeight: '92%', borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, borderWidth: StyleSheet.hairlineWidth, borderBottomWidth: 0 },
  content: { paddingHorizontal: space.xl, paddingTop: space.md, paddingBottom: space.xxl, gap: space.md },
  handle: { alignSelf: 'center', width: 44, height: 5, borderRadius: radius.pill, marginBottom: space.md }
})
