import type { ReactNode } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { CloudSlash, WarningCircle, WifiSlash } from 'phosphor-react-native'
import { useIsRTL } from '../../lib/direction'
import { space, useSanadTheme } from '../../lib/theme'
import { useAppTypography } from '../../lib/typography'
import { Button } from './Button'
import { Surface } from './Surface'

type StateProps = {
  title: string
  message: string
  actionLabel?: string
  onAction?: () => void
  icon?: ReactNode
}

function StateView({ title, message, actionLabel, onAction, icon }: StateProps) {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  return (
    <View style={styles.wrap}>
      {icon}
      <Text style={[typography.h2, { color: theme.colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{title}</Text>
      <Text style={[typography.body, { color: theme.colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{message}</Text>
      {actionLabel && onAction ? <Button label={actionLabel} variant="outline" onPress={onAction} /> : null}
    </View>
  )
}

export function EmptyState(props: StateProps) {
  const theme = useSanadTheme()
  return <Surface padding="xxl" bordered={false} tone="muted"><StateView {...props} icon={props.icon ?? <CloudSlash size={38} color={theme.colors.textMuted} weight="duotone" />} /></Surface>
}

export function ErrorState(props: StateProps) {
  const theme = useSanadTheme()
  return <Surface padding="xxl" tone="emergency"><StateView {...props} icon={props.icon ?? <WarningCircle size={38} color={theme.colors.danger} weight="duotone" />} /></Surface>
}

export function OfflineState(props: StateProps) {
  const theme = useSanadTheme()
  return <Surface padding="xxl" tone="muted"><StateView {...props} icon={props.icon ?? <WifiSlash size={38} color={theme.colors.textSecondary} weight="duotone" />} /></Surface>
}

const styles = StyleSheet.create({ wrap: { alignItems: 'center', gap: space.md } })
