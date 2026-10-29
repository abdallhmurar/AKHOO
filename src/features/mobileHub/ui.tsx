import type { PropsWithChildren } from 'react'
import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { CaretLeft, CaretRight, Check, Ticket } from 'phosphor-react-native'
import { LinearGradient } from 'expo-linear-gradient'
import Svg, { Path } from 'react-native-svg'
import { useTranslation } from 'react-i18next'
import { dirStyles, useIsRTL } from '../../lib/direction'
import { useAppFont } from '../../lib/typography'
import { useSanadTheme } from '../../lib/theme'

export function useHubStyle() {
  const theme = useSanadTheme()
  const rtl = useIsRTL()
  const regular = useAppFont('regular'), medium = useAppFont('medium'), bold = useAppFont('bold'), heavy = useAppFont('extraBold')
  return {
    theme, rtl, row: dirStyles(rtl).row,
    background: theme.isDark ? theme.colors.background : '#f2fbff',
    title: { fontFamily: heavy, fontSize: 24, lineHeight: 36, color: theme.colors.textPrimary, textAlign: rtl ? 'right' as const : 'left' as const },
    heading: { fontFamily: bold, fontSize: 20, lineHeight: 32, color: theme.colors.textPrimary, textAlign: rtl ? 'right' as const : 'left' as const },
    body: { fontFamily: medium, fontSize: 14, lineHeight: 23, color: theme.colors.textPrimary, textAlign: rtl ? 'right' as const : 'left' as const },
    small: { fontFamily: regular, fontSize: 12, lineHeight: 20, color: theme.colors.textSecondary, textAlign: rtl ? 'right' as const : 'left' as const },
    numeric: { fontFamily: 'Inter_800ExtraBold', color: theme.colors.textPrimary, textAlign: rtl ? 'right' as const : 'left' as const },
  }
}

export function HubHeader({ title, actionLabel, onAction, icon }: { title: string; actionLabel: string; onAction: () => void; icon: React.ReactNode }) {
  const h = useHubStyle()
  return <View style={[ui.header, h.row]}><Text accessibilityRole="header" style={[h.title, ui.flex]}>{title}</Text><Pressable accessibilityRole="button" accessibilityLabel={actionLabel} onPress={onAction} style={({ pressed }) => [ui.iconButton, { backgroundColor: h.theme.colors.primarySoft, opacity: pressed ? 0.65 : 1 }]}>{icon}</Pressable></View>
}

export function HubTabs<T extends string>({ value, options, onChange, teal = false, disabled = false }: { value: T; options: { value: T; label: string }[]; onChange: (value: T) => void; teal?: boolean; disabled?: boolean }) {
  const h = useHubStyle()
  return <View accessibilityRole="tablist" style={[ui.tabs, h.row, { backgroundColor: h.theme.colors.surface, borderColor: h.theme.colors.border }]}>{options.map(option => <Pressable key={option.value} accessibilityRole="tab" accessibilityState={{ selected: value === option.value, disabled }} disabled={disabled} onPress={() => onChange(option.value)} style={({ pressed }) => [ui.tab, { backgroundColor: value === option.value ? teal ? '#087c75' : h.theme.colors.primarySoft : 'transparent', opacity: pressed || disabled ? 0.6 : 1 }]}><Text style={[h.body, { textAlign: 'center', color: value === option.value ? teal ? '#fff' : h.theme.colors.primary : h.theme.colors.textSecondary }]}>{option.label}</Text></Pressable>)}</View>
}

export function HubAction({ label, onPress, subtle = false }: { label: string; onPress: () => void; subtle?: boolean }) {
  const h = useHubStyle(), Arrow = h.rtl ? CaretLeft : CaretRight
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [ui.action, h.row, { backgroundColor: subtle ? h.theme.colors.primarySoft : '#0875f5', opacity: pressed ? 0.8 : 1 }]}><Text style={[h.body, { color: subtle ? h.theme.colors.primary : '#fff', textAlign: 'center', flex: 1 }]}>{label}</Text><Arrow size={20} color={subtle ? h.theme.colors.primary : '#fff'} /></Pressable>
}

export function HubNotice({ children }: PropsWithChildren) {
  const h = useHubStyle()
  return <View style={[ui.notice, { backgroundColor: h.theme.colors.surface, borderColor: h.theme.colors.border }]}>{children}</View>
}

export function PointsWallet({ balance }: { balance: number }) {
  const h = useHubStyle(), { t } = useTranslation()
  return <LinearGradient colors={['#0866f4', '#078aeb']} start={{ x: 0, y: 1 }} end={{ x: 1, y: 0 }} style={ui.wallet}>
    <View pointerEvents="none" accessible={false} style={StyleSheet.absoluteFill}><Svg width="100%" height="100%" viewBox="0 0 400 210" preserveAspectRatio="none">{[0, 26, 52, 78, 104, 130].map(n => <Path key={n} d={`M${80 + n} -20 C ${300 + n} 100, ${30 + n} 90, ${160 + n} 240`} stroke="#ffffff17" fill="none" strokeWidth={1} />)}</Svg></View>
    <View style={[ui.walletTop, h.row]}><View style={ui.flex}><Text style={[h.body, { color: '#e7f3ff' }]}>{t('mobileHub.fromHelp')}</Text><Text adjustsFontSizeToFit numberOfLines={1} style={[h.numeric, ui.balance]}>{balance.toLocaleString()}</Text><Text style={[h.body, { color: '#fff' }]}>{t('perks.pointsUnit')}</Text></View><View accessible={false} style={ui.walletArt}><Ticket size={92} color="#e9f6ff" weight="fill" style={ui.backTicket} /><Image source={require('../../../assets/images/perks-coupon-icon.png')} style={ui.coupon} resizeMode="contain" accessible={false} /></View></View>
    <View style={[ui.walletFoot, h.row]}><Check size={21} color="#087c75" weight="bold" /><Text style={[h.body, { color: '#153854', flexShrink: 1 }]}>{t('mobileHub.pointsUnlock')}</Text></View>
  </LinearGradient>
}

export const ui = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingTop: 12, gap: 16 },
  flex: { flex: 1, minWidth: 0 },
  header: { alignItems: 'center', gap: 12, minHeight: 48 },
  iconButton: { width: 44, height: 44, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  tabs: { padding: 3, borderWidth: 1, borderRadius: 28, alignSelf: 'stretch', gap: 3 },
  tab: { flex: 1, minWidth: 0, minHeight: 44, paddingVertical: 6, paddingHorizontal: 8, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  action: { minHeight: 48, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 25, alignItems: 'center', gap: 8 },
  notice: { padding: 18, gap: 12, borderRadius: 20, borderWidth: 1 },
  wallet: { padding: 14, borderRadius: 26, overflow: 'hidden', gap: 12 },
  walletTop: { alignItems: 'center', gap: 8, paddingHorizontal: 6 },
  balance: { color: '#fff', fontSize: 52, lineHeight: 64 },
  walletArt: { width: 135, height: 130, alignItems: 'center', justifyContent: 'center' },
  backTicket: { position: 'absolute', top: 4, left: 10, transform: [{ rotate: '-18deg' }] },
  coupon: { width: 142, height: 142, transform: [{ rotate: '-12deg' }], marginTop: 20 },
  walletFoot: { minHeight: 42, borderRadius: 18, backgroundColor: '#e5f3ff', paddingVertical: 8, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center', gap: 8 },
})
