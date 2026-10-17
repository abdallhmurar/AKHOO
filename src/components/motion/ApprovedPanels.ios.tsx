import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { ArrowLeft, ArrowRight, Camera } from 'phosphor-react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useTranslation } from 'react-i18next'
import { HelperMedal } from '../HelperMedal'
import { ArtIcon, MotionHeader } from './Motion.ios'
import { dirStyles, useIsRTL } from '../../lib/direction'
import { useAppTypography } from '../../lib/typography'
import { useSanadTheme } from '../../lib/theme'
import type { IdentityProps, PointsPanelProps } from './ApprovedPanels.types'

export function AccountIdentity({ name, email, avatar, busy, onPhoto, onEdit }: IdentityProps) {
  const { t } = useTranslation()
  const theme = useSanadTheme()
  const type = useAppTypography()
  const isRTL = useIsRTL()
  const Arrow = isRTL ? ArrowLeft : ArrowRight
  const text = { textAlign: isRTL ? 'right' as const : 'left' as const }
  return <LinearGradient colors={theme.isDark ? ['#194152', '#152d40'] : ['#e6f6fb', '#ffffff']} style={[styles.identity, dirStyles(isRTL).row, { borderColor: theme.colors.border }]}>
    <Pressable accessibilityRole="button" accessibilityLabel={t('account.menu.profile')} accessibilityState={{ disabled: busy, busy }} onPress={onPhoto} disabled={busy} style={styles.avatarButton}>
      <View style={styles.avatarFrame}>{avatar ? <Image source={{ uri: avatar }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : <ArtIcon name="person" size={56} />}</View>
      <View style={[styles.camera, { [isRTL ? 'left' : 'right']: -3 }]}><Camera size={15} color="#fff" /></View>
    </Pressable>
    <View style={styles.copy}><Text style={[type.h3, text, { color: theme.colors.textPrimary }]}>{name}</Text><Text style={[type.caption, text, { color: theme.colors.textMuted, writingDirection: 'ltr' }]}>{email}</Text>
      <Pressable accessibilityRole="button" onPress={onEdit} style={[styles.edit, dirStyles(isRTL).row]}><Text style={[type.caption, { color: theme.colors.primary }]}>{t('account.menu.profile')}</Text><Arrow size={14} color={theme.colors.primary} /></Pressable>
    </View>
  </LinearGradient>
}
export function AccountHeading({ title, subtitle }: { title: string; subtitle: string }) {
  const theme = useSanadTheme(), type = useAppTypography(), isRTL = useIsRTL()
  return <MotionHeader><Text accessibilityRole="header" style={[type.h1, { color: theme.colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{title}</Text><Text style={[type.small, { color: theme.colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>{subtitle}</Text></MotionHeader>
}
export function PointsPanel({ balance, count, target, level, levelLabel, remainingLabel }: PointsPanelProps) {
  const { t } = useTranslation()
  const theme = useSanadTheme(), type = useAppTypography(), isRTL = useIsRTL()
  const text = { textAlign: isRTL ? 'right' as const : 'left' as const }
  return <LinearGradient colors={theme.isDark ? ['#194152', '#152d40'] : ['#eaf8ff', '#ffffff']} style={[styles.points, { borderColor: theme.colors.border }]}>
    <View style={[styles.balanceRow, dirStyles(isRTL).row]}><View style={styles.copy}><Text style={[type.small, text, { color: theme.colors.textSecondary }]}>{t('perks.pointsCard.balanceLabel')}</Text><Text style={[type.h1, text, { fontSize: 38, lineHeight: 52, color: theme.colors.primary }]}>{balance}</Text><Text style={[type.caption, text, { color: theme.colors.textMuted }]}>{t('perks.pointsUnit')}</Text></View><HelperMedal level={level} size={96} /></View>
    <Text style={[type.h3, text, { color: theme.colors.textPrimary }]}>{levelLabel}</Text><Text style={[type.small, text, { color: theme.colors.textSecondary }]}>{remainingLabel}</Text>
    <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: target, now: Math.min(count, target) }} accessibilityLabel={t('perks.pointsCard.levelLabel')} style={[styles.track, { backgroundColor: theme.colors.border, alignItems: isRTL ? 'flex-end' : 'flex-start' }]}><View style={{ height: '100%', width: `${Math.min(count / Math.max(target, 1), 1) * 100}%`, borderRadius: 5, backgroundColor: theme.colors.community }} /></View>
    <Text style={[type.caption, text, { color: theme.colors.textMuted }]}>{t('perks.helpProgress', { count, target })}</Text>
  </LinearGradient>
}
const styles = StyleSheet.create({
  identity: { borderRadius: 24, borderWidth: 1, padding: 18, gap: 17, alignItems: 'center' },
  avatarButton: { width: 79, height: 79, flexShrink: 0 },
  avatarFrame: { flex: 1, borderRadius: 26, borderWidth: 2, borderColor: '#fff', overflow: 'hidden', backgroundColor: '#d9f1ff', alignItems: 'center', justifyContent: 'center' },
  camera: { position: 'absolute', bottom: -3, width: 27, height: 27, borderRadius: 10, borderWidth: 2, borderColor: '#fff', backgroundColor: '#078fbc', alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, minWidth: 0, gap: 4 }, edit: { minHeight: 44, alignItems: 'center', gap: 5 },
  points: { padding: 20, borderWidth: 1, borderRadius: 25, gap: 8 }, balanceRow: { alignItems: 'center', gap: 12 },
  track: { height: 8, borderRadius: 4, overflow: 'hidden', marginTop: 6 },
})
