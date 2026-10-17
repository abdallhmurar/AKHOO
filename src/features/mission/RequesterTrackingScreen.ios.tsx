import { MotionScene } from '../../components/motion/Motion'
import { FlowHeader } from '../../components/motion/RequestPresentation.ios'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Image, Linking, StyleSheet, Text, View, useWindowDimensions } from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowClockwise, Car, ChatCircleDots, Check, Crosshair, FlagCheckered, Handshake, MapPin, Phone, SealCheck } from 'phosphor-react-native'
import { useTranslation } from 'react-i18next'
import { AppScreen } from '../../components/v2'
import { Avatar, Button, Card, IconButton, useToast } from '../../components/ui'
import { VolunteerActivityBadge } from '../../components/VolunteerActivityBadge'
import { SanadMap } from '../../components/SanadMap'
import type { SanadMapRef } from '../../components/SanadMap.types'
import { getLastReadAt } from '../../lib/chatReadTracker'
import { telHref } from '../../lib/contactLinks'
import { dirStyles, useIsRTL } from '../../lib/direction'
import { translateActionError } from '../../lib/rpcErrors'
import { supabase } from '../../lib/supabase'
import { radius, shadow, space, useSanadTheme } from '../../lib/theme'
import { formatElapsed } from '../../lib/time'
import { useAppTypography } from '../../lib/typography'
import type { Mission, MissionStatus } from '../../repositories/domainTypes'
import { messageRepository, type ChatMessage } from '../../repositories/messageRepository'
import { missionRepository } from '../../repositories/missionRepository'
import { profileRepository } from '../../repositories/profileRepository'
import { normalizeAppError } from '../../services/errors'
import { queryKeys } from '../../services/queryKeys'

export const REQUESTER_TRACKING_STATUSES: MissionStatus[] = ['assigned', 'on_the_way', 'arrived', 'in_progress', 'awaiting_confirmation']
const TIMELINE = [
  { status: 'assigned', labelKey: 'common.timeline.accepted', Icon: Handshake },
  { status: 'on_the_way', labelKey: 'common.timeline.on_the_way', Icon: Car },
  { status: 'arrived', labelKey: 'common.timeline.arrived', Icon: MapPin },
  { status: 'awaiting_confirmation', labelKey: 'common.timeline.awaiting_confirmation', Icon: SealCheck },
  { status: 'completed', labelKey: 'common.timeline.completed', Icon: FlagCheckered }
]
const COPY = {
  ar: { acceptedTitle: 'المساعد استلم طلبك', subtitle: 'تابع تقدّمه وتواصل معه من هون', accepted: 'تم القبول', since: 'تم القبول منذ', call: 'اتصال', recenter: 'إعادة توسيط الخريطة' },
  en: { acceptedTitle: 'Your helper accepted', subtitle: 'Follow their progress and stay in touch here.', accepted: 'Accepted', since: 'Accepted', call: 'Call', recenter: 'Recenter map' },
  he: { acceptedTitle: 'הבקשה שלך התקבלה', subtitle: 'כאן אפשר לעקוב אחר ההתקדמות וליצור קשר', accepted: 'התקבלה', since: 'הבקשה התקבלה לפני', call: 'התקשרות', recenter: 'מרכוז המפה מחדש' }
} as const

function useUnreadCount(requestId: string, userId: string) {
  const queryClient = useQueryClient()
  const [lastReadAt, setLastReadAt] = useState<string | null>(null)
  const messages = useQuery({ queryKey: queryKeys.missionMessages(requestId), queryFn: () => messageRepository.list(requestId) })
  useEffect(() => messageRepository.subscribe(requestId, message => {
    queryClient.setQueryData<ChatMessage[]>(queryKeys.missionMessages(requestId), current =>
      current?.some(existing => existing.id === message.id) ? current : [...(current ?? []), message]
    )
  }), [requestId, queryClient])
  useFocusEffect(useCallback(() => {
    let active = true
    getLastReadAt(requestId).then(value => { if (active) setLastReadAt(value) })
    return () => { active = false }
  }, [requestId]))
  return (messages.data ?? []).filter(message => message.sender_id !== userId && (!lastReadAt || message.created_at > lastReadAt)).length
}

export function RequesterTrackingScreen({ mission }: { mission: Mission }) {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const { height } = useWindowDimensions()
  const compact = height < 720
  const { t, i18n } = useTranslation()
  const copy = COPY[i18n.language.startsWith('he') ? 'he' : i18n.language.startsWith('en') ? 'en' : 'ar']
  const router = useRouter()
  const queryClient = useQueryClient()
  const toast = useToast()
  const mapRef = useRef<SanadMapRef>(null)
  const [now, setNow] = useState(Date.now())
  const [refreshing, setRefreshing] = useState(false)
  const [responding, setResponding] = useState(false)
  const other = useQuery({ queryKey: mission.helper_id ? queryKeys.profile(mission.helper_id) : ['participant'], queryFn: () => profileRepository.get(mission.helper_id!), enabled: !!mission.helper_id })
  const volunteerCount = useQuery({
    queryKey: ['volunteer-completed-count', mission.helper_id],
    queryFn: async () => {
      const { data } = await supabase.rpc('get_volunteer_completed_count', { p_volunteer_id: mission.helper_id })
      return (data as number | null) ?? 0
    },
    enabled: !!mission.helper_id
  })
  const unreadCount = useUnreadCount(mission.request_id, mission.requester_id)
  const status = mission.status === 'in_progress' ? 'arrived' : mission.status
  const activeIndex = TIMELINE.findIndex(step => step.status === status)
  const awaitingConfirmation = status === 'awaiting_confirmation'
  const latitude = mission.request?.latitude ?? 31.7784
  const longitude = mission.request?.longitude ?? 35.2066

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(timer)
  }, [])

  async function refresh() {
    setRefreshing(true)
    try { await queryClient.invalidateQueries({ queryKey: queryKeys.mission(mission.id) }, { throwOnError: true }) }
    catch (cause) { toast.show(translateActionError(t, normalizeAppError(cause)), 'error') } finally { setRefreshing(false) }
  }

  async function respond(confirmed: boolean) {
    if (!awaitingConfirmation || responding) return
    setResponding(true)
    try {
      await missionRepository.confirmCompletion(mission.id, confirmed)
      await queryClient.invalidateQueries({ queryKey: queryKeys.mission(mission.id) })
    } catch (cause) { toast.show(translateActionError(t, normalizeAppError(cause)), 'error') } finally { setResponding(false) }
  }

  return (
    <AppScreen
      header={<FlowHeader onBack={() => router.replace('/(tabs)')} />}
      contentStyle={compact ? styles.compactContent : styles.content}
      footer={<View style={styles.footer}><Button label={t('activeRequest.updateStatus')} variant="ghost" leading={<ArrowClockwise size={18} color={theme.colors.primary} />} loading={refreshing} onPress={refresh} style={{ backgroundColor: theme.colors.primarySoft }} /></View>}
    >
      <View style={styles.heading}>
        <Text accessibilityRole="header" style={[typography.h1, styles.center, { color: theme.colors.textPrimary }]}>{status === 'assigned' ? copy.acceptedTitle : t(`activeRequest.status.${status}`)}</Text>
        <Text style={[typography.body, styles.center, { color: theme.colors.textSecondary }]}>{awaitingConfirmation ? t('activeRequest.subtitleAwaitingConfirmation') : copy.subtitle}</Text>
      </View>

      <View style={[styles.mapFrame, { borderColor: theme.colors.border }]}>
        <SanadMap ref={mapRef} latitude={latitude} longitude={longitude} height={compact ? 145 : 190} zoom={13} style={styles.map} />
        <IconButton label={copy.recenter} icon={<Crosshair size={20} color={theme.colors.primary} />} onPress={() => mapRef.current?.recenter(latitude, longitude, 13)} style={{ ...styles.mapControl, [isRTL ? 'left' : 'right']: space.md }} />
      </View>

      <View style={[styles.card, compact && styles.compactCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <MotionScene name={awaitingConfirmation ? 'confirmation' : 'accepted'} style={{ height: compact ? 135 : 165, aspectRatio: 'auto' }} fit="contain" />
        <View style={[styles.timeline, dirStyles(isRTL).row]}>
          {TIMELINE.map((step, index) => {
            const active = index === activeIndex
            const done = index < activeIndex
            return <View key={step.status} style={styles.step}>
              <View style={[styles.nodeRow, dirStyles(isRTL).row]}>
                <View style={[styles.connector, { backgroundColor: index === 0 ? 'transparent' : done || active ? theme.colors.community : theme.colors.border }]} />
                <View style={[styles.node, { borderColor: done ? theme.colors.community : active ? theme.colors.primary : theme.colors.border, backgroundColor: done ? theme.colors.community : active ? theme.colors.primary : theme.colors.surface }]}>
                  {done ? <Check size={16} color={theme.colors.onCommunity} weight="bold" /> : <step.Icon size={16} color={active ? theme.colors.onPrimary : theme.colors.textMuted} />}
                </View>
                <View style={[styles.connector, { backgroundColor: index === TIMELINE.length - 1 ? 'transparent' : done ? theme.colors.community : theme.colors.border }]} />
              </View>
              <Text style={[typography.caption, styles.center, { color: active ? theme.colors.primary : theme.colors.textMuted }]}>{index === 0 ? copy.accepted : t(step.labelKey)}</Text>
            </View>
          })}
        </View>
        <Text style={[typography.caption, styles.center, { color: theme.colors.textMuted }]}>{copy.since} {formatElapsed(Math.max(0, now - new Date(mission.accepted_at ?? mission.created_at).getTime()), t)}{copy === COPY.en ? ' ago' : ''}</Text>
      </View>

      {awaitingConfirmation ? <Card tone="primary" elevation="none">
        <Text style={[typography.bodyMedium, styles.center, { color: theme.colors.textPrimary }]}>{t('activeRequest.confirmPrompt')}</Text>
        <View style={[styles.actions, dirStyles(isRTL).row]}>
          <View style={styles.action}><Button label={t('activeRequest.confirmReject')} variant="outline" loading={responding} onPress={() => respond(false)} style={styles.actionButton} /></View>
          <View style={styles.action}><Button label={t('activeRequest.confirmAccept')} variant="community" loading={responding} onPress={() => respond(true)} style={styles.actionButton} /></View>
        </View>
      </Card> : null}

      {other.data ? <View style={[styles.card, compact && styles.compactCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <View style={[styles.person, dirStyles(isRTL).row]}>
          <Avatar name={other.data.full_name || t('activeRequest.defaultVolunteerName')} uri={other.data.avatar_url} size={48} tone="community" />
          <View style={styles.personCopy}>
            <Text style={[typography.h3, { color: theme.colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{other.data.full_name || t('activeRequest.defaultVolunteerName')}</Text>
            <Text style={[typography.small, { color: theme.colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{t('points.completedCount', { count: volunteerCount.data ?? 0 })}</Text>
          </View>
          <VolunteerActivityBadge completedCount={volunteerCount.data ?? 0} />
        </View>
        <View style={[styles.actions, dirStyles(isRTL).row]}>
          {other.data.phone ? <View style={styles.action}><Button label={copy.call} variant="community" leading={<Phone size={18} color={theme.colors.onCommunity} weight="fill" />} onPress={() => Linking.openURL(telHref(other.data!.phone!))} style={styles.actionButton} /></View> : null}
          <View style={styles.action}>
            <Button label={t('activeRequest.chatButton')} leading={<ChatCircleDots size={18} color={theme.colors.onPrimary} />} onPress={() => router.push({ pathname: '/mission/[missionId]/chat', params: { missionId: mission.id } })} style={styles.actionButton} />
            {unreadCount > 0 ? <View style={[styles.unread, { [isRTL ? 'left' : 'right']: -4, backgroundColor: theme.colors.emergency, borderColor: theme.colors.surface }]}><Text style={[typography.caption, { color: theme.colors.onEmergency }]}>{unreadCount > 9 ? '9+' : unreadCount}</Text></View> : null}
          </View>
        </View>
      </View> : null}

      {mission.request?.photo_url ? <Image source={{ uri: mission.request.photo_url }} style={styles.photo} resizeMode="contain" /> : null}
    </AppScreen>
  )
}

const styles = StyleSheet.create({
  content: { gap: space.lg },
  compactContent: { gap: space.md },
  heading: { gap: space.sm },
  center: { textAlign: 'center' },
  footer: { width: '100%', maxWidth: 520, alignSelf: 'center' },
  mapFrame: { borderWidth: 1, borderRadius: radius.xl, overflow: 'hidden', ...shadow.soft },
  map: { marginTop: 0, borderWidth: 0, borderRadius: 0 },
  mapControl: { position: 'absolute', top: space.md },
  card: { gap: space.lg, padding: space.lg, borderRadius: radius.xl, borderWidth: 1, ...shadow.soft },
  compactCard: { gap: space.md, padding: space.md },
  timeline: { alignItems: 'flex-start' },
  step: { flex: 1, minWidth: 0, gap: 6 },
  nodeRow: { alignItems: 'center' },
  node: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  connector: { flex: 1, height: 2 },
  person: { alignItems: 'center', gap: space.md },
  personCopy: { flex: 1, minWidth: 0, gap: 3 },
  actions: { gap: space.sm, alignItems: 'stretch' },
  action: { flex: 1, minWidth: 0 },
  actionButton: { flex: 1, paddingHorizontal: space.sm },
  unread: { position: 'absolute', top: -6, minWidth: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  photo: { width: '100%', height: 180, borderRadius: radius.md }
})
