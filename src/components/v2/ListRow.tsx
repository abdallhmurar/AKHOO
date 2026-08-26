import type { Icon } from 'phosphor-react-native'
import { CaretLeft, CaretRight } from 'phosphor-react-native'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { ReactNode } from 'react'
import { useIsRTL } from '../../lib/direction'
import { radius, space, useSanadTheme } from '../../lib/theme'
import { useAppTypography } from '../../lib/typography'

export function ListRow({ title, subtitle, Icon, tone = 'primary', onPress, trailing, destructive = false }: { title: string; subtitle?: string; Icon?: Icon; tone?: 'primary' | 'community' | 'reward' | 'neutral'; onPress?: () => void; trailing?: ReactNode; destructive?: boolean }) {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const Arrow = isRTL ? CaretLeft : CaretRight
  const colors = { primary: theme.colors.primary, community: theme.colors.community, reward: theme.colors.rewardPressed, neutral: theme.colors.textSecondary }
  const color = destructive ? theme.colors.danger : colors[tone]
  return (
    <Pressable accessibilityRole={onPress ? 'button' : undefined} disabled={!onPress} onPress={onPress} style={({ pressed }) => [styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row', borderColor: theme.colors.border }, pressed && styles.pressed]}>
      {Icon ? <View style={[styles.icon, { backgroundColor: destructive ? theme.colors.dangerSoft : `${color}12` }]}><Icon size={21} color={color} weight="duotone" /></View> : null}
      <View style={styles.copy}>
        <Text style={[typography.bodyMedium, { color: destructive ? theme.colors.danger : theme.colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{title}</Text>
        {subtitle ? <Text style={[typography.caption, { color: theme.colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{subtitle}</Text> : null}
      </View>
      {trailing ?? (onPress ? <Arrow size={17} color={theme.colors.textMuted} /> : null)}
    </Pressable>
  )
}

const styles = StyleSheet.create({ row: { minHeight: 66, alignItems: 'center', gap: space.md, paddingVertical: space.md, borderBottomWidth: StyleSheet.hairlineWidth }, icon: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' }, copy: { flex: 1, gap: 2 }, pressed: { opacity: 0.68 } })
