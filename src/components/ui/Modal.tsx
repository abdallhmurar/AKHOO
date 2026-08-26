import type { PropsWithChildren } from 'react'
import { Modal as NativeModal, Pressable, StyleSheet, Text, View } from 'react-native'
import { X } from 'phosphor-react-native'
import { useIsRTL } from '../../lib/direction'
import { radius, shadow, space, useSanadTheme } from '../../lib/theme'
import { useAppTypography } from '../../lib/typography'
import { IconButton } from './IconButton'
import { useLanguageDirection } from '../../providers/LanguageDirectionProvider'

export type ModalProps = PropsWithChildren<{
  visible: boolean
  onClose: () => void
  title?: string
  dismissible?: boolean
}>

export function Modal({ visible, onClose, title, dismissible = true, children }: ModalProps) {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const { language } = useLanguageDirection()
  const closeLabel = language === 'en' ? 'Close' : language === 'he' ? 'סגירה' : 'إغلاق'
  return (
    <NativeModal visible={visible} transparent animationType="fade" onRequestClose={dismissible ? onClose : undefined} statusBarTranslucent>
      <View style={[styles.overlay, { backgroundColor: theme.colors.overlay }]}>
        <Pressable accessibilityRole="button" accessibilityLabel={closeLabel} disabled={!dismissible} onPress={onClose} style={StyleSheet.absoluteFill} />
        <View accessibilityViewIsModal style={[styles.dialog, shadow.floating, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          {title || dismissible ? (
            <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              {title ? <Text style={[typography.h3, { color: theme.colors.textPrimary, flex: 1, textAlign: isRTL ? 'right' : 'left' }]}>{title}</Text> : <View style={styles.spacer} />}
              {dismissible ? <IconButton label={closeLabel} size={38} icon={<X size={19} color={theme.colors.textPrimary} />} onPress={onClose} /> : null}
            </View>
          ) : null}
          {children}
        </View>
      </View>
    </NativeModal>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl },
  dialog: { alignSelf: 'stretch', maxWidth: 440, maxHeight: '88%', borderRadius: radius.xl, padding: space.xl, borderWidth: StyleSheet.hairlineWidth, gap: space.lg },
  header: { alignItems: 'center', gap: space.md },
  spacer: { flex: 1 }
})
