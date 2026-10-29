import { useCallback, useEffect, useState } from 'react'
import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { CalendarBlank, CaretLeft, CaretRight, CheckCircle, Heart, Lock, Ticket, Tire, Wrench } from 'phosphor-react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useQuery } from '@tanstack/react-query'
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { AppScreen } from '../../components/v2'
import { BottomSheet, Skeleton } from '../../components/ui'
import { GuideTarget, useGuidePage } from '../guide/GuideProvider'
import { useAuth } from '../../providers'
import type { ActivityEntry } from '../../repositories/activityRepository'
import { mobileHubRepository } from '../../repositories/mobileHubRepository'
import { queryKeys } from '../../services/queryKeys'
import { periodStart, visibleActivity, type ActivityFilter, type ImpactData, type ImpactPeriod } from './model'
import { HubAction, HubHeader, HubNotice, HubTabs, ui, useHubStyle } from './ui'

export type ActivityViewProps = { data?: ImpactData; loading?: boolean; error?: boolean; period: ImpactPeriod; onPeriod: (period: ImpactPeriod) => void; onRetry: () => void; onEntry: (entry: ActivityEntry) => void; initialFilter?: ActivityFilter }

export function ActivityScreen() {
  const { session } = useAuth(), router = useRouter(), { view } = useLocalSearchParams<{ view?: string }>()
  const [period, setPeriod] = useState<ImpactPeriod>('month')
  const since = periodStart(period)
  const userId = session?.user.id ?? ''
  const query = useQuery({ queryKey: [...queryKeys.activity(userId), 'impact', since], queryFn: () => mobileHubRepository.impact(userId, since), enabled: !!userId })
  const { refetch } = query
  useFocusEffect(useCallback(() => { if (userId) void refetch() }, [userId, refetch]))
  useGuidePage('activity', query.isSuccess)
  return <ActivityView data={query.data} loading={query.isLoading} error={query.isError} period={period} onPeriod={setPeriod} onRetry={() => { void query.refetch() }} onEntry={entry => { if (entry.missionId) router.push({ pathname: '/mission/[missionId]', params: { missionId: entry.missionId } }) }} initialFilter={view === 'points' ? 'points' : undefined} />
}

export function ActivityView({ data, loading, error, period, onPeriod, onRetry, onEntry, initialFilter }: ActivityViewProps) {
  const h = useHubStyle(), { t } = useTranslation()
  const [expanded, setExpanded] = useState(!!initialFilter), [filter, setFilter] = useState<ActivityFilter>(initialFilter ?? 'given'), [calendarOpen, setCalendarOpen] = useState(false)
  useEffect(() => { if (initialFilter) { setExpanded(true); setFilter(initialFilter) } }, [initialFilter])
  const options = [{ value: 'month' as const, label: t('mobileHub.thisMonth') }, { value: 'all' as const, label: t('mobileHub.allTime') }]
  const entries = visibleActivity(data?.entries ?? [], filter, expanded)
  function showPoints() { setFilter('points'); setExpanded(true) }
  return <AppScreen background={h.background} contentStyle={ui.content}>
    <HubHeader title={t('activity.title')} actionLabel={t('mobileHub.selectPeriod')} onAction={() => setCalendarOpen(true)} icon={<CalendarBlank size={23} color={h.theme.colors.textPrimary} />} />
    <View><Text accessibilityRole="header" style={[h.title, { fontSize: 28, lineHeight: 42 }]}>{t('mobileHub.impactTitle')}</Text><Text style={h.body}>{t('mobileHub.impactSubtitle')}</Text></View>
    <HubTabs value={period} options={options} onChange={onPeriod} teal />
    <GuideTarget id="activity.stats">{loading ? <Skeleton height={216} /> : error ? <HubNotice><Text style={h.body}>{t('mobileHub.activityError')}</Text><HubAction label={t('perks.retry')} onPress={onRetry} subtle /></HubNotice> : data ? <LinearGradient colors={h.theme.isDark ? ['#123e38', '#102d2e'] : ['#e5fbf2', '#d6f7ed']} style={styles.impact}>
      <View style={[styles.impactTop, h.row]}><View style={styles.impactCopy}><Text adjustsFontSizeToFit numberOfLines={1} style={[h.numeric, styles.impactCount, { color: h.theme.isDark ? '#c9ffee' : '#073c40' }]}>{data.completed.toLocaleString()}</Text><Text style={[h.heading, { color: h.theme.isDark ? '#c9ffee' : '#073c40' }]}>{t('mobileHub.completedHelps')}</Text></View><Image source={require('../../../assets/mobile-hub/help-impact.png')} accessible={false} style={styles.impactArt} resizeMode="contain" /></View>
      <Pressable accessibilityRole="button" accessibilityLabel={t('mobileHub.pointsHistory')} onPress={showPoints} style={({ pressed }) => [styles.earned, h.row, { borderColor: h.theme.isDark ? '#477b6f' : '#9ce0cf', opacity: pressed ? 0.7 : 1 }]}><Ticket size={24} color={h.theme.isDark ? '#c9ffee' : '#087c75'} weight="fill" /><Text style={[h.numeric, { fontSize: 26, color: h.theme.isDark ? '#c9ffee' : '#073c40' }]}>{data.earned.toLocaleString()}</Text><Text style={[h.body, ui.flex, { color: h.theme.isDark ? '#c9ffee' : '#073c40' }]}>{t('mobileHub.earnedPoints')}</Text>{h.rtl ? <CaretLeft size={18} color={h.theme.colors.community} /> : <CaretRight size={18} color={h.theme.colors.community} />}</Pressable>
    </LinearGradient> : null}</GuideTarget>
    <GuideTarget id="activity.filters" style={styles.filters}>
      <View style={[styles.listHeading, h.row]}><Text accessibilityRole="header" style={[h.heading, ui.flex]}>{t(expanded ? 'mobileHub.activityHistory' : 'mobileHub.latestHelps')}</Text><Pressable accessibilityRole="button" onPress={() => { setExpanded(!expanded); setFilter(expanded ? 'given' : 'all') }} style={styles.textButton}><Text style={[h.body, { color: h.theme.colors.primary }]}>{t(expanded ? 'mobileHub.showLess' : 'mobileHub.showAll')}</Text></Pressable></View>
      {expanded ? <HubTabs value={filter} onChange={setFilter} options={[{ value: 'all', label: t('activity.all') }, { value: 'given', label: t('mobileHub.given') }, { value: 'received', label: t('mobileHub.received') }, { value: 'points', label: t('mobileHub.points') }]} /> : null}
    </GuideTarget>
    <GuideTarget id="activity.history"><View style={[styles.list, { backgroundColor: h.theme.colors.surface, borderColor: h.theme.colors.border }]}>
      {loading ? <Skeleton height={190} /> : !error && entries.length ? entries.map((entry, index) => <ActivityRow key={entry.id} entry={entry} last={index === entries.length - 1} onPress={() => onEntry(entry)} />) : !error ? <View style={styles.empty}><Heart size={28} color={h.theme.colors.community} weight="duotone" /><Text style={h.heading}>{t('activity.empty')}</Text><Text style={h.small}>{t('mobileHub.emptyActivity')}</Text></View> : null}
    </View></GuideTarget>
    {expanded && data?.historyLimited ? <Text style={h.small}>{t('mobileHub.historyLimited')}</Text> : null}
    <View style={[styles.thanks, h.row]}><Heart size={19} color="#ed727b" weight="fill" /><Text style={[h.small, { color: h.theme.colors.community }]}>{t('mobileHub.thanks')}</Text></View>
    <BottomSheet visible={calendarOpen} onClose={() => setCalendarOpen(false)} title={t('mobileHub.selectPeriod')}><HubTabs value={period} options={options} onChange={next => { onPeriod(next); setCalendarOpen(false) }} teal /></BottomSheet>
  </AppScreen>
}

function ActivityRow({ entry, last, onPress }: { entry: ActivityEntry; last: boolean; onPress: () => void }) {
  const h = useHubStyle(), { t, i18n } = useTranslation()
  const asset = entry.serviceType === 'battery' ? require('../../../previews/home-motion/activity/assets/icons/battery.png') : entry.serviceType === 'fuel' ? require('../../../previews/home-motion/activity/assets/icons/fuel.png') : undefined
  const Icon = entry.type === 'points' ? Ticket : entry.serviceType === 'tire' ? Tire : entry.serviceType === 'locked_car' ? Lock : Wrench
  const serviceKey = entry.serviceType === 'locked_car' ? 'lockedCar' : entry.serviceType
  const title = entry.type === 'points' ? t('mobileHub.pointsEarnedRow') : `${t(entry.type === 'given' ? 'mobileHub.help' : 'mobileHub.request')} ${serviceKey ? t(`request.${serviceKey}`) : ''}`
  return <Pressable accessibilityRole={entry.missionId ? 'button' : undefined} disabled={!entry.missionId} onPress={onPress} style={({ pressed }) => [styles.activityRow, h.row, { borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth, borderColor: h.theme.colors.border, backgroundColor: pressed ? h.theme.colors.surfaceMuted : 'transparent' }]}>
    <View style={[styles.serviceIcon, { backgroundColor: entry.type === 'points' ? h.theme.colors.rewardSoft : h.theme.colors.primarySoft }]}>{asset && entry.type !== 'points' ? <Image source={asset} style={styles.serviceImage} resizeMode="contain" accessible={false} /> : <Icon size={32} color={h.theme.colors.community} weight="duotone" />}</View>
    <View style={[ui.flex, { gap: 4 }]}><Text style={h.body}>{title}</Text><View style={[h.row, styles.rowMeta]}><Text style={h.small}>{new Date(entry.occurredAt).toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' })}</Text>{entry.status === 'completed' || entry.status === 'earned' ? <CheckCircle size={14} color={h.theme.colors.community} weight="fill" /> : null}<Text style={[h.small, { color: entry.status === 'completed' ? h.theme.colors.community : h.theme.colors.textSecondary }]}>{t(`activity.status.${entry.status}`, { defaultValue: entry.status === 'earned' ? t('mobileHub.earned') : entry.status.replaceAll('_', ' ') })}</Text></View></View>
    {typeof entry.points === 'number' ? <View style={styles.points}><Text style={[h.numeric, { fontSize: 21, color: h.theme.colors.community }]}>{'\u2066'}{entry.points > 0 ? '+' : ''}{entry.points}{'\u2069'}</Text><Text style={h.small}>{t('perks.pointsUnit')}</Text></View> : null}
  </Pressable>
}

const styles = StyleSheet.create({
  impact: { borderRadius: 24, padding: 13, overflow: 'hidden' },
  impactTop: { alignItems: 'center', gap: 4 },
  impactCopy: { width: '38%', minWidth: 90, paddingHorizontal: 4, zIndex: 1 },
  impactCount: { fontSize: 62, lineHeight: 76 },
  impactArt: { flex: 1, minWidth: 0, height: 173 },
  earned: { alignItems: 'center', gap: 10, paddingTop: 11, marginTop: 6, minHeight: 48, borderTopWidth: 1 },
  listHeading: { alignItems: 'center', gap: 8 },
  filters: { gap: 12 },
  textButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 3 },
  list: { borderRadius: 22, borderWidth: 1, paddingHorizontal: 12, overflow: 'hidden' },
  activityRow: { alignItems: 'center', paddingVertical: 13, gap: 10, minHeight: 83 },
  serviceIcon: { width: 48, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  serviceImage: { width: 43, height: 43 },
  points: { alignItems: 'center', maxWidth: '28%' },
  rowMeta: { alignItems: 'center', gap: 5, flexWrap: 'wrap' },
  thanks: { alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 6 },
  empty: { gap: 8, paddingVertical: 18 },
})
