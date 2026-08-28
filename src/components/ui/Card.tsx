import type { PropsWithChildren, ReactNode } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { dirStyles, useIsRTL } from '../../lib/direction'
import { palette, space, useSanadTheme } from '../../lib/theme'
import { useAppTypography } from '../../lib/typography'
import { Surface, type SurfaceProps } from './Surface'

export type CardProps = PropsWithChildren<SurfaceProps & {
  title?: string
  subtitle?: string
  leading?: ReactNode
  trailing?: ReactNode
  onPress?: () => void
  accessibilityLabel?: string
}>

export function Card({ title, subtitle, leading, trailing, onPress, accessibilityLabel, children, style, ...surfaceProps }: CardProps) {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const onNavy = surfaceProps.tone === 'navy'
  const content = (
    <Surface elevation="soft" {...surfaceProps} style={style}>
      {(leading || title || subtitle || trailing) ? (
        <View style={[styles.header, dirStyles(isRTL).row]}>
          {leading}
          <View style={styles.copy}>
            {title ? <Text style={[typography.title, { color: onNavy ? palette.onCivic : theme.colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{title}</Text> : null}
            {subtitle ? <Text style={[typography.small, { color: onNavy ? palette.onCivicMuted : theme.colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{subtitle}</Text> : null}
          </View>
          {trailing}
        </View>
      ) : null}
      {children ? <View style={(leading || title || subtitle || trailing) ? styles.content : undefined}>{children}</View> : null}
    </Surface>
  )
  if (!onPress) return content
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? title} onPress={onPress} style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}>
      {content}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', gap: space.md },
  copy: { flex: 1, gap: 2 },
  content: { marginTop: space.lg },
  pressable: { borderRadius: 18 },
  pressed: { opacity: 0.82, transform: [{ scale: 0.992 }] }
})
