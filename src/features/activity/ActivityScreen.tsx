import { GuideTarget, useGuidePage } from '../guide/GuideProvider'
import { useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { BatteryWarning, CalendarBlank, CaretDown, CaretLeft, CaretRight, ClipboardText, ClockCounterClockwise, GasPump, Handshake, Lock, Star, Tire, Trophy, UsersThree, Wrench } from 'phosphor-react-native'
import { useTranslation } from 'react-i18next'
import { dirStyles, useIsRTL } from '../../lib/direction'
import { getVolunteerActivityLevel, ACTIVITY_LEVEL_LABEL_KEYS, ACTIVITY_LEVEL_THRESHOLDS } from '../../lib/activityLevel'
import { radius, space, useSanadTheme } from '../../lib/theme'
import { useAppTypography } from '../../lib/typography'
import { useAuth } from '../../providers'
import { activityRepository, type ActivityEntry } from '../../repositories/activityRepository'
import { queryKeys } from '../../services/queryKeys'
import type { ServiceType } from '../../types'
import { AppScreen } from '../../components/v2'
import { BottomSheet, Button, EmptyState, Skeleton, StatusBadge, Tabs } from '../../components/ui'

import { HelperMedal } from '../../components/HelperMedal'
import { supabase } from '../../lib/supabase'
import { rewardRepository } from '../../repositories/rewardRepository'

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

  // Reuse the same lifetime count and spendable balance as the Perks screen.
  // The activity feed is capped at 50 requests, so it cannot determine a tier.
  const completedQuery = useQuery({
    queryKey: ['community', 'completed-count', session?.user.id],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_volunteer_completed_count', { p_volunteer_id: session!.user.id })
      if (error) throw error
      return (data as number | null) ?? 0
    }
  })
  const pointsQuery = useQuery({ queryKey: ['community', 'points', session?.user.id], enabled: !!session, queryFn: () => rewardRepository.points(session!.user.id) })
  const receivedQuery = useQuery({
    queryKey: ['activity', 'received-count', session?.user.id], enabled: !!session,
    queryFn: async () => {
      const { count, error } = await supabase.from('help_requests').select('id', { count: 'exact', head: true }).eq('requester_id', session!.user.id).eq('status', 'completed')
      if (error) throw error
      return count ?? 0
    }
  })
  const givenCount = completedQuery.data ?? 0
  const level = getVolunteerActivityLevel(givenCount)
  const nextThreshold = TIER_MARKS.find(mark => mark > givenCount) ?? null
  const nextLevel = nextThreshold === null ? null : getVolunteerActivityLevel(nextThreshold)
  const progressFraction = Math.min(givenCount / (nextThreshold ?? TOP_THRESHOLD), 1)
  const levelLabelKey = level === 'none' ? 'activityLevel.none' : ACTIVITY_LEVEL_LABEL_KEYS[level]
  const statsReady = completedQuery.isSuccess && receivedQuery.isSuccess && pointsQuery.isSuccess
  const statsError = completedQuery.isError || receivedQuery.isError || pointsQuery.isError

  useGuidePage('activity', statsReady && query.isSuccess && !durationOpen)
  const selectedDuration = DURATION_OPTIONS.find(option => option.value === duration)!

  return (
    <AppScreen contentStyle={styles.content}>
      <View style={[styles.header, dirStyles(isRTL).row]}>
        <View style={styles.headerCopy}>
          <Text accessibilityRole="header" style={[typography.h1, styles.title, { color: theme.colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{t('activity.title')}</Text>
          <Text style={[typography.small, { color: theme.colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{t('activity.hubSubtitle')}</Text>
        </View>
        <View style={[styles.historyIcon, { backgroundColor: theme.colors.primarySoft }]}><ClockCounterClockwise size={50} color={theme.colors.primary} weight="bold" /></View>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel={t('activity.duration.sheetTitle')} accessibilityState={{ expanded: durationOpen }} onPress={() => setDurationOpen(true)} style={[styles.durationPill, dirStyles(isRTL).row, { alignSelf: isRTL ? 'flex-start' : 'flex-end', backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <CalendarBlank size={18} color={theme.colors.textSecondary} />
        <Text style={[typography.smallMedium, { color: theme.colors.textSecondary }]}>{t(selectedDuration.labelKey)}</Text>
        <CaretDown size={16} color={theme.colors.textMuted} />
      </Pressable>

      {!statsReady ? statsError ? <Button variant="outline" label={t('perks.retry')} onPress={() => { void completedQuery.refetch(); void receivedQuery.refetch(); void pointsQuery.refetch() }} /> : <Skeleton height={210} /> : <>
        <View style={[styles.levelCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <View style={[styles.levelTop, dirStyles(isRTL).row]}>
            <HelperMedal level={level} size={44} />
            <View style={styles.levelTextCol}>
              <Text style={[typography.h3, { color: theme.colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{t(levelLabelKey)}</Text>
              <Text style={[typography.caption, { color: theme.colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{nextThreshold !== null && nextLevel ? t('perks.pointsCard.remainingToLevel', { remaining: nextThreshold - givenCount, levelName: t(ACTIVITY_LEVEL_LABEL_KEYS[nextLevel]) }) : t('points.topTier')}</Text>
            </View>
            <View style={styles.helpCount}>
              <Text style={[typography.h1, styles.helpValue, { color: theme.colors.textPrimary }]}>{givenCount}</Text>
              <Text style={[typography.small, { color: theme.colors.textSecondary }]}>{t('activity.helpUnit')}</Text>
            </View>
          </View>
          <View accessibilityRole="progressbar" accessibilityLabel={t('activity.levelCard.title')} accessibilityValue={{ min: 0, max: nextThreshold ?? TOP_THRESHOLD, now: Math.min(givenCount, nextThreshold ?? TOP_THRESHOLD) }} style={[styles.progressTrack, { backgroundColor: theme.colors.surfaceStrong }]}>
            <View style={[styles.progressFill, { width: `${progressFraction * 100}%`, backgroundColor: theme.colors.primary, [isRTL ? 'right' : 'left']: 0 }]} />
          </View>
          <Text style={[typography.caption, { color: theme.colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{t('perks.helpProgress', { count: givenCount, target: nextThreshold ?? TOP_THRESHOLD })}</Text>
        </View>
        <GuideTarget id="activity.stats"><View style={[styles.stats, dirStyles(isRTL).row]}>
          <Stat Icon={UsersThree} value={receivedQuery.data ?? 0} label={t('activity.stats.received')} tone="primary" />
          <Stat Icon={Handshake} value={givenCount} label={t('activity.givenShort')} tone="community" />
          <Stat Icon={Star} value={pointsQuery.data?.balance ?? 0} label={t('activity.stats.points')} tone="reward" />
        </View></GuideTarget>
      </>}

      <GuideTarget id="activity.filters"><Tabs
        appearance="pill"
        label={t('activity.title')}
        value={filter}
        options={[
          { value: 'all', label: t('activity.all') },
          { value: 'given', label: t('activity.filters.given') },
          { value: 'received', label: t('activity.filters.received') },
          { value: 'points', label: t('activity.filters.points') }
        ]}
        onChange={setFilter}
      /></GuideTarget>

      {query.isLoading ? <><Skeleton height={96} /><Skeleton height={96} /></> : null}
      {query.isError ? <Button variant="outline" label={t('perks.retry')} onPress={() => { void query.refetch() }} /> : null}
      {query.isSuccess && !entries.length ? <EmptyState title={t('activity.empty')} message={t('activity.emptyMessage')} /> : null}

      <GuideTarget id="activity.history"><View style={styles.list}>
        {entries.map(entry => (
          <ActivityCard key={entry.id} entry={entry} onPress={entry.missionId ? () => router.push({ pathname: '/mission/[missionId]', params: { missionId: entry.missionId! } }) : undefined} />
        ))}
      </View></GuideTarget>

      <BottomSheet visible={durationOpen} onClose={() => setDurationOpen(false)} title={t('activity.duration.sheetTitle')}>
        {DURATION_OPTIONS.map(option => {
          const active = option.value === duration
          return (
            <Pressable key={option.value} accessibilityRole="radio" accessibilityState={{ checked: active }} onPress={() => { setDuration(option.value); setDurationOpen(false) }} style={[styles.durationOption, { borderColor: theme.colors.border }]}>
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
  const isRTL = useIsRTL()
  const fills = { primary: theme.colors.primarySoft, community: theme.colors.communitySoft, reward: theme.colors.rewardSoft }
  const inks = { primary: theme.colors.primary, community: theme.colors.community, reward: theme.colors.rewardPressed }
  return (
    <View style={[styles.stat, { backgroundColor: fills[tone] }]}>
      <View style={[styles.statTop, dirStyles(isRTL).row]}><Text style={[typography.numeric, styles.statValue, { color: inks[tone] }]}>{value}</Text><Icon size={28} color={inks[tone]} weight="fill" /></View>
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
  const ServiceIcon = entry.type === 'received' && entry.serviceType ? SERVICE_ICONS[entry.serviceType] : null

  const subtitle = entry.type === 'points'
    ? (entry.pointsReason ? t(`activity.pointsReason.${entry.pointsReason}`) : '')
    : entry.serviceType
      ? t(`request.${entry.serviceType === 'locked_car' ? 'lockedCar' : entry.serviceType}`)
      : entry.note ?? ''

  const occurred = new Date(entry.occurredAt)
  const dateLabel = occurred.toLocaleDateString(i18n.language)
  const timeLabel = occurred.toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' })

  return (
    <Pressable accessibilityRole={onPress ? 'button' : undefined} disabled={!onPress} onPress={onPress} style={({ pressed }) => [styles.card, dirStyles(isRTL).row, { backgroundColor: pressed ? theme.colors.surfaceMuted : theme.colors.surface, borderColor: theme.colors.border }]}>
      <View style={[styles.cardIconWrap, { backgroundColor: softColor }]}>
        {ServiceIcon ? <ServiceIcon size={26} color={color} weight="duotone" /> : <Icon size={26} color={color} weight="duotone" />}
      </View>
      <View style={styles.cardBody}>
        <Text style={[typography.bodyMedium, { color: theme.colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{t(`activity.typeLabel.${entry.type}`)}</Text>
        {subtitle ? <Text numberOfLines={2} style={[typography.caption, { color: theme.colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{subtitle}</Text> : null}
        <View style={[styles.cardMetaRow, dirStyles(isRTL).row]}>
          <Text style={[typography.caption, { color: theme.colors.textMuted }]}>{dateLabel}</Text>
          <Text style={[typography.caption, { color: theme.colors.textMuted }]}>{timeLabel}</Text>
          {entry.locationLabel ? <Text numberOfLines={1} style={[typography.caption, { color: theme.colors.textMuted, flexShrink: 1 }]}>{entry.locationLabel}</Text> : null}
        </View>
      </View>
      <View style={styles.statusColumn}>
        {entry.type === 'points' ? <StatusBadge label={t('activity.pointsEarned', { points: entry.points ?? 0 })} tone="reward" /> : <StatusBadge label={t(`activity.status.${entry.status}`, { defaultValue: entry.status.replaceAll('_', ' ') })} tone={entry.status === 'completed' ? 'success' : entry.status === 'cancelled' || entry.status === 'expired' ? 'neutral' : 'info'} />}
      </View>
      {onPress ? <Chevron size={18} color={theme.colors.textMuted} /> : null}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  content: { paddingTop: space.lg, paddingHorizontal: space.lg, gap: space.md },
  header: { alignItems: 'center', gap: space.md },
  headerCopy: { flex: 1, gap: 4 },
  title: { fontSize: 30, lineHeight: 44 },
  historyIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  durationPill: { minHeight: 44, alignItems: 'center', gap: space.sm, borderRadius: radius.pill, borderWidth: StyleSheet.hairlineWidth, paddingVertical: 8, paddingHorizontal: space.md },
  levelCard: { borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, padding: space.md, gap: space.sm },
  levelTop: { alignItems: 'center', gap: space.sm },
  levelTextCol: { flex: 1, gap: 4 },
  helpCount: { alignItems: 'center', minWidth: 52 },
  helpValue: { fontSize: 32, lineHeight: 40 },
  progressTrack: { height: 10, borderRadius: 5, overflow: 'hidden', marginTop: space.sm },
  progressFill: { position: 'absolute', top: 0, bottom: 0, borderRadius: 5 },
  stats: { gap: space.sm },
  stat: { flex: 1, minHeight: 94, borderRadius: radius.lg, padding: space.sm, justifyContent: 'center', alignItems: 'center', gap: 6 },
  statTop: { alignItems: 'center', justifyContent: 'center', gap: space.sm, flexWrap: 'wrap' },
  statValue: { fontSize: 25 },
  list: { gap: space.md },
  card: { minHeight: 102, alignItems: 'center', gap: space.sm, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, padding: space.md },
  cardIconWrap: { width: 44, height: 50, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  cardBody: { flex: 1, gap: 4 },
  statusColumn: { maxWidth: '30%', flexShrink: 1 },
  cardMetaRow: { alignItems: 'center', gap: space.sm, flexWrap: 'wrap', marginTop: 2 },
  durationOption: { minHeight: 44, paddingVertical: space.md, borderBottomWidth: StyleSheet.hairlineWidth }
})
