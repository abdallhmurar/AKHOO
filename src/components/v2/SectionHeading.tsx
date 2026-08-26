import type { ReactNode } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useIsRTL } from '../../lib/direction'
import { space, useSanadTheme } from '../../lib/theme'
import { useAppTypography } from '../../lib/typography'

export function SectionHeading({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  return (
    <View style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
      <View style={styles.copy}>
        <Text style={[typography.h3, { color: theme.colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{title}</Text>
        {subtitle ? <Text style={[typography.small, { color: theme.colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{subtitle}</Text> : null}
      </View>
      {action}
    </View>
  )
}

const styles = StyleSheet.create({ row: { alignItems: 'flex-end', justifyContent: 'space-between', gap: space.md }, copy: { flex: 1, gap: 3 } })
