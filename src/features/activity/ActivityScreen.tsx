import { useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, ArrowRight, HandHeart, Lifebuoy, Trophy } from 'phosphor-react-native'
import { useTranslation } from 'react-i18next'
import { useIsRTL } from '../../lib/direction'
import { radius, space, useSanadTheme } from '../../lib/theme'
import { useAppTypography } from '../../lib/typography'
import { useAuth } from '../../providers'
import { activityRepository, type ActivityEntry } from '../../repositories/activityRepository'
import { queryKeys } from '../../services/queryKeys'
import { AppScreen, ScreenHeader } from '../../components/v2'
import { EmptyState, Skeleton, StatusBadge, Tabs } from '../../components/ui'

type Filter = 'all' | 'received' | 'given' | 'points'

// Real SANAD Activity - a unified feed over the same real data as the intact
// src/screens/HistoryScreen.tsx (requests + volunteer missions), plus real
// volunteer points, restyled with ccodex's stat-row/filter-tabs layout onto
// the real i18n system instead of his separate v2Copy dictionary.
export function ActivityScreen() {
  const isRTL = useIsRTL()
  const { t } = useTranslation()
  const router = useRouter()
  const { session } = useAuth()
  const [filter, setFilter] = useState<Filter>('all')
  const query = useQuery({ queryKey: session ? queryKeys.activity(session.user.id) : ['activity'], queryFn: () => activityRepository.list(session!.user.id), enabled: !!session })
  const entries = useMemo(() => (query.data ?? []).filter(entry => filter === 'all' || entry.type === filter), [query.data, filter])
  const received = query.data?.filter(item => item.type === 'received' && item.status === 'completed').length ?? 0
  const given = query.data?.filter(item => item.type === 'given' && item.status === 'completed').length ?? 0
  const points = query.data?.filter(item => item.type === 'points').reduce((total, item) => total + (item.points ?? 0), 0) ?? 0
  return (
    <AppScreen contentStyle={styles.content}>
      <ScreenHeader title={t('activity.title')} subtitle={t('activity.subtitle')} />
      <View style={[styles.stats, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <Stat value={received} label={t('activity.filters.received')} tone="primary" />
        <Stat value={given} label={t('activity.filters.given')} tone="community" />
        <Stat value={points} label={t('activity.filters.points')} tone="reward" />
      </View>
      <Tabs
        value={filter}
        options={[
          { value: 'all', label: t('activity.all') },
          { value: 'received', label: t('activity.filters.received') },
          { value: 'given', label: t('activity.filters.given') },
          { value: 'points', label: t('activity.filters.points') }
        ]}
        onChange={setFilter}
      />
      {query.isLoading ? <><Skeleton height={96} /><Skeleton height={96} /></> : null}
      {!query.isLoading && !entries.length ? <EmptyState title={t('activity.empty')} message={t('activity.emptyMessage')} /> : null}
      <View style={styles.timeline}>
        {entries.map((entry, index) => (
          <ActivityRow key={entry.id} entry={entry} last={index === entries.length - 1} onPress={entry.missionId ? () => router.push({ pathname: '/mission/[missionId]', params: { missionId: entry.missionId! } }) : undefined} />
        ))}
      </View>
    </AppScreen>
  )
}

function Stat({ value, label, tone }: { value: number; label: string; tone: 'primary' | 'community' | 'reward' }) {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const fills = { primary: theme.colors.primarySoft, community: theme.colors.communitySoft, reward: theme.colors.rewardSoft }
  const inks = { primary: theme.colors.primary, community: theme.colors.community, reward: theme.colors.rewardPressed }
  return (
    <View style={[styles.stat, { backgroundColor: fills[tone] }]}>
      <Text style={[typography.numeric, { color: inks[tone] }]}>{value}</Text>
      <Text style={[typography.caption, { color: theme.colors.textSecondary }]}>{label}</Text>
    </View>
  )
}

function ActivityRow({ entry, last, onPress }: { entry: ActivityEntry; last: boolean; onPress?: () => void }) {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const { t, i18n } = useTranslation()
  const Arrow = isRTL ? ArrowLeft : ArrowRight
  const Icon = entry.type === 'received' ? Lifebuoy : entry.type === 'given' ? HandHeart : Trophy
  const color = entry.type === 'received' ? theme.colors.primary : entry.type === 'given' ? theme.colors.community : theme.colors.rewardPressed
  const title = entry.type === 'received' ? t('activity.roleRequester') : entry.type === 'given' ? t('activity.roleVolunteer') : t('activity.pointsTitle')
  return (
    <Pressable disabled={!onPress} onPress={onPress} style={[styles.activityRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
      <View style={styles.rail}>
        <View style={[styles.node, { backgroundColor: `${color}18` }]}><Icon size={21} color={color} weight="duotone" /></View>
        {!last ? <View style={[styles.line, { backgroundColor: theme.colors.border }]} /> : null}
      </View>
      <View style={[styles.activityCard, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
        <View style={[styles.activityTop, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={{ flex: 1 }}>
            <Text style={[typography.bodyMedium, { color: theme.colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{title}</Text>
            <Text numberOfLines={1} style={[typography.caption, { color: theme.colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{entry.title}</Text>
          </View>
          {entry.points ? <Text style={[typography.title, { color }]}>+{entry.points}</Text> : <StatusBadge label={t(`activity.status.${entry.status}`, { defaultValue: entry.status.replaceAll('_', ' ') })} tone={entry.status === 'completed' ? 'success' : 'info'} />}
          {onPress ? <Arrow size={16} color={theme.colors.textMuted} /> : null}
        </View>
        <Text style={[typography.caption, { color: theme.colors.textMuted }]}>{new Date(entry.occurredAt).toLocaleString(i18n.language)}</Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  content: { paddingTop: 0, gap: space.xl },
  stats: { gap: space.sm },
  stat: { flex: 1, minHeight: 94, borderRadius: radius.lg, padding: space.md, justifyContent: 'center', alignItems: 'center' },
  timeline: { gap: 0 },
  activityRow: { gap: space.md },
  rail: { width: 46, alignItems: 'center' },
  node: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  line: { width: 2, flex: 1, minHeight: 60, marginVertical: 4 },
  activityCard: { flex: 1, minHeight: 92, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, padding: space.md, gap: space.sm, marginBottom: space.md },
  activityTop: { alignItems: 'center', gap: space.sm }
})
