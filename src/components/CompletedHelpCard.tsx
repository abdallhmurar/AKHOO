import { useEffect, useRef, useState } from 'react'
import { AccessibilityInfo, Animated, Easing, Platform, StyleSheet, Text, useWindowDimensions, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useTranslation } from 'react-i18next'
import { dirStyles, useIsRTL } from '../lib/direction'
import { useAppFont } from '../lib/typography'
import { civicColors, palette, useSanadTheme } from '../lib/theme'

type Props = {
  completedCount: number
  /** Local preview controls never change account data. */
  animate?: boolean
  replay?: number
}

/** A lifetime count, with no rank, target, or progress percentage. */
export function CompletedHelpCard({ completedCount, animate = true, replay = 0 }: Props) {
  const { t } = useTranslation()
  const theme = useSanadTheme(), rtl = useIsRTL()
  const font = useAppFont('regular'), bold = useAppFont('extraBold')
  const { width: windowWidth, fontScale } = useWindowDimensions()
  const [cardWidth, setCardWidth] = useState(Math.min(windowWidth - 32, 448))
  const [reduceMotion, setReduceMotion] = useState<boolean | null>(null)
  const reveal = useRef(new Animated.Value(1)).current
  const count = Number.isFinite(completedCount) ? Math.max(0, Math.floor(completedCount)) : 0
  const stacked = fontScale > 1.3 && cardWidth < 440
  const compact = cardWidth < 360
  const textAlign = rtl ? 'right' as const : 'left' as const

  useEffect(() => {
    let active = true
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion)
    AccessibilityInfo.isReduceMotionEnabled()
      .then(value => { if (active) setReduceMotion(value) })
      .catch(() => { if (active) setReduceMotion(true) })
    return () => { active = false; subscription.remove() }
  }, [])

  useEffect(() => {
    if (reduceMotion === null || !animate || reduceMotion) {
      reveal.setValue(1)
      return
    }
    reveal.setValue(0)
    const animation = Animated.timing(reveal, {
      toValue: 1,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
      isInteraction: false,
    })
    animation.start()
    return () => animation.stop()
  }, [animate, count, reduceMotion, replay, reveal])

  return (
    <LinearGradient
      testID="completed-help-card"
      colors={theme.isDark
        ? [palette.blueSoftDark, palette.tealSoftDark]
        : [civicColors.signalBlue, civicColors.communityTeal]}
      start={{ x: rtl ? 0 : 1, y: 0 }} end={{ x: rtl ? 1 : 0, y: 1 }}
      onLayout={event => setCardWidth(event.nativeEvent.layout.width)}
      accessible accessibilityRole="text" accessibilityLabel={t('helpCounter.total', { count })}
      style={[styles.card, dirStyles(rtl).row, stacked && styles.stacked]}
    >
      <View pointerEvents="none" accessible={false} style={[styles.halo, { [rtl ? 'left' : 'right']: -72 }]} />
      <View style={[styles.copy, stacked && styles.stackedCopy]}>
        <Text style={[styles.eyebrow, { fontFamily: font, textAlign }]}>{t('helpCounter.label')}</Text>
        <Text style={[styles.title, { fontFamily: bold, textAlign, fontSize: compact ? 21 : 25 }]}>{t('helpCounter.title')}</Text>
        <Text style={[styles.caption, { fontFamily: font, textAlign }]}>{t(count === 0 ? 'helpCounter.empty' : 'helpCounter.caption')}</Text>
      </View>
      <Animated.View style={[
        styles.counter,
        { width: compact ? 108 : 124, minHeight: compact ? 108 : 124,
          opacity: reveal.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }),
          transform: [{ scale: reveal.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }] },
      ]}>
        <Text testID="completed-help-count" adjustsFontSizeToFit numberOfLines={1} maxFontSizeMultiplier={1.5}
          style={[styles.number, { fontSize: compact ? 40 : 48 }]}>{count}</Text>
        <Text style={[styles.unit, { fontFamily: font }]}>{t('helpCounter.unit')}</Text>
      </Animated.View>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  card: { width: '100%', borderRadius: 24, padding: 20, minHeight: 164, alignItems: 'center', gap: 18, overflow: 'hidden' },
  stacked: { flexDirection: 'column', gap: 20 },
  halo: { position: 'absolute', width: 270, height: 270, borderRadius: 135, top: -53, borderWidth: 1, borderColor: palette.whiteAlpha12, backgroundColor: palette.whiteAlpha04 },
  copy: { flex: 1, minWidth: 0, gap: 4 },
  stackedCopy: { alignSelf: 'stretch', flex: 0 },
  eyebrow: { fontSize: 12, lineHeight: 22, color: '#e2f3ff' },
  title: { lineHeight: 36, color: palette.white },
  caption: { fontSize: 13, lineHeight: 23, color: '#e2f3ff', marginTop: 4 },
  counter: { flexShrink: 0, borderRadius: 32, backgroundColor: palette.white, justifyContent: 'center', alignItems: 'center', padding: 12, gap: 2 },
  number: { fontFamily: 'Inter_800ExtraBold', color: civicColors.signalBlue, textAlign: 'center', writingDirection: 'ltr', width: '100%' },
  unit: { fontSize: 12, lineHeight: 22, color: civicColors.navy, textAlign: 'center' },
})
