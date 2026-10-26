import { useMemo } from 'react'
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useTranslation } from 'react-i18next'
import { useIsRTL } from '../../lib/direction'
import { useAppTypography } from '../../lib/typography'
import type { PointsPanelProps } from './ApprovedPanels.types'
import { RewardsMedal } from './RewardsMedal'
import { useRewardMotion, useRewardNumber } from './useRewardMotion'

export function LivePointsCard({ balance, count, target, level, levelLabel, remainingLabel }: PointsPanelProps) {
  const { t, i18n } = useTranslation()
  const type = useAppTypography()
  const rtl = useIsRTL()
  const { width, fontScale } = useWindowDimensions()
  const { active, reduced } = useRewardMotion()
  const format = useMemo(() => new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 0 }), [i18n.language])
  const progress = Math.min(Math.max(count / Math.max(1, target), 0), 1)
  const progressLabel = level === 'green' ? t('perks.pointsCard.totalHelps', { count }) : t('perks.helpProgress', { count, target })
  const animatedBalance = useRewardNumber(balance, active && !reduced)
  const animatedProgress = useRewardNumber(progress, active && !reduced)
  const compact = width < 370
  const expandedType = fontScale > 1.4
  const medalSize = compact ? 120 : 148
  const align = { textAlign: rtl ? 'right' as const : 'left' as const }
  // Explicit LTR row coordinates prevent OS RTL settings from reversing twice.
  const row = { direction: 'ltr' as const, flexDirection: rtl ? 'row' as const : 'row-reverse' as const }
  const badge = level === 'green' ? '#b8edda' : level === 'silver' ? '#d9e5f0' : level === 'none' ? '#d9e5f0' : '#f1d69b'
  return <View style={styles.shell}>
    <LinearGradient colors={['#102a41', '#114a59', '#087878']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.surface}>
      <View style={[styles.orbitOuter, { pointerEvents: 'none' }]} /><View style={[styles.orbitInner, { pointerEvents: 'none' }]} />
      <View style={[styles.hero, row, compact && styles.heroCompact, expandedType && styles.heroStack]}>
        <View style={styles.medalArea}>
          <View style={[styles.medalGlow, { pointerEvents: 'none' }]} />
          <RewardsMedal level={level} size={medalSize} active={active} label={levelLabel} />
        </View>
        <View style={[styles.balanceCopy, { alignItems: rtl ? 'flex-end' : 'flex-start' }]}>
          <Text style={[type.small, align, styles.eyebrow]}>{t('perks.pointsCard.balanceLabel')}</Text>
          <Text accessibilityLabel={`${format.format(balance)} ${t('perks.pointsUnit')}`} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6} style={[type.display, align, styles.balance, compact && styles.balanceCompact, { writingDirection: 'ltr' }]}>{format.format(Math.round(animatedBalance))}</Text>
          <Text style={[type.caption, align, styles.unit]}>{t('perks.pointsUnit')}</Text>
          <View style={[styles.rank, { alignItems: rtl ? 'flex-end' : 'flex-start' }]}>
            <Text style={[type.caption, align, styles.rankLabel]}>{t('perks.pointsCard.levelLabel')}</Text>
            <View style={[styles.rankPill, { borderColor: `${badge}55`, backgroundColor: `${badge}14` }]}>
              <Text style={[type.smallMedium, align, { color: badge }]}>{levelLabel}</Text>
            </View>
          </View>
        </View>
      </View>
      <LinearGradient colors={['#ffffff', '#f0faf8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.progressTray}>
        <Text style={[type.smallMedium, align, styles.remaining]}>{level === 'green' ? t('perks.pointsCard.topLevel') : remainingLabel}</Text>
        <View accessibilityRole="progressbar" accessibilityLabel={t('perks.pointsCard.levelLabel')}
          aria-valuemin={0} aria-valuemax={target} aria-valuenow={Math.min(count, target)} aria-valuetext={progressLabel}
          style={[styles.track, { direction: 'ltr', alignItems: rtl ? 'flex-end' : 'flex-start' }]}>
          <LinearGradient colors={['#087d70', '#21b7a5']} start={{ x: rtl ? 1 : 0, y: 0 }} end={{ x: rtl ? 0 : 1, y: 0 }}
            style={[styles.fill, { width: `${animatedProgress * 100}%` }]}>
            {progress > 0 ? <View style={[styles.marker, { [rtl ? 'left' : 'right']: -1 }]} /> : null}
          </LinearGradient>
        </View>
        <Text style={[type.caption, align, styles.caption]}>{progressLabel}</Text>
      </LinearGradient>
    </LinearGradient>
  </View>
}

const styles = StyleSheet.create({
  shell: { borderRadius: 28, borderWidth: 1, borderColor: '#b8dcd9', backgroundColor: '#103347', boxShadow: '0 10px 26px rgba(13, 56, 73, 0.12)' },
  surface: { borderRadius: 27, overflow: 'hidden' },
  orbitOuter: { position: 'absolute', width: 400, height: 400, borderRadius: 200, borderWidth: 1, borderColor: '#8bc9c914', top: -185, left: -105, transform: [{ rotate: '-28deg' }, { scaleX: 1.45 }] },
  orbitInner: { position: 'absolute', width: 340, height: 340, borderRadius: 170, borderWidth: 32, borderColor: '#8bc9c908', top: -155, left: -80, transform: [{ scaleX: 1.45 }] },
  hero: { alignItems: 'center', paddingHorizontal: 22, paddingVertical: 13, gap: 12, minHeight: 205 },
  heroCompact: { paddingHorizontal: 16, gap: 5 },
  heroStack: { flexDirection: 'column', gap: 8 },
  medalArea: { alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  medalGlow: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: '#b7ebe909' },
  balanceCopy: { flex: 1, minWidth: 0, gap: 1 },
  eyebrow: { color: '#c7dde5', lineHeight: 21 },
  balance: { width: '100%', color: '#ffffff', fontSize: 58, lineHeight: 75, letterSpacing: 0, fontVariant: ['tabular-nums'] },
  balanceCompact: { fontSize: 48, lineHeight: 63 },
  unit: { color: '#c0d9e3', marginTop: -3 },
  rank: { marginTop: 12, gap: 5, maxWidth: '100%' },
  rankLabel: { color: '#c7dde5', fontSize: 10 },
  rankPill: { borderWidth: 1, borderRadius: 22, paddingHorizontal: 12, paddingVertical: 4, maxWidth: '100%' },
  progressTray: { borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 17, gap: 11 },
  remaining: { color: '#173d49', lineHeight: 23 },
  track: { height: 11, borderRadius: 8, backgroundColor: '#dcece9' },
  fill: { height: '100%', borderRadius: 8, minWidth: 0 },
  marker: { position: 'absolute', top: -2, width: 6, height: 15, borderRadius: 3, backgroundColor: '#ddbe70', borderWidth: 1, borderColor: '#f8e6a9' },
  caption: { color: '#537880', fontSize: 11 },
})
