import { useCallback, useEffect, useState } from 'react'
import { Image, Linking, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native'
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ArrowRight, Car, ChatCircleDots, Check, CheckCircle, FlagCheckered, Handshake, MapPin, Phone, SealCheck } from 'phosphor-react-native'
import { useTranslation } from 'react-i18next'
import { Avatar, Button, Card, IconButton, Surface, useToast } from '../../components/ui'
import { NavigationAppIcon } from '../../components/NavigationAppIcon'
import { SanadMap } from '../../components/SanadMap'
import { getLastReadAt } from '../../lib/chatReadTracker'
import { directionsHref, telHref } from '../../lib/contactLinks'
import { dirStyles, useIsRTL } from '../../lib/direction'
import { useNavigationApp } from '../../lib/navigationPreference'
import { translateActionError } from '../../lib/rpcErrors'
import { supabase } from '../../lib/supabase'
import { space, useSanadTheme } from '../../lib/theme'
import { useAppTypography } from '../../lib/typography'
import { useAuth } from '../../providers'
import type { Mission, MissionStatus } from '../../repositories/domainTypes'
import { messageRepository, type ChatMessage } from '../../repositories/messageRepository'
import { missionRepository } from '../../repositories/missionRepository'
import { profileRepository } from '../../repositories/profileRepository'
import { queryKeys } from '../../services/queryKeys'
import { normalizeAppError } from '../../services/errors'
import { LiveMissionScreen } from './MissionScreens'

const HELPER_STATUSES: MissionStatus[] = ['assigned', 'on_the_way', 'arrived', 'awaiting_confirmation']
const RELEASE_REASONS = ['cannot_reach', 'emergency', 'accepted_by_mistake', 'other'] as const
type ReleaseReason = (typeof RELEASE_REASONS)[number]
const TIMELINE = [
  { status: 'assigned', labelKey: 'common.timeline.accepted', Icon: Handshake },
  { status: 'on_the_way', labelKey: 'common.timeline.on_the_way', Icon: Car },
  { status: 'arrived', labelKey: 'common.timeline.arrived', Icon: MapPin },
  { status: 'awaiting_confirmation', labelKey: 'common.timeline.awaiting_confirmation', Icon: SealCheck },
  { status: 'completed', labelKey: 'common.timeline.completed', Icon: FlagCheckered }
]
const NEXT_ACTION = {
  assigned: { labelKey: 'volunteerJob.onMyWay', status: 'on_the_way', Icon: Car, variant: 'primary' },
  on_the_way: { labelKey: 'volunteerJob.arrivedButton', status: 'arrived', Icon: MapPin, variant: 'community' },
  arrived: { labelKey: 'volunteerJob.completeButton', status: 'awaiting_confirmation', Icon: CheckCircle, variant: 'community' }
} as const
const COPY = {
  ar: { call: 'اتصال', accepted: 'تم القبول', arrived: 'وصلت', subtitle: 'حدّث حالة المهمة ليعرف صاحب الطلب وين وصلت', waze: 'افتح الموقع على ويز' },
  en: { call: 'Call', accepted: 'Accepted', arrived: 'Arrived', subtitle: 'Update your progress so the requester knows where you are.', waze: 'Open location in Waze' },
  he: { call: 'התקשרות', accepted: 'התקבלה', arrived: 'הגעתי', subtitle: 'עדכנו את מצב המשימה כדי שמבקש העזרה ידע איפה אתם.', waze: 'פתיחת המיקום בווייז' }
}

function useMissionCopy() {
  const { i18n } = useTranslation()
  const language = (i18n.resolvedLanguage ?? i18n.language).split('-')[0]
  return COPY[language as keyof typeof COPY] ?? COPY.ar
}

// Only the active helper presentation is replaced. The existing screen still
// owns requester, completion, cancellation, and other mission states.
export function LiveMissionWebScreen() {
  const { missionId } = useLocalSearchParams<{ missionId: string }>()
  const { session } = useAuth()
  const isHelperView = (mission?: Mission | null) => !!mission && mission.helper_id === session?.user.id && HELPER_STATUSES.includes(mission.status)
  const mission = useQuery({
    queryKey: queryKeys.mission(String(missionId)),
    queryFn: () => missionRepository.get(String(missionId)),
    enabled: !!missionId,
    // The shared screen already polls when it is rendering the other states.
    refetchInterval: query => isHelperView(query.state.data) ? 10_000 : false
  })
  return isHelperView(mission.data) ? <HelperMissionView key={mission.data!.id} mission={mission.data!} /> : <LiveMissionScreen />
}

function useUnreadChatCount(requestId: string | undefined, userId: string | undefined) {
  const queryClient = useQueryClient()
  const [lastReadAt, setLastReadAt] = useState<string | null>(null)
  const messages = useQuery({
    queryKey: requestId ? queryKeys.missionMessages(requestId) : ['messages'],
    queryFn: () => messageRepository.list(requestId!),
    enabled: !!requestId
  })

  useEffect(() => {
    if (!requestId) return
    return messageRepository.subscribe(requestId, message => {
      queryClient.setQueryData<ChatMessage[]>(queryKeys.missionMessages(requestId), current =>
        current?.some(existing => existing.id === message.id) ? current : [...(current ?? []), message]
      )
    })
  }, [requestId, queryClient])

  useFocusEffect(useCallback(() => {
    if (!requestId) { setLastReadAt(null); return }
    let active = true
    getLastReadAt(requestId).then(value => { if (active) setLastReadAt(value) })
    return () => { active = false }
  }, [requestId]))

  if (!requestId || !userId) return 0
  return (messages.data ?? []).filter(message => message.sender_id !== userId && (!lastReadAt || message.created_at > lastReadAt)).length
}

function HelperMissionView({ mission }: { mission: Mission }) {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const { t } = useTranslation()
  const copy = useMissionCopy()
  const router = useRouter()
  const toast = useToast()
  const queryClient = useQueryClient()
  const { session } = useAuth()
  const { height } = useWindowDimensions()
  const other = useQuery({ queryKey: queryKeys.profile(mission.requester_id), queryFn: () => profileRepository.get(mission.requester_id) })
  const unreadCount = useUnreadChatCount(other.data ? mission.request_id : undefined, mission.helper_id ?? undefined)
  const navigationApp = useNavigationApp()
  const [busy, setBusy] = useState(false)
  const [confirmingRelease, setConfirmingRelease] = useState(false)
  const [releaseReason, setReleaseReason] = useState<ReleaseReason | null>(null)
  const [releasing, setReleasing] = useState(false)
  const awaitingConfirmation = mission.status === 'awaiting_confirmation'
  const nextAction = NEXT_ACTION[mission.status as keyof typeof NEXT_ACTION]
  const BackIcon = isRTL ? ArrowRight : ArrowLeft
  const titleStatus = mission.status === 'assigned' ? 'accepted' : mission.status

  async function advance(status: MissionStatus) {
    setBusy(true)
    try {
      await missionRepository.advance(mission.id, status)
      await queryClient.invalidateQueries({ queryKey: queryKeys.mission(mission.id) })
    } catch (cause) { toast.show(translateActionError(t, normalizeAppError(cause)), 'error') } finally { setBusy(false) }
  }

  async function release() {
    setReleasing(true)
    try {
      const { error } = await supabase.rpc('release_help_request', { p_request_id: mission.request_id, p_reason: releaseReason })
      if (error) throw error
      if (session) await queryClient.invalidateQueries({ queryKey: queryKeys.activeMission(session.user.id) })
      router.replace('/(tabs)')
    } catch (cause) { toast.show(translateActionError(t, normalizeAppError(cause)), 'error') } finally { setReleasing(false) }
  }

  return (
    <SafeAreaView style={[styles.fill, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <View style={[styles.mapArea, { height: Math.max(180, Math.min(250, height * 0.27)) }]}>
          <SanadMap latitude={mission.request?.latitude ?? 31.7784} longitude={mission.request?.longitude ?? 35.2066} style={styles.map} />
          <IconButton label={t('common.back')} size={44} style={{ ...styles.backButton, [isRTL ? 'right' : 'left']: space.lg }} icon={<BackIcon size={20} color={theme.colors.textPrimary} />} onPress={() => router.replace('/(tabs)')} />
        </View>

        <View style={styles.body}>
          <Surface elevation="soft" style={styles.statusCard}>
            <Text accessibilityRole="header" style={[typography.h1, styles.centerText, { color: theme.colors.textPrimary }]}>{t(`volunteerJob.status.${titleStatus}`)}</Text>
            <Text style={[typography.small, styles.centerText, { color: theme.colors.textSecondary }]}>{awaitingConfirmation ? t('volunteerJob.awaitingConfirmationText') : copy.subtitle}</Text>
            <HelperTimeline status={mission.status} />
          </Surface>

          {other.data ? (
            <Surface elevation="soft" style={styles.contactCard}>
              <View style={[styles.person, dirStyles(isRTL).row]}>
                <Avatar name={other.data.full_name || 'AKHOO'} uri={other.data.avatar_url} size={48} tone="primary" />
                <View style={styles.personText}>
                  <Text style={[typography.h3, { color: theme.colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{other.data.full_name || t('volunteerJob.defaultRequesterName')}</Text>
                  <Text style={[typography.small, { color: theme.colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{t('volunteerJob.requesterLabel')}</Text>
                </View>
              </View>
              <View style={[styles.contactActions, dirStyles(isRTL).row]}>
                {other.data.phone ? <View style={styles.equalButton}><Button label={copy.call} variant="community" leading={<Phone size={18} color={theme.colors.onCommunity} weight="fill" />} onPress={() => Linking.openURL(telHref(other.data!.phone!))} /></View> : null}
                <View style={styles.equalButton}>
                  <Button label={t('volunteerJob.chatButton')} leading={<ChatCircleDots size={18} color={theme.colors.onPrimary} />} onPress={() => router.push({ pathname: '/mission/[missionId]/chat', params: { missionId: mission.id } })} />
                  {unreadCount > 0 ? (
                    <View style={[styles.unreadBadge, { [isRTL ? 'left' : 'right']: -4, backgroundColor: theme.colors.emergency, borderColor: theme.colors.surface }]}>
                      <Text style={[typography.caption, styles.unreadText]}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </Surface>
          ) : null}

          {nextAction ? (
            <Button
              label={t(nextAction.labelKey)}
              variant={nextAction.variant}
              disabled={releasing}
              loading={busy}
              leading={<nextAction.Icon size={20} color={nextAction.variant === 'primary' ? theme.colors.onPrimary : theme.colors.onCommunity} />}
              onPress={() => advance(nextAction.status)}
            />
          ) : null}
          {!awaitingConfirmation ? <Button
            label={navigationApp === 'waze' ? copy.waze : t('volunteerJob.openInGoogleMaps')}
            variant="outline"
            leading={<NavigationAppIcon app={navigationApp} size={18} />}
            style={{ backgroundColor: theme.colors.surface }}
            onPress={() => Linking.openURL(directionsHref(mission.request?.latitude ?? 0, mission.request?.longitude ?? 0, navigationApp))}
          /> : null}

          {mission.request?.photo_url ? <Image source={{ uri: mission.request.photo_url }} style={styles.photo} resizeMode="contain" /> : null}

          <Text style={[typography.caption, styles.requestNumber, { color: theme.colors.textMuted }]}>{t('volunteerJob.requestId')} · {mission.id.slice(0, 8).toUpperCase()}</Text>

          {!awaitingConfirmation ? confirmingRelease ? (
            <Card tone="emergency" elevation="none">
              <Text style={[typography.bodyMedium, { color: theme.colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{t('volunteerJob.release.confirmTitle')}</Text>
              <Text style={[typography.small, { color: theme.colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{t('volunteerJob.release.confirmMessage')}</Text>
              <View style={[styles.reasonRow, dirStyles(isRTL).row]}>
                {RELEASE_REASONS.map(reason => (
                  <Pressable key={reason} accessibilityRole="button" accessibilityState={{ selected: releaseReason === reason }} disabled={releasing} onPress={() => setReleaseReason(current => current === reason ? null : reason)} style={[styles.reasonChip, { backgroundColor: releaseReason === reason ? theme.colors.emergency : theme.colors.surface, borderColor: releaseReason === reason ? theme.colors.emergency : theme.colors.border }]}>
                    <Text style={[typography.small, { color: releaseReason === reason ? theme.colors.onEmergency : theme.colors.textPrimary }]}>{t(`volunteerJob.release.reasons.${reason}`)}</Text>
                  </Pressable>
                ))}
              </View>
              <View style={[styles.contactActions, dirStyles(isRTL).row]}>
                <Button label={t('volunteerJob.release.back')} variant="outline" style={styles.equalButton} disabled={releasing} onPress={() => { setConfirmingRelease(false); setReleaseReason(null) }} />
                <Button label={t('volunteerJob.release.confirm')} variant="danger" style={styles.equalButton} loading={releasing} disabled={!releaseReason || busy} onPress={release} />
              </View>
            </Card>
          ) : (
            <Pressable accessibilityRole="button" disabled={busy} onPress={() => setConfirmingRelease(true)} style={styles.releaseLink}>
              <Text style={[typography.small, { color: theme.colors.textMuted, textDecorationLine: 'underline', textAlign: 'center' }]}>{t('volunteerJob.release.button')}</Text>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

function HelperTimeline({ status }: { status: MissionStatus }) {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const { t } = useTranslation()
  const copy = useMissionCopy()
  const activeIndex = TIMELINE.findIndex(step => step.status === status)

  return (
    // The document direction mirrors this row on web; row-reverse would undo RTL.
    <View style={styles.timeline}>
      {TIMELINE.map((step, index) => {
        const done = index < activeIndex
        const active = index === activeIndex
        const label = index === 0 ? copy.accepted : index === 2 ? copy.arrived : t(step.labelKey)
        return (
          <View key={step.status} style={styles.step}>
            <View style={styles.nodeRow}>
              <View style={[styles.connector, { backgroundColor: index === 0 ? 'transparent' : done || active ? theme.colors.community : theme.colors.border }]} />
              <View style={[styles.node, { backgroundColor: done ? theme.colors.community : active ? theme.colors.primary : theme.colors.surface, borderColor: done ? theme.colors.community : active ? theme.colors.primary : theme.colors.border }]}>
                {done ? <Check size={18} color={theme.colors.onCommunity} weight="bold" /> : <step.Icon size={18} color={active ? theme.colors.onPrimary : theme.colors.textMuted} />}
              </View>
              <View style={[styles.connector, { backgroundColor: index === TIMELINE.length - 1 ? 'transparent' : done ? theme.colors.community : theme.colors.border }]} />
            </View>
            <Text style={[typography.caption, styles.stepLabel, { color: active ? theme.colors.primary : theme.colors.textMuted }]}>{label}</Text>
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  page: { width: '100%', maxWidth: 620, alignSelf: 'center', paddingBottom: space.xxl },
  mapArea: { position: 'relative', overflow: 'hidden' },
  map: { flex: 1, marginTop: 0, borderRadius: 0, borderWidth: 0 },
  backButton: { position: 'absolute', top: space.lg },
  body: { padding: space.lg, gap: space.md },
  centerText: { textAlign: 'center' },
  statusCard: { borderRadius: 20, gap: space.sm },
  contactCard: { borderRadius: 20, gap: space.lg },
  person: { alignItems: 'center', gap: space.md },
  personText: { flex: 1, gap: 2 },
  contactActions: { gap: space.sm, alignItems: 'stretch' },
  equalButton: { flex: 1, minWidth: 0 },
  unreadBadge: { position: 'absolute', top: -6, minWidth: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  unreadText: { color: '#fff', fontSize: 11, lineHeight: 14 },
  photo: { width: '100%', height: 180, borderRadius: 14 },
  requestNumber: { textAlign: 'center', paddingTop: space.sm },
  releaseLink: { alignItems: 'center', justifyContent: 'center', minHeight: 44 },
  reasonRow: { flexWrap: 'wrap', gap: space.sm, marginVertical: space.md },
  reasonChip: { minHeight: 44, justifyContent: 'center', borderWidth: 1, borderRadius: 14, paddingVertical: space.sm, paddingHorizontal: space.md },
  timeline: { flexDirection: 'row', alignItems: 'flex-start', paddingTop: space.md },
  step: { flex: 1, minWidth: 0, gap: 6 },
  nodeRow: { flexDirection: 'row', alignItems: 'center' },
  node: { width: 38, height: 38, flexShrink: 0, borderRadius: 19, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  connector: { flex: 1, height: 2 },
  stepLabel: { textAlign: 'center', paddingHorizontal: 1 }
})
