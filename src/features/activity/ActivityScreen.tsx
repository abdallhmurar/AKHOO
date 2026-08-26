import { useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, ArrowRight, HandHeart, Lifebuoy, Trophy } from 'phosphor-react-native'
import { useIsRTL } from '../../lib/direction'
import { radius, space, useSanadTheme } from '../../lib/theme'
import { useAppTypography } from '../../lib/typography'
import { useAuth, useLanguageDirection } from '../../providers'
import { activityRepository, type ActivityEntry } from '../../repositories/activityRepository'
import { queryKeys } from '../../services/queryKeys'
import { AppScreen, ScreenHeader } from '../../components/v2'
import { EmptyState, Skeleton, StatusBadge, Tabs } from '../../components/ui'
import { useV2Text } from '../v2Copy'

function useTrilingual() {
  const { language } = useLanguageDirection()
  return (ar: string, he: string, en: string) => language === 'en' ? en : language === 'he' ? he : ar
}

type Filter = 'all' | 'received' | 'given' | 'points'

export function ActivityScreen() {
  const isRTL = useIsRTL()
  const tr = useTrilingual()
  const t = useV2Text()
  const router = useRouter()
  const { session } = useAuth()
  const [filter, setFilter] = useState<Filter>('all')
  const query = useQuery({ queryKey: session ? queryKeys.activity(session.user.id) : ['activity'], queryFn: () => activityRepository.list(session!.user.id), enabled: !!session })
  const entries = useMemo(() => (query.data ?? []).filter(entry => filter === 'all' || entry.type === filter), [query.data, filter])
  const received = query.data?.filter(item => item.type === 'received' && item.status === 'completed').length ?? 0
  const given = query.data?.filter(item => item.type === 'given' && item.status === 'completed').length ?? 0
  const points = query.data?.filter(item => item.type === 'points').reduce((total, item) => total + (item.points ?? 0), 0) ?? 0
  return <AppScreen contentStyle={styles.content}>
    <ScreenHeader title={t('activity.title')} subtitle={tr('سجل موحد للمساندة والأثر', 'יומן מאוחד של סיוע והשפעה', 'One record of support and impact')} />
    <View style={[styles.stats, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}><Stat value={received} label={tr('تلقيت', 'קיבלתי', 'Received')} tone="primary" /><Stat value={given} label={tr('ساندت', 'סייעתי', 'Given')} tone="community" /><Stat value={points} label={tr('نقطة', 'נקודות', 'Points')} tone="reward" /></View>
    <Tabs value={filter} options={[{ value: 'all', label: t('activity.all') }, { value: 'received', label: tr('تلقيت', 'קיבלתי', 'Received') }, { value: 'given', label: tr('قدمت', 'נתתי', 'Given') }, { value: 'points', label: tr('نقاط', 'נקודות', 'Points') }]} onChange={setFilter} />
    {query.isLoading ? <><Skeleton height={96} /><Skeleton height={96} /></> : null}
    {!query.isLoading && !entries.length ? <EmptyState title={t('activity.empty')} message={tr('طلباتك ومهامك ونقاطك ستظهر هنا.', 'בקשות, משימות ונקודות יופיעו כאן.', 'Requests, missions, and points appear here.')} /> : null}
    <View style={styles.timeline}>{entries.map((entry, index) => <ActivityRow key={entry.id} entry={entry} last={index === entries.length - 1} onPress={entry.missionId ? () => router.push({ pathname: '/mission/[missionId]', params: { missionId: entry.missionId! } }) : undefined} />)}</View>
  </AppScreen>
}

function Stat({ value, label, tone }: { value: number; label: string; tone: 'primary' | 'community' | 'reward' }) {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const fills = { primary: theme.colors.primarySoft, community: theme.colors.communitySoft, reward: theme.colors.rewardSoft }
  const inks = { primary: theme.colors.primary, community: theme.colors.community, reward: theme.colors.rewardPressed }
  return <View style={[styles.stat, { backgroundColor: fills[tone] }]}><Text style={[typography.numeric, { color: inks[tone] }]}>{value}</Text><Text style={[typography.caption, { color: theme.colors.textSecondary }]}>{label}</Text></View>
}

function ActivityRow({ entry, last, onPress }: { entry: ActivityEntry; last: boolean; onPress?: () => void }) {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const tr = useTrilingual()
  const { language } = useLanguageDirection()
  const Arrow = isRTL ? ArrowLeft : ArrowRight
  const Icon = entry.type === 'received' ? Lifebuoy : entry.type === 'given' ? HandHeart : Trophy
  const color = entry.type === 'received' ? theme.colors.primary : entry.type === 'given' ? theme.colors.community : theme.colors.rewardPressed
  const title = entry.type === 'received' ? tr('تلقيت مساندة', 'קיבלתי סיוע', 'Help received') : entry.type === 'given' ? tr('قدمت مساندة', 'נתתי סיוע', 'Help given') : tr('نقاط أثر', 'נקודות השפעה', 'Impact points')
  const statuses: Record<string, string> = {
    open: tr('مفتوح', 'פתוח', 'Open'), matching: tr('جارٍ البحث', 'מחפשים התאמה', 'Matching'), accepted: tr('تم القبول', 'התקבל', 'Accepted'), assigned: tr('تمت المطابقة', 'נמצאה התאמה', 'Matched'), on_the_way: tr('في الطريق', 'בדרך', 'En route'), arrived: tr('وصل', 'הגיע', 'Arrived'), in_progress: tr('قيد التنفيذ', 'בתהליך', 'In progress'), awaiting_confirmation: tr('بانتظار التأكيد', 'ממתין לאישור', 'Awaiting confirmation'), completed: tr('مكتمل', 'הושלם', 'Completed'), cancelled: tr('ملغى', 'בוטל', 'Cancelled'), disputed: tr('قيد المراجعة', 'בבדיקה', 'Under review')
  }
  const dateLocale = language === 'en' ? 'en-IL' : language === 'he' ? 'he-IL' : 'ar-IL'
  return <Pressable disabled={!onPress} onPress={onPress} style={[styles.activityRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}><View style={styles.rail}><View style={[styles.node, { backgroundColor: `${color}18` }]}><Icon size={21} color={color} weight="duotone" /></View>{!last ? <View style={[styles.line, { backgroundColor: theme.colors.border }]} /> : null}</View><View style={[styles.activityCard, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}><View style={[styles.activityTop, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}><View style={{ flex: 1 }}><Text style={[typography.bodyMedium, { color: theme.colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{title}</Text><Text numberOfLines={1} style={[typography.caption, { color: theme.colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{entry.title}</Text></View>{entry.points ? <Text style={[typography.title, { color }]}>+{entry.points}</Text> : <StatusBadge label={statuses[entry.status] ?? entry.status.replaceAll('_', ' ')} tone={entry.status === 'completed' ? 'success' : 'info'} />}{onPress ? <Arrow size={16} color={theme.colors.textMuted} /> : null}</View><Text style={[typography.caption, { color: theme.colors.textMuted }]}>{new Date(entry.occurredAt).toLocaleString(dateLocale)}</Text></View></Pressable>
}

const styles = StyleSheet.create({
  content: { paddingTop: 0, gap: space.xl }, stats: { gap: space.sm }, stat: { flex: 1, minHeight: 94, borderRadius: radius.lg, padding: space.md, justifyContent: 'center', alignItems: 'center' }, timeline: { gap: 0 },
  activityRow: { gap: space.md }, rail: { width: 46, alignItems: 'center' }, node: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' }, line: { width: 2, flex: 1, minHeight: 60, marginVertical: 4 },
  activityCard: { flex: 1, minHeight: 92, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, padding: space.md, gap: space.sm, marginBottom: space.md }, activityTop: { alignItems: 'center', gap: space.sm }
})
