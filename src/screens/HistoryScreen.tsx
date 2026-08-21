import { useEffect, useState } from 'react'
import type { ComponentType } from 'react'
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native'
import { BatteryWarning, ClockCounterClockwise, GasPump, Lock, Tire, Wrench } from 'phosphor-react-native'
import type { IconProps } from 'phosphor-react-native'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { colors, font, radius, space, type } from '../lib/theme'
import { dirStyles, useIsRTL } from '../lib/direction'
import type { HelpRequest } from '../types'
import { Header } from '../components/Header'
import { Screen } from '../components/Screen'
import { Surface } from '../components/Surface'
import { StatusPill } from '../components/StatusPill'

const ACTIVE_STATUSES = ['open', 'accepted', 'on_the_way', 'arrived', 'awaiting_confirmation']

const serviceMeta: Record<string, { labelKey: string; Icon: ComponentType<IconProps> }> = {
  battery: { labelKey: 'request.battery', Icon: BatteryWarning },
  tire: { labelKey: 'request.tire', Icon: Tire },
  fuel: { labelKey: 'request.fuel', Icon: GasPump },
  locked_car: { labelKey: 'request.lockedCar', Icon: Lock },
  other: { labelKey: 'request.other', Icon: Wrench }
}

type ReleaseEntry = { kind: 'release'; id: string; released_at: string }
type RequestEntry = { kind: 'request' } & HelpRequest & { pointsEarned: number | null }
type HistoryEntry = RequestEntry | ReleaseEntry

function entryDate(entry: HistoryEntry) {
  return entry.kind === 'request' ? entry.created_at : entry.released_at
}

function dayGroupLabel(iso: string, t: (key: string) => string, locale: string) {
  const date = new Date(iso)
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const diffDays = Math.round((startOfDay(new Date()) - startOfDay(date)) / 86_400_000)
  if (diffDays === 0) return t('activity.today')
  if (diffDays === 1) return t('activity.yesterday')
  return date.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: diffDays > 300 ? 'numeric' : undefined })
}

export function HistoryScreen({ userId, onBack, onOpen }: { userId: string; onBack: () => void; onOpen: (request: HelpRequest) => void }) {
  const { t, i18n } = useTranslation()
  const dir = dirStyles(useIsRTL())
  const [items, setItems] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(true)

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' })
  }

  useEffect(() => {
    Promise.all([
      supabase.from('help_requests').select('*').or(`requester_id.eq.${userId},volunteer_id.eq.${userId}`).order('created_at', { ascending: false }).limit(50),
      // Once a released mission gets reassigned to a different volunteer,
      // volunteer_id on the live row no longer points at this user - without
      // this, a volunteer's own release would silently vanish from their
      // history the moment someone else picks the request back up.
      supabase.from('help_request_releases').select('id, released_at').eq('volunteer_id', userId).order('released_at', { ascending: false }).limit(50),
      supabase.from('volunteer_point_transactions').select('request_id, points').eq('volunteer_id', userId)
    ]).then(([requestsResult, releasesResult, pointsResult]) => {
      if (requestsResult.error) Alert.alert(t('common.error'), requestsResult.error.message)
      const pointsByRequest = new Map((pointsResult.data ?? []).map(row => [row.request_id, row.points]))
      const requestEntries: HistoryEntry[] = ((requestsResult.data ?? []) as HelpRequest[]).map(r => ({ kind: 'request', ...r, pointsEarned: pointsByRequest.get(r.id) ?? null }))
      const releaseEntries: HistoryEntry[] = ((releasesResult.data ?? []) as { id: string; released_at: string }[]).map(r => ({ kind: 'release', id: r.id, released_at: r.released_at }))
      const merged = [...requestEntries, ...releaseEntries].sort((a, b) => new Date(entryDate(b)).getTime() - new Date(entryDate(a)).getTime())
      setItems(merged)
      setLoading(false)
    })
  }, [userId, t])

  const groups: { label: string; entries: HistoryEntry[] }[] = []
  for (const item of items) {
    const label = dayGroupLabel(entryDate(item), t, i18n.language)
    const lastGroup = groups[groups.length - 1]
    if (lastGroup && lastGroup.label === label) lastGroup.entries.push(item)
    else groups.push({ label, entries: [item] })
  }

  return (
    <Screen>
      <Header title={t('activity.title')} subtitle={t('activity.subtitle')} onBack={onBack} />

      {loading ? <Text style={styles.loading}>{t('common.loading')}</Text> : null}

      {!loading && items.length === 0 ? (
        <Surface elevation="soft" padding="xl" style={styles.emptyCard}>
          <ClockCounterClockwise size={32} color={colors.muted} weight="light" />
          <Text style={styles.emptyTitle}>{t('activity.empty')}</Text>
        </Surface>
      ) : null}

      {groups.map(group => (
        <View key={group.label} style={styles.group}>
          <Text style={[styles.groupLabel, dir.textStart]}>{group.label}</Text>
          {group.entries.map(item => {
            if (item.kind === 'release') {
              return (
                <Surface key={`release-${item.id}`} elevation="soft" padding="lg" style={styles.card}>
                  <View style={[styles.cardTop, dir.row]}>
                    <View style={styles.iconWrap}>
                      <ClockCounterClockwise size={22} color={colors.muted} weight="duotone" />
                    </View>
                    <View style={[styles.cardTextWrap, dir.alignStart]}>
                      <Text style={[styles.service, dir.textStart]}>{t('activity.releasedLabel')}</Text>
                      <Text style={[styles.status, dir.textStart]}>{t('activity.releasedReason')}</Text>
                    </View>
                    <Text style={styles.time}>{formatTime(item.released_at)}</Text>
                  </View>
                </Surface>
              )
            }
            const role = item.requester_id === userId ? 'requester' : 'volunteer'
            const active = ACTIVE_STATUSES.includes(item.status)
            const meta = serviceMeta[item.service_type] ?? serviceMeta.other!
            return (
              <Pressable key={item.id} onPress={() => onOpen(item)}>
                <Surface elevation="soft" padding="lg" style={styles.card}>
                  <View style={[styles.cardTop, dir.row]}>
                    <View style={styles.iconWrap}>
                      <meta.Icon size={22} color={colors.forest} weight="duotone" />
                    </View>
                    <View style={[styles.cardTextWrap, dir.alignStart]}>
                      <Text style={[styles.service, dir.textStart]}>{t(meta.labelKey)}</Text>
                      <Text style={[styles.status, dir.textStart]}>{t(`activity.status.${item.status}`)}</Text>
                    </View>
                    <Text style={styles.time}>{formatTime(item.created_at)}</Text>
                  </View>
                  <View style={[styles.cardBottom, dir.row]}>
                    <StatusPill
                      label={role === 'requester' ? t('activity.roleRequester') : t('activity.roleVolunteer')}
                      tone={active ? 'success' : 'brand'}
                      pulse={active}
                    />
                    {item.pointsEarned ? <Text style={styles.points}>{t('activity.pointsEarned', { points: item.pointsEarned })}</Text> : null}
                  </View>
                </Surface>
              </Pressable>
            )
          })}
        </View>
      ))}
    </Screen>
  )
}

const styles = StyleSheet.create({
  loading: { color: colors.muted, textAlign: 'center', marginTop: 20 },
  emptyCard: { alignItems: 'center', gap: space.sm },
  emptyTitle: { color: colors.text, fontFamily: font.bold, fontSize: 15 },

  group: { marginBottom: space.md },
  groupLabel: { ...type.caption, color: colors.muted, fontFamily: font.bold, marginBottom: space.sm, textTransform: 'uppercase' },

  card: { marginBottom: space.sm, gap: space.sm },
  cardTop: { alignItems: 'center', gap: space.md },
  iconWrap: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.sageSoft, alignItems: 'center', justifyContent: 'center' },
  cardTextWrap: { flex: 1 },
  service: { color: colors.text, fontFamily: font.extraBold, fontSize: 15.5 },
  status: { color: colors.muted, fontFamily: font.regular, fontSize: 13, marginTop: 2 },
  time: { color: colors.muted, fontFamily: font.regular, fontSize: 12 },
  cardBottom: { justifyContent: 'space-between', alignItems: 'center' },
  points: { color: colors.forest, fontFamily: font.bold, fontSize: 13 }
})
