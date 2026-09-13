import { useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { BatteryWarning, CalendarBlank, CaretDown, CaretLeft, CaretRight, ClipboardText, Clock, GasPump, Handshake, Lock, MapPin, Star, Tire, Trophy, UsersThree, Wrench } from 'phosphor-react-native'
import { useTranslation } from 'react-i18next'
import { dirStyles, useIsRTL } from '../../lib/direction'
import { getVolunteerActivityLevel, ACTIVITY_LEVEL_LABEL_KEYS, ACTIVITY_LEVEL_THRESHOLDS } from '../../lib/activityLevel'
import { radius, space, useSanadTheme } from '../../lib/theme'
import { useAppTypography } from '../../lib/typography'
import { useAuth } from '../../providers'
import { activityRepository, type ActivityEntry } from '../../repositories/activityRepository'
import { queryKeys } from '../../services/queryKeys'
import type { ServiceType } from '../../types'
import { AppScreen, ScreenHeader } from '../../components/v2'
import { BottomSheet, EmptyState, Skeleton, StatusBadge, Tabs } from '../../components/ui'

type Filter = 'all' | 'given' | 'received' | 'points'
type Duration = 7 | 30 | 90 | 'all'

const SERVICE_ICONS: Record<ServiceType, typeof BatteryWarning> = {
  battery: BatteryWarning,
  tire: Tire,
  fuel: GasPump,
  locked_car: Lock,
  other: Wrench
}

const DURATION_OPTIONS: { value: Duration; labelKey: string }[] = [
  { value: 7, labelKey: 'activity.duration.last7' },
  { value: 30, labelKey: 'activity.duration.last30' },
  { value: 90, labelKey: 'activity.duration.last90' },
  { value: 'all', labelKey: 'activity.duration.allTime' }
]

const TOP_THRESHOLD = ACTIVITY_LEVEL_THRESHOLDS.green
const TIER_MARKS = [ACTIVITY_LEVEL_THRESHOLDS.bronze, ACTIVITY_LEVEL_THRESHOLDS.silver, ACTIVITY_LEVEL_THRESHOLDS.gold, ACTIVITY_LEVEL_THRESHOLDS.green]

// Real SANAD Activity - a unified feed over the same real data as the intact
// src/screens/HistoryScreen.tsx (requests + volunteer missions), plus real
// volunteer points. The duration pill and level card both read the same
// real numbers used elsewhere (VolunteerPointsCard's progress mechanic,
// rewardRepository's summed balance) rather than inventing new ones.
export function ActivityScreen() {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const { t } = useTranslation()
  const router = useRouter()
  const { session } = useAuth()
  const [filter, setFilter] = useState<Filter>('all')
  const [duration, setDuration] = useState<Duration>(30)
  const [durationOpen, setDurationOpen] = useState(false)
  const query = useQuery({ queryKey: session ? queryKeys.activity(session.user.id) : ['activity'], queryFn: () => activityRepository.list(session!.user.id), enabled: !!session })

  const cutoff = duration === 'all' ? null : Date.now() - duration * 24 * 60 * 60 * 1000
  const entries = useMemo(
    () => (query.data ?? [])
      .filter(entry => filter === 'all' || entry.type === filter)
      .filter(entry => cutoff === null || new Date(entry.occurredAt).getTime() >= cutoff),
    [query.data, filter, cutoff]
  )

  // The three stat cards and the level are lifetime totals - not scoped to
  // the duration pill, which only trims which list rows show below.
  const givenCount = query.data?.filter(item => item.type === 'given' && item.status === 'completed').length ?? 0
  const receivedCount = query.data?.filter(item => item.type === 'received' && item.status === 'completed').length ?? 0
  const totalPoints = query.data?.filter(item => item.type === 'points').reduce((total, item) => total + (item.points ?? 0), 0) ?? 0

  const level = getVolunteerActivityLevel(givenCount)
  const nextThreshold = TIER_MARKS.find(mark => mark > givenCount) ?? null
  const progressFraction = Math.min(givenCount, TOP_THRESHOLD) / TOP_THRESHOLD
  const levelLabelKey = level === 'none' ? 'activityLevel.none' : ACTIVITY_LEVEL_LABEL_KEYS[level]

  const selectedDuration = DURATION_OPTIONS.find(option => option.value === duration)!

  return (
    <AppScreen contentStyle={styles.content}>
      <ScreenHeader
        title={t('activity.title')}
        subtitle={t('activity.subtitle')}
        trailing={
          <Pressable onPress={() => setDurationOpen(true)} style={[styles.durationPill, dirStyles(isRTL).row, { backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.border }]}>
            <CalendarBlank size={14} color={theme.colors.textSecondary} />
            <Text numberOfLines={1} style={[typography.caption, { color: theme.colors.textSecondary }]}>{t(selectedDuration.labelKey)}</Text>
            <CaretDown size={12} color={theme.colors.textMuted} />
          </Pressable>
        }
      />

      <View style={[styles.levelCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <View style={[styles.levelTop, dirStyles(isRTL).row]}>
          <View style={[styles.levelIconWrap, { backgroundColor: theme.colors.rewardSoft }]}>
            <Star size={20} color={theme.colors.reward} weight="fill" />
          </View>
          <View style={styles.levelTextCol}>
            <Text style={[typography.caption, { color: theme.colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{t('activity.levelCard.title')}</Text>
            <Text style={[typography.bodyMedium, { color: theme.colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{t(levelLabelKey)}</Text>
          </View>
        </View>
        <View style={[styles.progressTrack, { backgroundColor: theme.colors.surfaceMuted }]}>
          <View style={[styles.progressFill, { width: `${progressFraction * 100}%`, backgroundColor: theme.colors.community, [isRTL ? 'right' : 'left']: 0 }]} />
        </View>
        <Text style={[typography.caption, { color: theme.colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>
          {nextThreshold !== null ? t('points.nextTier', { remaining: nextThreshold - givenCount }) : t('points.topTier')}
        </Text>
      </View>

      <View style={[styles.stats, dirStyles(isRTL).row]}>
        <Stat Icon={UsersThree} value={receivedCount} label={t('activity.stats.received')} tone="primary" />
        <Stat Icon={Handshake} value={givenCount} label={t('activity.stats.given')} tone="community" />
        <Stat Icon={Star} value={totalPoints} label={t('activity.stats.points')} tone="reward" />
      </View>

      <Tabs
        value={filter}
        options={[
          { value: 'all', label: t('activity.all') },
          { value: 'given', label: t('activity.filters.given') },
          { value: 'received', label: t('activity.filters.received') },
          { value: 'points', label: t('activity.filters.points') }
        ]}
        onChange={setFilter}
      />

      {query.isLoading ? <><Skeleton height={96} /><Skeleton height={96} /></> : null}
      {!query.isLoading && !entries.length ? <EmptyState title={t('activity.empty')} message={t('activity.emptyMessage')} /> : null}

      <View style={styles.list}>
        {entries.map(entry => (
          <ActivityCard key={entry.id} entry={entry} onPress={entry.missionId ? () => router.push({ pathname: '/mission/[missionId]', params: { missionId: entry.missionId! } }) : undefined} />
        ))}
      </View>

      <BottomSheet visible={durationOpen} onClose={() => setDurationOpen(false)} title={t('activity.duration.sheetTitle')}>
        {DURATION_OPTIONS.map(option => {
          const active = option.value === duration
          return (
            <Pressable key={option.value} onPress={() => { setDuration(option.value); setDurationOpen(false) }} style={[styles.durationOption, { borderColor: theme.colors.border }]}>
              <Text style={[typography.bodyMedium, { color: active ? theme.colors.primary : theme.colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{t(option.labelKey)}</Text>
            </Pressable>
          )
        })}
      </BottomSheet>
    </AppScreen>
  )
}

function Stat({ Icon, value, label, tone }: { Icon: typeof Star; value: number; label: string; tone: 'primary' | 'community' | 'reward' }) {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const fills = { primary: theme.colors.primarySoft, community: theme.colors.communitySoft, reward: theme.colors.rewardSoft }
  const inks = { primary: theme.colors.primary, community: theme.colors.community, reward: theme.colors.rewardPressed }
  return (
    <View style={[styles.stat, { backgroundColor: fills[tone] }]}>
      <Icon size={18} color={inks[tone]} weight="fill" />
      <Text style={[typography.numeric, styles.statValue, { color: inks[tone] }]}>{value}</Text>
      <Text numberOfLines={2} style={[typography.caption, { color: theme.colors.textSecondary, textAlign: 'center' }]}>{label}</Text>
    </View>
  )
}

function ActivityCard({ entry, onPress }: { entry: ActivityEntry; onPress?: () => void }) {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const { t, i18n } = useTranslation()
  const Chevron = isRTL ? CaretLeft : CaretRight

  const tone = entry.type === 'received' ? 'primary' : entry.type === 'given' ? 'community' : 'reward'
  const color = tone === 'primary' ? theme.colors.primary : tone === 'community' ? theme.colors.community : theme.colors.rewardPressed
  const softColor = tone === 'primary' ? theme.colors.primarySoft : tone === 'community' ? theme.colors.communitySoft : theme.colors.rewardSoft
  const Icon = entry.type === 'received' ? ClipboardText : entry.type === 'given' ? Handshake : Trophy
  const ServiceIcon = entry.serviceType ? SERVICE_ICONS[entry.serviceType] : null

  const subtitle = entry.type === 'points'
    ? (entry.pointsReason ? t(`activity.pointsReason.${entry.pointsReason}`) : '')
    : entry.serviceType
      ? t(`request.${entry.serviceType === 'locked_car' ? 'lockedCar' : entry.serviceType}`)
      : entry.note ?? ''

  const occurred = new Date(entry.occurredAt)
  const dateLabel = occurred.toLocaleDateString(i18n.language)
  const timeLabel = occurred.toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' })

  return (
    <Pressable disabled={!onPress} onPress={onPress} style={[styles.card, dirStyles(isRTL).row, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      {onPress ? <Chevron size={16} color={theme.colors.textMuted} /> : <View style={styles.chevronPlaceholder} />}
      <View style={[styles.cardIconWrap, { backgroundColor: softColor }]}>
        {ServiceIcon ? <ServiceIcon size={20} color={color} weight="duotone" /> : <Icon size={20} color={color} weight="duotone" />}
      </View>
      <View style={styles.cardBody}>
        <View style={[styles.cardTopRow, dirStyles(isRTL).row]}>
          <Text numberOfLines={1} style={[typography.bodyMedium, styles.cardTitle, { color: theme.colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{t(`activity.typeLabel.${entry.type}`)}</Text>
          {entry.points ? (
            <View style={[styles.pointsBadge, dirStyles(isRTL).row, { backgroundColor: theme.colors.rewardSoft }]}>
              <Star size={11} color={theme.colors.rewardPressed} weight="fill" />
              <Text style={[typography.smallMedium, { color: theme.colors.rewardPressed }]}>{t('activity.pointsEarned', { points: entry.points })}</Text>
            </View>
          ) : (
            <StatusBadge label={t(`activity.status.${entry.status}`, { defaultValue: entry.status.replaceAll('_', ' ') })} tone={entry.status === 'completed' ? 'success' : 'info'} />
          )}
        </View>
        {subtitle ? <Text numberOfLines={1} style={[typography.caption, { color: theme.colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{subtitle}</Text> : null}
        <View style={[styles.cardMetaRow, dirStyles(isRTL).row]}>
          <View style={[styles.metaItem, dirStyles(isRTL).row]}>
            <CalendarBlank size={12} color={theme.colors.textMuted} />
            <Text style={[typography.caption, { color: theme.colors.textMuted }]}>{dateLabel}</Text>
          </View>
          <View style={[styles.metaItem, dirStyles(isRTL).row]}>
            <Clock size={12} color={theme.colors.textMuted} />
            <Text style={[typography.caption, { color: theme.colors.textMuted }]}>{timeLabel}</Text>
          </View>
          {entry.locationLabel ? (
            <View style={[styles.metaItem, dirStyles(isRTL).row]}>
              <MapPin size={12} color={theme.colors.textMuted} />
              <Text numberOfLines={1} style={[typography.caption, { color: theme.colors.textMuted }]}>{entry.locationLabel}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  content: { paddingTop: 0, gap: space.lg },

  durationPill: { alignItems: 'center', gap: 6, borderRadius: radius.pill, borderWidth: StyleSheet.hairlineWidth, paddingVertical: 8, paddingHorizontal: space.md },

  levelCard: { borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, padding: space.lg, gap: space.sm },
  levelTop: { alignItems: 'center', gap: space.sm },
  levelIconWrap: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  levelTextCol: { flex: 1, gap: 2 },
  progressTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { position: 'absolute', top: 0, bottom: 0, borderRadius: 4 },

  stats: { gap: space.sm },
  stat: { flex: 1, minHeight: 100, borderRadius: radius.lg, padding: space.md, justifyContent: 'center', alignItems: 'center', gap: 4 },
  statValue: { fontSize: 24 },

  list: { gap: space.md },
  card: { alignItems: 'center', gap: space.sm, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, padding: space.md },
  chevronPlaceholder: { width: 16 },
  cardIconWrap: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  cardBody: { flex: 1, gap: 4 },
  cardTopRow: { alignItems: 'center', gap: space.sm },
  cardTitle: { flex: 1 },
  pointsBadge: { alignItems: 'center', gap: 4, borderRadius: radius.pill, paddingVertical: 4, paddingHorizontal: space.sm },
  cardMetaRow: { alignItems: 'center', gap: space.md, flexWrap: 'wrap', marginTop: 2 },
  metaItem: { alignItems: 'center', gap: 4 },
  durationOption: { paddingVertical: space.md, borderBottomWidth: StyleSheet.hairlineWidth }
})
