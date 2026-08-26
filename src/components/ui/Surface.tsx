import type { PropsWithChildren } from 'react'
import { StyleSheet, View } from 'react-native'
import type { ViewProps, ViewStyle } from 'react-native'
import { civicColors, radius, shadow, space, useSanadTheme } from '../../lib/theme'

export type SurfaceTone = 'default' | 'muted' | 'primary' | 'community' | 'emergency' | 'reward' | 'navy'
export type SurfaceElevation = keyof typeof shadow

export type SurfaceProps = PropsWithChildren<ViewProps & {
  tone?: SurfaceTone
  elevation?: SurfaceElevation
  padding?: keyof typeof space | number
  radiusSize?: keyof typeof radius | number
  bordered?: boolean
}>

export function Surface({ children, tone = 'default', elevation = 'none', padding = 'lg', radiusSize = 'lg', bordered = true, style, ...props }: SurfaceProps) {
  const theme = useSanadTheme()
  const backgrounds: Record<SurfaceTone, string> = {
    default: theme.colors.surface,
    muted: theme.colors.surfaceMuted,
    primary: theme.colors.primarySoft,
    community: theme.colors.communitySoft,
    emergency: theme.colors.emergencySoft,
    reward: theme.colors.rewardSoft,
    navy: civicColors.navy
  }
  const paddingValue = typeof padding === 'number' ? padding : space[padding]
  const radiusValue = typeof radiusSize === 'number' ? radiusSize : radius[radiusSize]
  return (
    <View
      {...props}
      style={[
        styles.base,
        { backgroundColor: backgrounds[tone], padding: paddingValue, borderRadius: radiusValue },
        bordered && { borderColor: theme.colors.border, borderWidth: StyleSheet.hairlineWidth },
        elevation !== 'none' && shadow[elevation],
        style as ViewStyle
      ]}
    >
      {children}
    </View>
  )
}

const styles = StyleSheet.create({ base: { overflow: 'hidden' } })
