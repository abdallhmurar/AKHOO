import { useMemo, useState } from 'react'
import { Image, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { CaretLeft, CaretRight, User } from 'phosphor-react-native'
import { useTranslation } from 'react-i18next'
import { useIsRTL } from '../../lib/direction'
import { ACTIVITY_LEVEL_LABEL_KEYS, ACTIVITY_LEVEL_THRESHOLDS } from '../../lib/activityLevel'
import { useAppTypography } from '../../lib/typography'
import { useSanadTheme } from '../../lib/theme'
import type { PointsPanelProps } from './ApprovedPanels.types'
import { HELPER_CARD_MATERIALS, helperCardMaterial } from './helperCardMaterials'
import { MembershipTilt } from './MembershipTilt'
import { useRewardMotion, useRewardNumber } from './useRewardMotion'

const ltrProps = Platform.OS === 'web' ? { dir: 'ltr' } : {}
const ltrStyle = Platform.OS === 'web' ? {} : { direction: 'ltr' as const }
const ranks = Object.entries(ACTIVITY_LEVEL_THRESHOLDS) as [keyof typeof ACTIVITY_LEVEL_THRESHOLDS, number][]

function Material({ level }: Pick<PointsPanelProps, 'level'>) {
  return <Image source={helperCardMaterial(level)} accessible={false} resizeMode="stretch" style={styles.material} />
}

export function LivePointsCard({ balance, count, target, level, levelLabel, remainingLabel, name, avatar }: PointsPanelProps) {
  const { t, i18n } = useTranslation()
  const type = useAppTypography(), rtl = useIsRTL()
  const theme = useSanadTheme()
  const { width, fontScale } = useWindowDimensions()
  const [cardWidth, setCardWidth] = useState(Math.min(width - 36, 454))
  const [flipped, setFlipped] = useState(false)
  const [failedAvatar, setFailedAvatar] = useState<string | null>(null)
  const { active, reduced } = useRewardMotion()
  const format = useMemo(() => new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 0 }), [i18n.language])
  const progress = Math.min(Math.max(count / Math.max(1, target), 0), 1)
  const progressLabel = level === 'green' ? t('perks.pointsCard.totalHelps', { count }) : t('perks.helpProgress', { count, target })
  const animatedBalance = useRewardNumber(balance, active && !reduced, 300)
  const animatedProgress = useRewardNumber(progress, active && !reduced, 250)
  const scale = cardWidth / 400
  const height = Math.max(190, cardWidth / 1.64) * Math.max(1, fontScale)
  const align = { textAlign: rtl ? 'right' as const : 'left' as const }
  const row = { ...ltrStyle, flexDirection: rtl ? 'row' as const : 'row-reverse' as const }
  const identityName = name?.trim() || t('perks.helperCard.namePlaceholder')
  const nextRank = ranks.find(([, threshold]) => threshold === target)?.[0]
  const remaining = nextRank ? t('perks.helperCard.remaining', { remaining: Math.max(0, target - count), levelName: t(ACTIVITY_LEVEL_LABEL_KEYS[nextRank]) }) : remainingLabel
  const frontSummary = `${identityName}, ${levelLabel}, ${t('perks.pointsCard.totalHelps', { count })}, ${format.format(balance)} ${t('perks.helperCard.balance')}`
  const backSummary = ranks.map(([rank, threshold]) => `${t(ACTIVITY_LEVEL_LABEL_KEYS[rank])}: ${t('perks.helperCard.requirement', { count: threshold })}`).join('. ')
  const flip = () => setFlipped(value => !value)
  const stats = [
    { key: 'points', value: format.format(Math.round(animatedBalance)), label: t('perks.helperCard.balance') },
    { key: 'helps', value: format.format(count), label: t('perks.helperCard.helps') },
  ]
  const front = <View style={styles.face}>
    <Material level={level} />
    <View {...ltrProps} style={[styles.cardTop, row]}>
      <LinearGradient colors={level === 'none' || level === 'silver' ? ['#f6fbff', '#c2cfda'] : ['#fff0c8', '#e9bc66']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[styles.rankPill, { paddingHorizontal: 12 * scale, paddingVertical: 2 * scale }]}>
        <Text numberOfLines={1} adjustsFontSizeToFit style={[type.smallMedium, styles.rankText, { fontSize: 14 * scale, lineHeight: 25 * scale }]}>{levelLabel}</Text>
      </LinearGradient>
      <Text style={[type.display, styles.brand, { fontSize: 32 * scale, lineHeight: 48 * scale }]}>أخوو</Text>
    </View>
    <View {...ltrProps} style={[styles.identity, { left: rtl ? '24%' : '7%', right: rtl ? '7%' : '24%', flexDirection: rtl ? 'row' : 'row-reverse', gap: 9 * scale }]}>
      <View style={[styles.identityCopy, { alignItems: rtl ? 'flex-end' : 'flex-start' }]}>
        <Text numberOfLines={1} ellipsizeMode="tail" style={[type.title, align, styles.name, { fontSize: 16 * scale, lineHeight: 27 * scale }]}>{identityName}</Text>
        <Text style={[type.small, align, styles.community, { fontSize: 12 * scale, lineHeight: 20 * scale }]}>{t('perks.helperCard.community')}</Text>
      </View>
      <View style={[styles.avatar, { width: 45 * scale, height: 45 * scale, borderRadius: 24 * scale }]}>
        {avatar && avatar !== failedAvatar ? <Image source={{ uri: avatar }} resizeMode="cover" onError={() => setFailedAvatar(avatar)} accessible={false} style={StyleSheet.absoluteFill} /> : <User size={34 * scale} color="#ffffff" weight="fill" />}
      </View>
    </View>
    <View {...ltrProps} style={[styles.stats, row, { left: rtl ? '23%' : '5%', right: rtl ? '5%' : '23%' }]}>
      {stats.map((stat, index) => <View key={stat.key} style={[styles.stat, index === 0 && [styles.statDivider, { borderRightWidth: rtl ? 1 : 0, borderLeftWidth: rtl ? 0 : 1 }]]}>
        <Text accessibilityLabel={`${format.format(stat.key === 'helps' ? count : balance)} ${stat.label}`} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={.55}
          style={[type.display, styles.value, { fontSize: Math.max(22, 48 * Math.min(1, 4 / stat.value.length)) * scale, lineHeight: 59 * scale }]}>{stat.value}</Text>
        <Text numberOfLines={2} adjustsFontSizeToFit minimumFontScale={.75} style={[type.smallMedium, styles.statLabel, { fontSize: 14 * scale, lineHeight: 23 * scale }]}>{stat.label}</Text>
      </View>)}
    </View>
  </View>
  const back = <View style={styles.face}>
    <Material level={level} />
    <View style={[styles.backContent, { paddingHorizontal: 27 * scale }]}>
      <Text style={[type.title, styles.backTitle, { fontSize: 18 * scale, lineHeight: 29 * scale }]}>{t('perks.helperCard.path')}</Text>
      <View style={styles.rankList}>{ranks.map(([rank, threshold]) => <View {...ltrProps} key={rank} style={[styles.rankLine, row]}>
        <Text style={[type.smallMedium, styles.rankRequirement, { fontSize: 12 * scale, lineHeight: 24 * scale, color: count >= threshold ? '#d5ffed' : '#d0deea' }]}>{t('perks.helperCard.requirement', { count: threshold })}</Text>
        <Text style={[type.smallMedium, styles.rankRequirement, align, { fontSize: 12 * scale, lineHeight: 24 * scale, color: count >= threshold ? '#ffffff' : '#d0deea' }]}>{t(ACTIVITY_LEVEL_LABEL_KEYS[rank])}{level === rank ? ` · ${t('perks.helperCard.current')}` : ''}</Text>
      </View>)}</View>
      <Text style={[type.small, styles.backFootnote, { fontSize: 10 * scale, lineHeight: 18 * scale }]}>{t('perks.helperCard.backHint')}</Text>
    </View>
  </View>
  return <View onLayout={event => setCardWidth(event.nativeEvent.layout.width)} style={styles.section}>
    <Text accessibilityRole="header" style={[type.h2, align, styles.heading, { color: theme.colors.textPrimary }]}>{t('perks.helperCard.title')}</Text>
    <View style={styles.cardSpacing}>
      <MembershipTilt front={front} back={back} height={height} flipped={flipped} onFlip={flip} active={active} reduced={reduced}
        label={`${flipped ? backSummary : frontSummary}. ${t(flipped ? 'perks.helperCard.showFront' : 'perks.helperCard.showBack')}`} hint={t('perks.helperCard.flipHint')} />
    </View>
    <View style={styles.progressPanel}>
      <View {...ltrProps} style={[styles.progressTop, row]}>
        <View style={styles.nextPill}><Text style={[type.caption, styles.nextText]}>{t(level === 'green' ? 'perks.helperCard.current' : 'perks.helperCard.next')}</Text></View>
        <Text style={[type.smallMedium, align, styles.remaining]}>{level === 'green' ? t('perks.pointsCard.topLevel') : remaining}</Text>
      </View>
      <View {...ltrProps} accessibilityRole="progressbar" accessibilityLabel={t('perks.pointsCard.levelLabel')}
        aria-valuemin={0} aria-valuemax={target} aria-valuenow={Math.max(0, Math.min(count, target))} aria-valuetext={progressLabel}
        style={[styles.track, ltrStyle, { alignItems: rtl ? 'flex-end' : 'flex-start' }]}>
        <LinearGradient colors={['#088d95', '#0aa9a8']} start={{ x: rtl ? 1 : 0, y: 0 }} end={{ x: rtl ? 0 : 1, y: 0 }} style={[styles.fill, { width: `${animatedProgress * 100}%` }]} />
      </View>
      <Pressable {...ltrProps} accessibilityRole="button" accessibilityLabel={t(flipped ? 'perks.helperCard.showFront' : 'perks.helperCard.path')} onPress={flip} style={[styles.pathButton, ltrStyle, { flexDirection: rtl ? 'row' : 'row-reverse' }]}>
        {rtl ? <CaretLeft size={16} color="#3269ad" /> : <CaretRight size={16} color="#3269ad" />}
        <Text style={[type.smallMedium, styles.pathText]}>{t(flipped ? 'perks.helperCard.showFront' : 'perks.helperCard.path')}</Text>
      </Pressable>
    </View>
    <View {...ltrProps} accessible={false} accessibilityElementsHidden style={[styles.swatches, ltrStyle]}>
      {ranks.map(([rank], index) => <View key={rank} style={[styles.swatch, { left: `${index * 23}%`, top: index % 2 ? 14 : 9, transform: [{ rotateZ: '-14deg' }] }]}>
        <Image accessible={false} source={HELPER_CARD_MATERIALS[rank]} resizeMode="stretch" style={styles.swatchImage} />
      </View>)}
      <LinearGradient colors={['rgba(240,249,253,0)', theme.isDark ? theme.colors.background : '#e5f5ff']} style={styles.swatchFade} />
    </View>
  </View>
}

const styles = StyleSheet.create({
  section: { width: '100%' },
  heading: { color: '#0b2e48', marginBottom: 18, paddingHorizontal: 3 },
  cardSpacing: { marginHorizontal: 7, marginBottom: 23 },
  face: { width: '100%', height: '100%', borderRadius: 22, overflow: 'hidden', backgroundColor: '#103f58' },
  material: { position: 'absolute', width: '104%', height: '110%', top: '-5.4%', left: '-2%' },
  cardTop: { position: 'absolute', top: '9%', left: '10%', right: '7%', justifyContent: 'space-between', alignItems: 'center' },
  brand: { color: '#ffffff', textShadowColor: '#0b2d46', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 2 },
  rankPill: { borderRadius: 24, borderWidth: 1, borderColor: '#ffe6aa', maxWidth: '61%', boxShadow: '0 2px 3px rgba(0,0,0,.16)' },
  rankText: { color: '#3e2a10', textAlign: 'center' },
  identity: { position: 'absolute', top: '37%', right: '7%', left: '24%', alignItems: 'center', justifyContent: 'flex-end' },
  identityCopy: { flexShrink: 1, minWidth: 0 },
  name: { color: '#ffffff' },
  community: { color: '#c4f1eb' },
  avatar: { backgroundColor: '#a4bfd0', borderWidth: 1, borderColor: '#f4fcff', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 },
  stats: { position: 'absolute', left: '23%', right: '5%', bottom: '7%', alignItems: 'stretch' },
  stat: { width: '50%', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  statDivider: { borderRightWidth: 1, borderColor: 'rgba(215,240,246,.45)' },
  value: { color: '#ffffff', fontVariant: ['tabular-nums'], writingDirection: 'ltr', textAlign: 'center', width: '100%', textShadowColor: '#143a51', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 2 },
  statLabel: { color: '#ffffff', textAlign: 'center' },
  progressPanel: { paddingHorizontal: 16, paddingTop: 13, paddingBottom: 5, borderRadius: 22, borderWidth: 1, borderColor: '#ffffff', backgroundColor: '#f8fdffdf' },
  progressTop: { justifyContent: 'space-between', alignItems: 'center', gap: 9, marginBottom: 11 },
  nextPill: { backgroundColor: '#d1eec9', paddingVertical: 3, paddingHorizontal: 9, borderRadius: 18, flexShrink: 0 },
  nextText: { color: '#255336', fontSize: 10, lineHeight: 19 },
  remaining: { color: '#0e354d', flex: 1, lineHeight: 23, fontSize: 12 },
  track: { height: 12, borderRadius: 12, backgroundColor: '#cce6f4', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 12 },
  pathButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, minHeight: 43, paddingVertical: 8 },
  pathText: { color: '#3269ad', textAlign: 'center', flexShrink: 1 },
  swatches: { height: 77, marginTop: 13, marginHorizontal: 10, overflow: 'hidden' },
  swatch: { position: 'absolute', width: '35%', height: 90, borderRadius: 14, overflow: 'hidden' },
  swatchImage: { width: '100%', height: '100%' },
  swatchFade: { position: 'absolute', height: 30, bottom: 0, left: 0, right: 0 },
  backContent: { paddingVertical: '7%', height: '100%', justifyContent: 'space-between' },
  backTitle: { color: '#ffffff', textAlign: 'center' },
  rankList: { gap: 1 },
  rankLine: { justifyContent: 'space-between', gap: 10 },
  rankRequirement: { flexShrink: 1 },
  backFootnote: { color: '#c8eee9', textAlign: 'center' },
})
