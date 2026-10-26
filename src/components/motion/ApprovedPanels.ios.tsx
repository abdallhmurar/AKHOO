import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { ArrowLeft, ArrowRight, Camera } from 'phosphor-react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useTranslation } from 'react-i18next'
import { ArtIcon, MotionHeader } from './Motion.ios'
import { dirStyles, useIsRTL } from '../../lib/direction'
import { useAppTypography } from '../../lib/typography'
import { useSanadTheme } from '../../lib/theme'
import type { IdentityProps } from './ApprovedPanels.types'

export { LivePointsCard as PointsPanel } from './LivePointsCard'

export function AccountIdentity({ name, email, avatar, busy, onPhoto, onEdit }: IdentityProps) {
  const { t } = useTranslation()
  const theme = useSanadTheme()
  const type = useAppTypography()
  const isRTL = useIsRTL()
  const Arrow = isRTL ? ArrowLeft : ArrowRight
  const text = { textAlign: isRTL ? 'right' as const : 'left' as const }
  return <LinearGradient colors={theme.isDark ? ['#194152', '#152d40'] : ['#e6f6fb', '#ffffff']} style={[styles.identity, dirStyles(isRTL).row, { borderColor: theme.colors.border }]}>
    <Pressable accessibilityRole="button" accessibilityLabel={t('account.menu.profile')} accessibilityState={{ disabled: busy, busy }} onPress={onPhoto} disabled={busy} style={styles.avatarButton}>
      <View style={styles.avatarFrame}>{avatar ? <Image source={{ uri: avatar }} style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]} resizeMode="cover" /> : <ArtIcon name="person" size={56} />}</View>
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
const styles = StyleSheet.create({
  identity: { borderRadius: 24, borderWidth: 1, padding: 18, gap: 17, alignItems: 'center' },
  avatarButton: { width: 79, height: 79, flexShrink: 0 },
  avatarFrame: { flex: 1, borderRadius: 26, borderWidth: 2, borderColor: '#fff', overflow: 'hidden', backgroundColor: '#d9f1ff', alignItems: 'center', justifyContent: 'center' },
  camera: { position: 'absolute', bottom: -3, width: 27, height: 27, borderRadius: 10, borderWidth: 2, borderColor: '#fff', backgroundColor: '#078fbc', alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, minWidth: 0, gap: 4 }, edit: { minHeight: 44, alignItems: 'center', gap: 5 },
})
