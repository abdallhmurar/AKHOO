import type { PropsWithChildren, ReactNode } from 'react'
import { useEffect } from 'react'
import { Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native'
import { X } from 'phosphor-react-native'
import { useTranslation } from 'react-i18next'
import { IconButton } from '../../components/ui'
import { dirStyles, useIsRTL } from '../../lib/direction'
import { radius, shadow, space, useSanadTheme } from '../../lib/theme'
import { useAppTypography } from '../../lib/typography'

type HelperSheetProps = PropsWithChildren<{
  visible: boolean
  title: string
  onClose: () => void
  dismissible?: boolean
  footer?: ReactNode
}>

// A web-only sheet: keep the action and close control visible when notes scroll.
export function HelperSheet({ visible, title, onClose, dismissible = true, footer, children }: HelperSheetProps) {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const { i18n } = useTranslation()
  const language = (i18n.resolvedLanguage ?? i18n.language).split('-')[0]
  const closeLabel = language === 'en' ? 'Close' : language === 'he' ? 'סגירה' : 'إغلاق'

  useEffect(() => {
    if (!visible || !dismissible) return
    // Handle Escape even while the web modal's opening animation is running.
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [visible, dismissible, onClose])

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={dismissible ? onClose : undefined}>
      <View style={[styles.overlay, { backgroundColor: theme.colors.overlay }]}>
        <Pressable accessibilityRole="button" accessibilityLabel={closeLabel} disabled={!dismissible} onPress={onClose} style={StyleSheet.absoluteFill} />
        <SafeAreaView accessibilityViewIsModal accessibilityLabel={title} style={[styles.sheet, shadow.floating, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <View style={[styles.header, dirStyles(isRTL).row, { borderColor: theme.colors.border }]}>
            <Text accessibilityRole="header" style={[typography.h3, styles.title, { color: theme.colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{title}</Text>
            <IconButton label={closeLabel} disabled={!dismissible} size={44} icon={<X size={20} color={theme.colors.textSecondary} />} onPress={onClose} />
          </View>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
          {footer ? <View style={[styles.footer, { borderColor: theme.colors.border }]}>{footer}</View> : null}
        </SafeAreaView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  sheet: { width: '100%', maxWidth: 620, maxHeight: '90%', borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, borderWidth: 1, borderBottomWidth: 0, overflow: 'hidden' },
  header: { alignItems: 'center', gap: space.md, paddingHorizontal: space.lg, paddingVertical: space.sm, borderBottomWidth: StyleSheet.hairlineWidth, flexShrink: 0 },
  title: { flex: 1 },
  scroll: { flexShrink: 1 },
  content: { padding: space.xl, gap: space.lg },
  footer: { paddingHorizontal: space.lg, paddingTop: space.lg, paddingBottom: space.xl, gap: 4, borderTopWidth: StyleSheet.hairlineWidth, flexShrink: 0 }
})
