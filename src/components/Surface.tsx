import type { PropsWithChildren } from 'react'
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native'
import { colors, radius, shadow, space } from '../lib/theme'

// Base elevated container (design brief section 35: "BaseSurface"). Screens
// should build their own semantic card variants on top of this rather than
// each inventing their own card styling from scratch.
export function Surface({
  elevation = 'soft',
  padding = 'lg',
  tone = 'surface',
  style,
  children
}: PropsWithChildren<{
  elevation?: 'none' | 'soft' | 'elevated' | 'floating'
  padding?: 'none' | 'md' | 'lg' | 'xl'
  tone?: 'surface' | 'muted' | 'brand' | 'accent'
  style?: StyleProp<ViewStyle>
}>) {
  return (
    <View
      style={[
        styles.base,
        paddingStyles[padding],
        toneStyles[tone],
        elevation !== 'none' ? shadow[elevation] : null,
        style
      ]}
    >
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  base: { borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border }
})

const paddingStyles = StyleSheet.create({
  none: {},
  md: { padding: space.md },
  lg: { padding: space.lg },
  xl: { padding: space.xl }
})

const toneStyles = StyleSheet.create({
  surface: { backgroundColor: colors.surface, borderColor: colors.border },
  muted: { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
  brand: { backgroundColor: colors.forest, borderColor: colors.forestPressed },
  accent: { backgroundColor: colors.sageSoft, borderColor: colors.sageSoft }
})
