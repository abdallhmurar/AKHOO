import { useEffect, useRef, useState } from 'react'
import { AccessibilityInfo, Animated, Easing, Platform, StyleSheet, Text, useWindowDimensions, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Handshake } from 'phosphor-react-native'
import { useTranslation } from 'react-i18next'
import { dirStyles, useIsRTL } from '../../lib/direction'
import { useAppFont } from '../../lib/typography'
import { civicColors, palette, useSanadTheme } from '../../lib/theme'

type Props = {
  variant: 'impact' | 'compact'
  completedCount: number
  animate: boolean
  replay: number
}

/** Two visual proposals, imported only by the dev-web preview. */
export function HelpCounterConcept({ variant, completedCount, animate, replay }: Props) {
  const { t } = useTranslation(), rtl = useIsRTL(), theme = useSanadTheme()
  const regular = useAppFont('regular'), bold = useAppFont('bold')
  const { fontScale } = useWindowDimensions()
  const [width, setWidth] = useState(358), [reducedMotion, setReducedMotion] = useState(true)
  const entrance = useRef(new Animated.Value(1)).current
  const count = Number.isFinite(completedCount) ? Math.max(0, Math.floor(completedCount)) : 0
  const impact = variant === 'impact', narrow = width < 330
  const stacked = fontScale > 1.3
  const padding = narrow ? 20 : 24
  const metricWidth = width - padding * 2 - (stacked ? 0 : 130)
  const digitWidth = String(count).length * 0.7 * Math.min(fontScale, 1.2)
  const impactNumberSize = Math.min(narrow ? 68 : 80, metricWidth / digitWidth)
  const compactNumberSize = Math.min(narrow ? 54 : 62, 112 / digitWidth)
  const align = rtl ? 'right' as const : 'left' as const
  const blue = theme.isDark ? '#79b5ff' : civicColors.signalBlue
  const teal = theme.isDark ? '#68d6b8' : civicColors.communityTeal
  const ink = theme.colors.textPrimary, muted = theme.colors.textSecondary
  const motionStyle = {
    opacity: entrance.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] }),
    transform: [{ translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
  }

  useEffect(() => {
    let active = true
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReducedMotion)
    AccessibilityInfo.isReduceMotionEnabled().then(value => { if (active) setReducedMotion(value) }).catch(() => {})
    return () => { active = false; subscription.remove() }
  }, [])

  useEffect(() => {
    if (!animate || reducedMotion) { entrance.setValue(1); return }
    entrance.setValue(0)
    const animation = Animated.timing(entrance, {
      toValue: 1, duration: 400, easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web', isInteraction: false,
    })
    animation.start()
    return () => animation.stop()
  }, [animate, count, entrance, reducedMotion, replay])

  return <View
    testID={`counter-concept-${variant}`}
    onLayout={event => setWidth(event.nativeEvent.layout.width)}
    accessible accessibilityRole="text" accessibilityLabel={t('helpCounter.total', { count })}
    style={[styles.card, {
      backgroundColor: theme.colors.surface,
      borderColor: theme.isDark ? theme.colors.border : '#d7e9f4',
      paddingHorizontal: padding, paddingTop: padding, paddingBottom: impact ? padding : 0,
    }]}
  >
    {impact ? <>
      <LinearGradient pointerEvents="none" accessible={false}
        colors={theme.isDark ? ['#143a67', '#103d3500'] : ['#e8f4ff', '#f0faf600']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[styles.wash, { [rtl ? 'left' : 'right']: -35 }]} />
      <View style={[styles.labelRow, dirStyles(rtl).row]}>
        <View style={[styles.dot, { backgroundColor: teal }]} />
        <Text style={[styles.label, { color: muted, fontFamily: bold, textAlign: align }]}>{t('counterConcept.impactLabel')}</Text>
      </View>
      <View style={[styles.impactBody, dirStyles(rtl).row, stacked && styles.stacked]}>
        <View style={styles.metric}>
          <Animated.Text testID="concept-count" adjustsFontSizeToFit numberOfLines={1} maxFontSizeMultiplier={1.2}
            style={[styles.bigNumber, { color: blue, textAlign: align, fontSize: impactNumberSize }, motionStyle]}>{count}</Animated.Text>
          <Text style={[styles.metricLabel, { color: ink, fontFamily: bold, textAlign: align }]}>{t('counterConcept.completed')}</Text>
        </View>
        <View pointerEvents="none" accessible={false} style={[styles.art, { transform: [{ scale: narrow ? 0.86 : 1 }] }]}>
          <View style={[styles.artBack, { backgroundColor: theme.isDark ? '#194f47' : '#c9f1e6', transform: [{ rotate: '14deg' }] }]} />
          <View style={[styles.artMiddle, { backgroundColor: theme.isDark ? '#1d4980' : '#c8e4ff', transform: [{ rotate: '-12deg' }] }]} />
          <View style={[styles.artFace, { backgroundColor: theme.isDark ? '#153149' : palette.white, borderColor: theme.isDark ? '#326083' : '#dcecf8' }]}>
            <Handshake size={48} color={blue} weight="duotone" />
          </View>
        </View>
      </View>
      <View style={[styles.footer, { borderTopColor: theme.isDark ? theme.colors.border : '#e5f0f6' }]}>
        <Text style={[styles.footerText, { color: teal, fontFamily: regular, textAlign: align }]}>{t(count === 0 ? 'helpCounter.empty' : 'counterConcept.impactCaption')}</Text>
      </View>
    </> : <>
      <View style={[styles.compactBody, dirStyles(rtl).row, stacked && styles.stacked]}>
        <View style={styles.compactCopy}>
          <Text style={[styles.compactLabel, { fontFamily: bold, color: ink, textAlign: align }]}>{t('counterConcept.compactTitle')}</Text>
          <Text style={[styles.compactCaption, { fontFamily: regular, color: muted, textAlign: align }]}>{t('counterConcept.completed')}</Text>
        </View>
        <Animated.Text testID="concept-count" adjustsFontSizeToFit numberOfLines={1} maxFontSizeMultiplier={1.2}
          style={[styles.compactNumber, { color: blue, fontSize: compactNumberSize }, motionStyle]}>{count}</Animated.Text>
      </View>
      <LinearGradient colors={theme.isDark ? ['#143a67', '#103d35'] : ['#eaf4ff', '#e9f8f1']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.compactFooter, { marginHorizontal: -padding, paddingHorizontal: padding }]}>
        <Text style={[styles.footerText, { color: teal, fontFamily: regular, textAlign: align }]}>{t(count === 0 ? 'helpCounter.empty' : 'counterConcept.compactCaption')}</Text>
      </LinearGradient>
    </>}
  </View>
}

const styles = StyleSheet.create({
  card: { width: '100%', borderWidth: 1, borderRadius: 28, overflow: 'hidden', boxShadow: '0 12px 32px rgba(17, 77, 122, 0.05)' },
  wash: { position: 'absolute', top: -50, width: 240, height: 240, borderRadius: 120 },
  labelRow: { gap: 8, alignItems: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3 },
  label: { fontSize: 13, lineHeight: 24, flexShrink: 1 },
  impactBody: { gap: 20, alignItems: 'center', marginTop: 12, marginBottom: 20 },
  metric: { flex: 1, minWidth: 0, gap: 1 },
  bigNumber: { fontFamily: 'Inter_800ExtraBold', writingDirection: 'ltr', letterSpacing: -3, lineHeight: 90 },
  metricLabel: { fontSize: 15, lineHeight: 27 },
  art: { width: 110, height: 110, flexShrink: 0, alignItems: 'center', justifyContent: 'center' },
  artBack: { position: 'absolute', width: 84, height: 84, borderRadius: 26, left: 14, top: 12 },
  artMiddle: { position: 'absolute', width: 84, height: 84, borderRadius: 26, left: 9, top: 18 },
  artFace: { width: 80, height: 80, borderRadius: 25, borderWidth: 1, justifyContent: 'center', alignItems: 'center', boxShadow: '0 8px 15px rgba(18, 82, 132, 0.08)' },
  footer: { paddingTop: 14, borderTopWidth: 1 },
  footerText: { fontSize: 13, lineHeight: 25 },
  compactBody: { alignItems: 'center', gap: 18, paddingBottom: 18 },
  compactCopy: { flex: 1, minWidth: 0, gap: 2 },
  compactLabel: { fontSize: 21, lineHeight: 34 },
  compactCaption: { fontSize: 12, lineHeight: 23 },
  compactNumber: { width: 112, flexShrink: 0, fontFamily: 'Inter_800ExtraBold', writingDirection: 'ltr', textAlign: 'center', letterSpacing: -2, lineHeight: 78 },
  compactFooter: { paddingVertical: 10, borderTopWidth: 1, borderTopColor: 'rgba(22, 104, 229, 0.05)' },
  stacked: { flexDirection: 'column', alignItems: 'stretch' },
})
