import { SettingsIcon } from './SettingsIcon'
import type { Icon } from 'phosphor-react-native'
import { CaretLeft, CaretRight, UserCircle, Globe, Compass, Moon } from 'phosphor-react-native'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { ReactNode } from 'react'
import { dirStyles, useIsRTL } from '../../lib/direction'
import { space, useSanadTheme } from '../../lib/theme'
import { useAppTypography } from '../../lib/typography'

export function ListRow({ title, subtitle, Icon, tone = 'primary', onPress, trailing, destructive = false }: { title: string; subtitle?: string; Icon?: Icon; tone?: 'primary' | 'community' | 'reward' | 'neutral'; onPress?: () => void; trailing?: ReactNode; destructive?: boolean }) {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const Arrow = isRTL ? CaretLeft : CaretRight
  const colors = { primary: theme.colors.primary, community: theme.colors.community, reward: theme.colors.rewardPressed, neutral: theme.colors.textSecondary }
  const color = destructive ? theme.colors.danger : colors[tone]
  const artwork = Icon === UserCircle ? 'person' : Icon === Globe ? 'globe' : Icon === Compass ? 'compass' : Icon === Moon ? 'moon' : null
  return (
    <Pressable accessibilityRole={onPress ? 'button' : undefined} disabled={!onPress} onPress={onPress} style={({ pressed }) => [styles.row, { ...dirStyles(isRTL).row, borderColor: theme.colors.border }, pressed && styles.pressed]}>
      {({ pressed }) => <>{Icon ? <SettingsIcon Icon={Icon} artwork={artwork} color={color} pressed={pressed} /> : null}
      <View style={styles.copy}>
        <Text style={[typography.bodyMedium, { color: destructive ? theme.colors.danger : theme.colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{title}</Text>
        {subtitle ? <Text style={[typography.caption, { color: theme.colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{subtitle}</Text> : null}
      </View>
      {trailing ?? (onPress ? <Arrow size={17} color={theme.colors.textMuted} /> : null)}
    </>}</Pressable>
  )
}

const styles = StyleSheet.create({ row: { minHeight: 64, alignItems: 'center', gap: space.md, paddingVertical: 9, borderBottomWidth: StyleSheet.hairlineWidth }, copy: { flex: 1, gap: 2 }, pressed: { opacity: 0.88 } })
