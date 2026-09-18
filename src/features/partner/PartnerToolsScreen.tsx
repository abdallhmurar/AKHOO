import { useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Redirect } from 'expo-router'
import { ArrowClockwise, ClockCounterClockwise, QrCode, Storefront, Tag, UsersThree } from 'phosphor-react-native'
import { useTranslation } from 'react-i18next'
import { AppScreen, ListRow, ScreenHeader } from '../../components/v2'
import { BottomSheet, Card, ErrorState, IconButton, Skeleton, StatusBadge } from '../../components/ui'
import { useIsRTL } from '../../lib/direction'
import { radius, space, useSanadTheme } from '../../lib/theme'
import { useAppTypography } from '../../lib/typography'
import { usePartnerAccess } from './usePartnerAccess'

const TOOL_ENTRIES = [
  { key: 'scanner', Icon: QrCode },
  { key: 'history', Icon: ClockCounterClockwise },
  { key: 'customers', Icon: UsersThree },
  { key: 'offers', Icon: Tag }
] as const

export function PartnerToolsScreen() {
  const { t } = useTranslation()
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const { status, access, refetch } = usePartnerAccess()
  const [selectedTool, setSelectedTool] = useState<(typeof TOOL_ENTRIES)[number]['key'] | null>(null)
  const header = <ScreenHeader title={t('partnerTools.title')} back />

  if (status === 'denied') return <Redirect href="/(tabs)/account" />
  if (status === 'checking') return <AppScreen header={header}><Skeleton height={150} /><Skeleton height={260} /></AppScreen>
  if (status === 'error') return (
    <AppScreen header={header}>
      <ErrorState title={t('partnerTools.loadErrorTitle')} message={t('partnerTools.loadErrorMessage')} actionLabel={t('common.retry')} onAction={() => { void refetch() }} />
    </AppScreen>
  )
  if (!access) return null

  return (
    <AppScreen header={<ScreenHeader title={t('partnerTools.title')} back trailing={<IconButton label={t('partnerTools.refresh')} icon={<ArrowClockwise size={20} color={theme.colors.primary} />} onPress={() => { void refetch() }} />} />}>
      <Card title={access.business_name} leading={<Storefront size={24} color={theme.colors.primary} weight="duotone" />} elevation="none">
        <View style={styles.context}>
          <Text style={[typography.small, { color: theme.colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
            {t('partnerTools.roleLabel', { role: t(`partnerTools.roles.${access.role}`) })}
          </Text>
          <StatusBadge label={t('partnerTools.active')} tone="success" />
        </View>
      </Card>
      <View style={[styles.menu, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        {TOOL_ENTRIES.map(({ key, Icon }) => (
          <ListRow key={key} Icon={Icon} title={t(`partnerTools.tools.${key}`)} subtitle={t('partnerTools.comingSoon')} onPress={() => setSelectedTool(key)} />
        ))}
      </View>
      <BottomSheet visible={selectedTool !== null} onClose={() => setSelectedTool(null)} title={selectedTool ? t(`partnerTools.tools.${selectedTool}`) : ''} subtitle={t('partnerTools.futureToolMessage')} />
    </AppScreen>
  )
}

const styles = StyleSheet.create({
  context: { gap: space.sm },
  menu: { borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.lg, paddingHorizontal: space.lg }
})
