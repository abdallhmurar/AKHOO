import type { ReactNode } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import type { PressableProps, ViewStyle } from 'react-native'
import { useIsRTL } from '../../lib/direction'
import { radius, space, useSanadTheme } from '../../lib/theme'
import { useAppTypography } from '../../lib/typography'

export type ButtonVariant = 'primary' | 'community' | 'emergency' | 'reward' | 'secondary' | 'outline' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

export type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  label: string
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  fullWidth?: boolean
  leading?: ReactNode
  trailing?: ReactNode
  style?: ViewStyle
}

export function Button({ label, variant = 'primary', size = 'md', loading = false, fullWidth = true, leading, trailing, disabled, style, ...props }: ButtonProps) {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const fills: Record<ButtonVariant, string> = {
    primary: theme.colors.primary,
    community: theme.colors.community,
    emergency: theme.colors.emergency,
    reward: theme.colors.reward,
    secondary: theme.colors.surfaceMuted,
    outline: 'transparent',
    ghost: 'transparent',
    danger: theme.colors.emergency
  }
  const foregrounds: Record<ButtonVariant, string> = {
    primary: theme.colors.onPrimary,
    community: theme.colors.onCommunity,
    emergency: theme.colors.onEmergency,
    reward: theme.colors.onReward,
    secondary: theme.colors.textPrimary,
    outline: theme.colors.primary,
    ghost: theme.colors.primary,
    danger: theme.colors.onEmergency
  }
  const heights = { sm: 40, md: 50, lg: 58 }
  const blocked = disabled || loading
  return (
    <Pressable
      {...props}
      disabled={blocked}
      accessibilityRole="button"
      accessibilityLabel={props.accessibilityLabel ?? label}
      accessibilityState={{ disabled: blocked, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        { minHeight: heights[size], backgroundColor: blocked ? theme.colors.disabledBackground : fills[variant], borderColor: variant === 'outline' ? theme.colors.borderStrong : 'transparent' },
        fullWidth && styles.full,
        variant === 'outline' && styles.outline,
        pressed && !blocked && styles.pressed,
        style
      ]}
    >
      <View style={[styles.content, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        {loading ? <ActivityIndicator size="small" color={blocked ? theme.colors.disabledContent : foregrounds[variant]} /> : leading}
        <Text numberOfLines={1} style={[typography.button, { color: blocked ? theme.colors.disabledContent : foregrounds[variant] }]}>{label}</Text>
        {!loading ? trailing : null}
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: { borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.xl, borderWidth: 0 },
  full: { alignSelf: 'stretch' },
  outline: { borderWidth: 1 },
  content: { alignItems: 'center', justifyContent: 'center', gap: space.sm },
  pressed: { opacity: 0.88, transform: [{ scale: 0.985 }] }
})
