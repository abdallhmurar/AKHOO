import { forwardRef, useEffect, useId, useRef, useState } from 'react'
import { AccessibilityInfo, Animated, Easing, StyleSheet, Text, useWindowDimensions, View } from 'react-native'
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop, type CircleProps } from 'react-native-svg'
import { LinearGradient } from 'expo-linear-gradient'
import { useTranslation } from 'react-i18next'
import { ACTIVITY_LEVEL_LABEL_KEYS } from '../lib/activityLevel'
import { dirStyles, useIsRTL } from '../lib/direction'
import { useAppFont } from '../lib/typography'
import { useSanadTheme } from '../lib/theme'
import { levelCardProgress } from './levelCardModel'

// Animated injects a native View-only prop; forwarding it to SVG produces a
// React DOM error on web. Keep the animation/ref but omit that View prop.
const ProgressCircle = forwardRef<Circle, CircleProps & { collapsable?: boolean }>(function ProgressCircle(props, ref) {
  const svgProps = { ...props }
  delete svgProps.collapsable
  return <Circle {...svgProps} ref={ref} />
})
const AnimatedCircle = Animated.createAnimatedComponent(ProgressCircle)
const RADIUS = 54
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

type Props = {
  completedCount: number
  /** Preview controls can disable/replay motion without changing real account data. */
  animate?: boolean
  replay?: number
}

/** Native SVG only: no image text, medal, star, WebView, or continuous render loop. */
export function VolunteerLevelCard({ completedCount, animate = true, replay = 0 }: Props) {
  const { t } = useTranslation()
  const theme = useSanadTheme(), rtl = useIsRTL()
  const font = useAppFont('regular'), bold = useAppFont('extraBold')
  const { width: windowWidth, fontScale } = useWindowDimensions()
  const [cardWidth, setCardWidth] = useState(Math.min(windowWidth - 32, 448))
  const [reduceMotion, setReduceMotion] = useState<boolean | null>(null)
  const progress = useRef(new Animated.Value(0)).current
  const previousReplay = useRef(replay)
  const gradientId = `level-progress-${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const { count, target, level, nextLevel, remaining, fraction } = levelCardProgress(completedCount)
  const stacked = fontScale > 1.3 && cardWidth < 440
  const ringSize = stacked ? Math.min(cardWidth - 38, 140 * fontScale) : cardWidth < 360 ? 112 : 140
  const textAlign = rtl ? 'right' as const : 'left' as const
  const ink = theme.isDark ? '#e8f4ff' : '#092740'
  const muted = theme.isDark ? '#aec5d9' : '#5f7d97'
  const teal = theme.isDark ? '#65e4d4' : '#008f89'
  const label = t(level === 'none' ? 'activityLevel.none' : ACTIVITY_LEVEL_LABEL_KEYS[level])

  useEffect(() => {
    let active = true
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion)
    AccessibilityInfo.isReduceMotionEnabled().then(value => { if (active) setReduceMotion(value) }).catch(() => { if (active) setReduceMotion(true) })
    return () => { active = false; subscription.remove() }
  }, [])

  useEffect(() => {
    if (reduceMotion === null && animate) return
    const shouldReplay = previousReplay.current !== replay
    previousReplay.current = replay
    if (!animate || reduceMotion) {
      progress.setValue(fraction)
      return
    }
    if (shouldReplay) progress.setValue(0)
    const animation = Animated.timing(progress, {
      toValue: fraction,
      duration: 1000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
      isInteraction: false,
    })
    animation.start()
    return () => animation.stop()
  }, [animate, fraction, progress, reduceMotion, replay])

  const remainingText = nextLevel ? t('levelCard.remaining', { remaining }) : t('points.topTier')
  const nextText = nextLevel ? t('levelCard.nextLevel', { levelName: t(ACTIVITY_LEVEL_LABEL_KEYS[nextLevel]) }) : ''
  const progressText = nextLevel ? t('perks.helpProgress', { count, target }) : `${count} ${t('activity.helpUnit')}`
  const dotSize = 12
  const dotPosition = ringSize * (70 + RADIUS) / 140 - dotSize / 2

  return (
    <LinearGradient
      colors={theme.isDark ? ['#152f43', '#10283a'] : ['#f5fbff', '#ffffff']}
      start={{ x: rtl ? 0 : 1, y: 1 }} end={{ x: rtl ? 1 : 0, y: 0 }}
      onLayout={event => setCardWidth(event.nativeEvent.layout.width)}
      accessible accessibilityRole="progressbar" accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: target, now: Math.min(count, target), text: `${progressText}. ${remainingText}. ${nextText}` }}
      aria-valuemin={0} aria-valuemax={target} aria-valuenow={Math.min(count, target)} aria-valuetext={`${progressText}. ${remainingText}. ${nextText}`}
      style={[styles.card, dirStyles(rtl).row, { borderColor: theme.isDark ? '#33556d' : '#cce6f8' }, stacked && styles.stacked]}
    >
      <View pointerEvents="none" accessible={false} style={[styles.halo, { backgroundColor: theme.isDark ? '#1a4663' : '#e9f5ff', [rtl ? 'left' : 'right']: -26 }]} />
      <View style={[styles.copy, stacked && styles.stackedCopy]}>
        <Text style={[styles.eyebrow, { fontFamily: font, color: muted, textAlign }]}>{t('activity.levelCard.title')}</Text>
        <Text style={[styles.title, { fontFamily: bold, color: ink, textAlign, fontSize: cardWidth < 360 ? 22 : 26 }]}>{label}</Text>
        <View style={styles.nextCopy}>
          <Text style={[styles.remaining, { fontFamily: font, color: muted, textAlign }]}>
            {nextLevel ? <>{t('levelCard.remainingBefore')} <Text style={{ fontFamily: bold, color: teal }}>{remaining}</Text> {t('activity.helpUnit')}</> : remainingText}
          </Text>
          {nextLevel ? <Text style={[styles.next, { fontFamily: font, color: teal, textAlign }]}>{nextText}</Text> : null}
        </View>
      </View>
      <View pointerEvents="none" accessible={false} style={[styles.ring, { width: ringSize, height: ringSize }]}>
        <Svg width={ringSize} height={ringSize} viewBox="0 0 140 140">
          <Defs><SvgGradient id={gradientId} x1="0%" y1="100%" x2="100%" y2="0%"><Stop offset="0" stopColor="#0968f6" /><Stop offset="0.5" stopColor="#159ae6" /><Stop offset="1" stopColor="#24cbbb" /></SvgGradient></Defs>
          <Circle cx={70} cy={70} r={RADIUS} stroke={theme.isDark ? '#2a4a64' : '#dcecff'} strokeWidth={11} fill="none" />
          {fraction > 0 ? <AnimatedCircle cx={70} cy={70} r={RADIUS} stroke={`url(#${gradientId})`} strokeWidth={11} fill="none" strokeLinecap="round" transform="rotate(-90 70 70)" strokeDasharray={[CIRCUMFERENCE, CIRCUMFERENCE]} strokeDashoffset={progress.interpolate({ inputRange: [0, 1], outputRange: [CIRCUMFERENCE, 0] })} /> : null}
        </Svg>
        {fraction > 0 ? <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate: progress.interpolate({ inputRange: [0, 1], outputRange: ['-90deg', '270deg'] }) }] }]}><View style={[styles.dot, { left: dotPosition, top: ringSize / 2 - dotSize / 2, borderColor: theme.isDark ? '#173347' : '#fff' }]} /></Animated.View> : null}
        <View style={styles.ringText}>
          <Text adjustsFontSizeToFit numberOfLines={1} maxFontSizeMultiplier={1.5} style={[styles.number, { color: ink, fontSize: ringSize < 130 ? 33 : 42, lineHeight: ringSize < 130 ? 40 : 49 }]}>{count}</Text>
          {nextLevel ? <Text style={[styles.target, { fontFamily: font, color: muted, lineHeight: ringSize < 130 ? 18 : 22 }]}>{t('levelCard.outOf', { target })}</Text> : null}
          <Text style={[styles.unit, { fontFamily: font, color: muted, lineHeight: ringSize < 130 ? 14 : 18 }]}>{t('activity.helpUnit')}</Text>
        </View>
      </View>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  card: { width: '100%', borderWidth: 1, borderRadius: 24, paddingHorizontal: 18, paddingVertical: 20, minHeight: 180, alignItems: 'center', gap: 14, overflow: 'hidden' },
  stacked: { flexDirection: 'column', gap: 20 },
  halo: { position: 'absolute', width: 210, height: 210, borderRadius: 105, top: -16, opacity: 0.55 },
  copy: { flex: 1, minWidth: 0, gap: 4 },
  stackedCopy: { alignSelf: 'stretch', flex: 0 },
  eyebrow: { fontSize: 11, lineHeight: 20 },
  title: { lineHeight: 40 },
  nextCopy: { gap: 2, marginTop: 7 },
  remaining: { fontSize: 14, lineHeight: 24 },
  next: { fontSize: 12, lineHeight: 22 },
  ring: { flexShrink: 0 },
  dot: { position: 'absolute', width: 12, height: 12, borderRadius: 6, borderWidth: 2, backgroundColor: '#13bfae' },
  ringText: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 22 },
  number: { fontFamily: 'Inter_800ExtraBold', lineHeight: 49, textAlign: 'center', writingDirection: 'ltr' },
  target: { fontSize: 13, lineHeight: 22, textAlign: 'center' },
  unit: { fontSize: 10, lineHeight: 18, textAlign: 'center' },
})
