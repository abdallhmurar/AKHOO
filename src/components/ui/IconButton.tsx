import type { ReactNode } from 'react'
import { Pressable, StyleSheet } from 'react-native'
import type { PressableProps, ViewStyle } from 'react-native'
import { radius, useSanadTheme } from '../../lib/theme'

export type IconButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  icon: ReactNode
  label: string
  size?: number
  tone?: 'default' | 'primary' | 'community' | 'emergency' | 'navy'
  style?: ViewStyle
}

export function IconButton({ icon, label, size = 44, tone = 'default', disabled, style, ...props }: IconButtonProps) {
  const theme = useSanadTheme()
  const fills = {
    default: theme.colors.surface,
    primary: theme.colors.primarySoft,
    community: theme.colors.communitySoft,
    emergency: theme.colors.emergencySoft,
    navy: theme.colors.textPrimary
  }
  return (
    <Pressable
      {...props}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      hitSlop={8}
      style={({ pressed }) => [styles.base, { width: size, height: size, backgroundColor: disabled ? theme.colors.disabledBackground : fills[tone], borderColor: theme.colors.border }, pressed && !disabled && styles.pressed, style]}
    >
      {icon}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: { borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth },
  pressed: { opacity: 0.76, transform: [{ scale: 0.94 }] }
})
