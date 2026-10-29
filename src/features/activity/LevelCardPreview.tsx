import { useEffect, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { VolunteerLevelCard } from '../../components/VolunteerLevelCard'
import { useThemeMode } from '../../providers/ThemeModeProvider'
import { useLanguageDirection } from '../../providers/LanguageDirectionProvider'
import { useAppTypography } from '../../lib/typography'
import { useSanadTheme } from '../../lib/theme'
import { dirStyles, useIsRTL } from '../../lib/direction'

/** Explicit examples, no Supabase writes and no changes to the rest of the app. */
export function LevelCardPreview() {
  const { t } = useTranslation(), typography = useAppTypography()
  const theme = useSanadTheme(), rtl = useIsRTL()
  const { isDark, setDark } = useThemeMode(), { language, setLanguage } = useLanguageDirection()
  const [count, setCount] = useState(42), [replay, setReplay] = useState(0), [motion, setMotion] = useState(true), [width, setWidth] = useState(448)
  useEffect(() => { void setLanguage('ar') }, [setLanguage])
  const colors = { color: theme.colors.textPrimary, textAlign: rtl ? 'right' as const : 'left' as const }

  function control(label: string, onPress: () => void, selected = false) {
    return <Pressable key={label} accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={({ pressed }) => [styles.button, { backgroundColor: selected ? theme.colors.primary : theme.colors.surface, borderColor: theme.colors.border, opacity: pressed ? 0.7 : 1 }]}><Text style={[typography.smallMedium, { color: selected ? '#fff' : theme.colors.textPrimary }]}>{label}</Text></Pressable>
  }

  return <ScrollView contentContainerStyle={[styles.page, { backgroundColor: theme.isDark ? theme.colors.background : '#f1faff' }]}>
    <View style={styles.heading}><Text style={[typography.h2, colors]}>{t('levelCard.preview')}</Text><Text style={[typography.small, colors]}>{t('levelCard.previewNote')}</Text></View>
    <View style={{ width, maxWidth: '100%' }}><VolunteerLevelCard completedCount={count} animate={motion} replay={replay} /></View>
    <View style={styles.controls}>
      <View style={[styles.row, dirStyles(rtl).row]}>{control(t('levelCard.add'), () => setCount(value => value + 1), true)}{control(t('levelCard.replay'), () => setReplay(value => value + 1))}{control(t('levelCard.reset'), () => setCount(42))}</View>
      <View style={[styles.row, dirStyles(rtl).row]}>{[0, 5, 15, 30, 42, 60, 75].map(value => control(String(value), () => setCount(value), count === value))}</View>
      <View style={[styles.row, dirStyles(rtl).row]}>{control(t(motion ? 'levelCard.motionOn' : 'levelCard.motionOff'), () => setMotion(value => !value), motion)}{control(t(isDark ? 'levelCard.light' : 'levelCard.dark'), () => setDark(!isDark))}{(['ar', 'en', 'he'] as const).map(value => control(value.toUpperCase(), () => { void setLanguage(value) }, value === language))}</View>
      <Text style={[typography.small, { color: theme.colors.textSecondary, textAlign: 'center' }]}>{t('levelCard.width')}</Text>
      <View style={[styles.row, dirStyles(rtl).row]}>{[288, 358, 448].map(value => control(`${value}px`, () => setWidth(value), value === width))}</View>
    </View>
  </ScrollView>
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, alignItems: 'center', padding: 16, paddingTop: 35, gap: 24 },
  heading: { width: '100%', maxWidth: 448, gap: 8 },
  controls: { width: '100%', maxWidth: 480, gap: 10, paddingTop: 5 },
  row: { flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 7 },
  button: { minHeight: 44, minWidth: 44, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 13, paddingVertical: 8, borderRadius: 14, borderWidth: 1 },
})
