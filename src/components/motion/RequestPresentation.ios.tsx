import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { ArrowLeft, ArrowRight, Check } from 'phosphor-react-native'
import { useTranslation } from 'react-i18next'
import { LinearGradient } from 'expo-linear-gradient'
import { dirStyles, useIsRTL } from '../../lib/direction'
import { useAppTypography } from '../../lib/typography'
import { useSanadTheme } from '../../lib/theme'
import { MotionScene } from './Motion.ios'
import { motionImages } from './media.ios'
import { BlendedArt } from './BlendedArt.ios'

export function FlowHeader({ onBack, step }: { onBack: () => void; step?: number }) {
  const { t } = useTranslation()
  const isRTL = useIsRTL()
  const theme = useSanadTheme()
  const type = useAppTypography()
  const Back = isRTL ? ArrowRight : ArrowLeft
  return <View style={[styles.topbar, dirStyles(isRTL).row]}>
    <Pressable accessibilityRole="button" accessibilityLabel={t('common.back')} onPress={onBack} style={[styles.back, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}><Back size={21} color={theme.colors.textPrimary} /></Pressable>
    {step ? <View style={styles.progress}><View style={[styles.segments, dirStyles(isRTL).row]}>{[1, 2, 3].map(n => <View key={n} style={[styles.segment, { backgroundColor: n <= step ? theme.colors.primary : theme.colors.border }]} />)}</View><Text style={[type.caption, { color: theme.colors.textMuted }]}>{t('request.step.details.stepOf', { current: step, total: 3 })}</Text></View> : null}
  </View>
}
export function RequestHeading({ title, subtitle, selection = false }: { title: string; subtitle: string; selection?: boolean }) {
  const theme = useSanadTheme()
  const type = useAppTypography()
  const isRTL = useIsRTL()
  return <View style={[styles.heading, selection && { minHeight: 160 }]}>
    <View style={StyleSheet.absoluteFill}><BlendedArt edge="bottom" start={0.8}><Image source={selection ? motionImages.request : motionImages.details} style={[StyleSheet.absoluteFill, { width: '100%', height: '100%', opacity: theme.isDark ? 0.24 : selection ? 1 : 0.3, transform: [{ scaleX: selection && !isRTL ? -1 : 1 }] }]} resizeMode="cover" accessible={false} /></BlendedArt></View>
    <View style={[styles.headingCopy, selection && { width: '65%', alignSelf: isRTL ? 'flex-end' : 'flex-start' }]}>
      <Text accessibilityRole="header" style={[type.h1, { fontSize: 23, color: theme.colors.textPrimary, textAlign: selection ? isRTL ? 'right' : 'left' : 'center' }]}>{title}</Text>
      <Text style={[type.small, { color: theme.colors.textSecondary, textAlign: selection ? isRTL ? 'right' : 'left' : 'center' }]}>{subtitle}</Text>
    </View>
  </View>
}
export function RequestChoice({ kind, title, description, selected, onSelect }: { kind: string; title: string; description: string; selected: boolean; onSelect: () => void }) {
  const theme = useSanadTheme()
  const type = useAppTypography()
  const isRTL = useIsRTL()
  const tone = kind === 'fuel' ? '#fff7e9' : kind === 'tire' ? '#fff0f2' : kind === 'other' ? '#eef9f5' : '#edf6ff'
  return <Pressable accessibilityRole="radio" accessibilityState={{ checked: selected }} accessibilityLabel={title} accessibilityHint={description} onPress={onSelect} style={({ pressed }) => [styles.choice, { borderColor: selected ? theme.colors.primary : theme.colors.border, backgroundColor: theme.colors.surface, transform: [{ scale: pressed ? 0.985 : 1 }] }]}>
    <LinearGradient colors={theme.isDark ? ['#173549', '#162c40'] : [tone, '#ffffff']} style={[styles.choiceBody, dirStyles(isRTL).row]}>
      <View style={[styles.choiceArt, isRTL ? { left: 0 } : { right: 0 }]}><BlendedArt edge={isRTL ? 'right' : 'left'} start={0.48}><MotionScene name={kind} style={{ height: '100%', borderRadius: 0 }} /></BlendedArt></View>
      <View style={[styles.radio, { backgroundColor: selected ? theme.colors.primary : theme.colors.surface, borderColor: selected ? theme.colors.primary : theme.colors.borderStrong }]}>{selected ? <Check size={14} color="#fff" weight="bold" /> : null}</View>
      <View style={styles.copy}><Text style={[type.h3, { color: theme.colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{title}</Text><Text style={[type.small, { fontSize: 12, color: theme.colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{description}</Text></View>
      <View style={styles.artSpace} pointerEvents="none" />
    </LinearGradient>
  </Pressable>
}
export function SelectedProblem({ kind, title, label }: { kind: string; title: string; label: string }) {
  const theme = useSanadTheme()
  const type = useAppTypography()
  const isRTL = useIsRTL()
  return <View style={[styles.selected, dirStyles(isRTL).row, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
    <View style={[styles.choiceArt, isRTL ? { left: 0 } : { right: 0 }]}><BlendedArt edge={isRTL ? 'right' : 'left'} start={0.48}><MotionScene name={kind} style={{ height: '100%', borderRadius: 0 }} /></BlendedArt></View>
    <View style={styles.copy}><Text style={[type.caption, { color: theme.colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>{label}</Text><Text style={[type.h3, { color: theme.colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{title}</Text></View>
    <View style={styles.artSpace} pointerEvents="none" />
  </View>
}
export function SafetyBanner({ title, subtitle }: { title: string; subtitle: string }) {
  const theme = useSanadTheme(), type = useAppTypography(), isRTL = useIsRTL()
  return <View style={[styles.safety, dirStyles(isRTL).row, { backgroundColor: theme.colors.primarySoft, borderColor: theme.colors.border }]}>
    <View style={styles.copy}><Text style={[type.smallMedium, { color: theme.colors.primary, textAlign: isRTL ? 'right' : 'left' }]}>{title}</Text><Text style={[type.caption, { color: theme.colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{subtitle}</Text></View>
    <View style={styles.safetyArt} pointerEvents="none"><Image source={motionImages.safety} accessible={false} style={{ position: 'absolute', width: 324, height: 108, left: -18, top: -26 }} resizeMode="contain" /></View>
  </View>
}
const styles = StyleSheet.create({
  topbar: { paddingHorizontal: 20, paddingVertical: 10, alignItems: 'center', justifyContent: 'space-between' },
  back: { width: 44, height: 44, borderWidth: 1, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  progress: { alignItems: 'center', gap: 5 }, segments: { gap: 5 }, segment: { width: 28, height: 5, borderRadius: 3 },
  heading: { minHeight: 134, marginHorizontal: -20, marginTop: -16, justifyContent: 'center', overflow: 'hidden' },
  headingCopy: { paddingHorizontal: 20, paddingVertical: 18, gap: 5 },
  choice: { borderRadius: 23, overflow: 'hidden', borderWidth: 1 },
  choiceBody: { minHeight: 132, paddingHorizontal: 10, paddingVertical: 12, gap: 9, alignItems: 'center' },
  radio: { width: 23, height: 23, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, minWidth: 0, gap: 5 }, choiceArt: { position: 'absolute', top: 0, bottom: 0, width: '52%' }, artSpace: { width: '46%', flexShrink: 0 },
  selected: { minHeight: 116, borderWidth: 1, borderRadius: 22, padding: 12, gap: 12, alignItems: 'center', overflow: 'hidden' },
  safety: { borderWidth: 1, borderRadius: 20, padding: 12, gap: 8, alignItems: 'center' },
  safetyArt: { width: 108, height: 52, borderRadius: 12, overflow: 'hidden', flexShrink: 0 },
})
