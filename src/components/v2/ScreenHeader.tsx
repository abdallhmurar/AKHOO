import type { ReactNode } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { ArrowLeft, ArrowRight } from 'phosphor-react-native'
import { useRouter } from 'expo-router'
import { useIsRTL } from '../../lib/direction'
import { space, useSanadTheme } from '../../lib/theme'
import { useAppTypography } from '../../lib/typography'
import { IconButton } from '../ui'
import { useLanguageDirection } from '../../providers/LanguageDirectionProvider'

export function ScreenHeader({ title, subtitle, back = false, trailing, onBack }: { title: string; subtitle?: string; back?: boolean; trailing?: ReactNode; onBack?: () => void }) {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const { language } = useLanguageDirection()
  const router = useRouter()
  const BackIcon = isRTL ? ArrowRight : ArrowLeft
  return (
    <View style={[styles.header, { borderColor: theme.colors.border, backgroundColor: theme.colors.background, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
      {back ? <IconButton label={language === 'en' ? 'Back' : language === 'he' ? 'חזרה' : 'العودة'} size={42} icon={<BackIcon size={21} color={theme.colors.textPrimary} />} onPress={onBack ?? (() => router.back())} /> : null}
      <View style={styles.copy}>
        <Text numberOfLines={1} style={[typography.h3, { color: theme.colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{title}</Text>
        {subtitle ? <Text numberOfLines={1} style={[typography.caption, { color: theme.colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{subtitle}</Text> : null}
      </View>
      {trailing ?? (back ? null : <View style={styles.placeholder} />)}
    </View>
  )
}

const styles = StyleSheet.create({
  header: { minHeight: 68, paddingHorizontal: space.xl, paddingVertical: space.md, alignItems: 'center', gap: space.md, borderBottomWidth: StyleSheet.hairlineWidth },
  copy: { flex: 1, gap: 1 },
  placeholder: { width: 42 }
})
