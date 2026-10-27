import { useMemo, useState } from 'react'
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useTranslation } from 'react-i18next'
import { useIsRTL } from '../../lib/direction'
import { useAppTypography } from '../../lib/typography'
import type { PointsPanelProps } from './ApprovedPanels.types'
import { ImpactTree } from './ImpactTree'
import { useRewardMotion, useRewardNumber } from './useRewardMotion'

export function LivePointsCard({ balance, count, target, level, levelLabel, remainingLabel }: PointsPanelProps) {
  const { t, i18n } = useTranslation()
  const type = useAppTypography(), rtl = useIsRTL()
  const { width, fontScale } = useWindowDimensions()
  const [cardWidth, setCardWidth] = useState(Math.min(width - 36, 454))
  const { active, reduced } = useRewardMotion()
  const format = useMemo(() => new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 0 }), [i18n.language])
  const progress = Math.min(Math.max(count / Math.max(1, target), 0), 1)
  const progressLabel = level === 'green' ? t('perks.pointsCard.totalHelps', { count }) : t('perks.helpProgress', { count, target })
  const animatedBalance = useRewardNumber(balance, active && !reduced, 300)
  const animatedProgress = useRewardNumber(progress, active && !reduced, 250)
  const compact = cardWidth < 365, tiny = cardWidth < 320, expandedType = fontScale > 1.4
  const treeSize = Math.min(264, Math.max(130, cardWidth * (tiny ? .50 : .55)))
  const align = { textAlign: rtl ? 'right' as const : 'left' as const }
  const row = { direction: 'ltr' as const, flexDirection: rtl ? 'row' as const : 'row-reverse' as const }
  return <View onLayout={event => setCardWidth(event.nativeEvent.layout.width)} style={styles.shell}>
    <LinearGradient colors={['#f8fdfc', '#ffffff', '#eefbf9']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.surface}>
      <View style={[styles.hero, row, expandedType && styles.heroStack]}>
        <View style={styles.tree}><ImpactTree count={count} size={treeSize} active={active} /></View>
        <View style={[styles.copy, { alignItems: rtl ? 'flex-end' : 'flex-start' }]}>
          <Text style={[type.h1, align, styles.title, compact && styles.titleCompact, tiny && styles.titleTiny]}>{t('perks.impactTree.title')}</Text>
          <Text style={[type.small, align, styles.subtitle]}>{t('perks.impactTree.subtitle')}</Text>
          <Text accessibilityLabel={t('perks.pointsCard.totalHelps', { count })} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={.6}
            style={[type.display, align, styles.count, compact && styles.countCompact, { writingDirection: 'ltr' }]}>{format.format(count)}</Text>
          <Text style={[type.h3, align, styles.helpLabel, compact && styles.helpLabelCompact]}>{t('perks.impactTree.helpsLabel')}</Text>
          <View style={styles.pill}><Text style={[type.smallMedium, align, styles.pillText]}>{levelLabel}</Text></View>
        </View>
      </View>
      <View style={styles.details}>
        <Text style={[type.smallMedium, styles.remaining]}>{level === 'green' ? t('perks.pointsCard.topLevel') : remainingLabel}</Text>
        <View accessibilityRole="progressbar" accessibilityLabel={t('perks.pointsCard.levelLabel')}
          aria-valuemin={0} aria-valuemax={target} aria-valuenow={Math.max(0, Math.min(count, target))} aria-valuetext={progressLabel}
          style={[styles.track, { direction: 'ltr', alignItems: rtl ? 'flex-end' : 'flex-start' }]}>
          <LinearGradient colors={['#159b9e', '#0bb6a8']} start={{ x: rtl ? 1 : 0, y: 0 }} end={{ x: rtl ? 0 : 1, y: 0 }}
            style={[styles.fill, { width: `${animatedProgress * 100}%` }]} />
        </View>
        <View style={[styles.footer, row]}>
          <View style={[styles.points, row]}>
            <Text style={[type.small, styles.unit]}>{t('perks.pointsUnit')}</Text>
            <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={.6} style={[type.display, styles.balance]}>{format.format(Math.round(animatedBalance))}</Text>
          </View>
          <Text style={[type.h3, align, styles.pointsLabel]}>{t('perks.impactTree.points')}</Text>
        </View>
      </View>
    </LinearGradient>
  </View>
}
const styles = StyleSheet.create({
  shell: { borderRadius: 28, borderWidth: 1, borderColor: '#ffffff', backgroundColor: '#f5fdfc', boxShadow: '0 12px 32px rgba(45, 139, 156, 0.12)' },
  surface: { borderRadius: 27, overflow: 'hidden' },
  hero: { alignItems: 'center', paddingTop: 8, paddingHorizontal: 14, minHeight: 220, gap: 0 },
  heroStack: { flexDirection: 'column', paddingHorizontal: 18, paddingBottom: 15 },
  tree: { flexShrink: 0, alignSelf: 'center' },
  copy: { flex: 1, minWidth: 0, paddingTop: 9, paddingBottom: 15 },
  title: { color: '#0b2a48', fontSize: 24, lineHeight: 38 },
  titleCompact: { fontSize: 20, lineHeight: 32 },
  titleTiny: { fontSize: 18, lineHeight: 29 },
  subtitle: { color: '#627e91', fontSize: 12, lineHeight: 23, marginTop: 1 },
  count: { color: '#0b2a48', width: '100%', fontSize: 74, lineHeight: 93, marginTop: 12, fontVariant: ['tabular-nums'], letterSpacing: 0 },
  countCompact: { fontSize: 61, lineHeight: 78, marginTop: 8 },
  helpLabel: { color: '#0b2a48', fontSize: 17, lineHeight: 28 },
  helpLabelCompact: { fontSize: 14, lineHeight: 24 },
  pill: { borderWidth: 1, borderColor: '#19b4af', backgroundColor: '#e6f8f5', borderRadius: 26, paddingHorizontal: 13, paddingVertical: 5, marginTop: 13, maxWidth: '100%' },
  pillText: { color: '#087f85', fontSize: 12, lineHeight: 22 },
  details: { paddingHorizontal: 20, paddingBottom: 12 },
  remaining: { color: '#244759', textAlign: 'center', lineHeight: 25, marginBottom: 10 },
  track: { height: 11, borderRadius: 8, backgroundColor: '#dcebed', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 8 },
  footer: { borderTopWidth: 1, borderTopColor: '#d8e9eb', marginTop: 15, paddingTop: 10, justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  points: { alignItems: 'baseline', gap: 6, flexShrink: 1 },
  unit: { color: '#617e8e' },
  balance: { color: '#0b2a48', fontSize: 29, lineHeight: 43, flexShrink: 1, fontVariant: ['tabular-nums'], writingDirection: 'ltr' },
  pointsLabel: { color: '#0b2a48', flexShrink: 1 },
})
