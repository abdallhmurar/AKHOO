import { useEffect, useRef, useState } from 'react'
import { Image, StyleSheet, Text, View, useWindowDimensions } from 'react-native'
import { useRouter } from 'expo-router'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowClockwise, Check, Crosshair, UserFocus } from 'phosphor-react-native'
import { useTranslation } from 'react-i18next'
import { AppScreen, ScreenHeader } from '../../components/v2'
import { Button, Card, IconButton, useToast } from '../../components/ui'
import { SanadMap } from '../../components/SanadMap.web'
import type { SanadMapRef } from '../../components/SanadMap.types'
import { dirStyles, useIsRTL } from '../../lib/direction'
import { translateActionError } from '../../lib/rpcErrors'
import { radius, shadow, space, useSanadTheme } from '../../lib/theme'
import { formatElapsed } from '../../lib/time'
import { useAppTypography } from '../../lib/typography'
import type { Mission } from '../../repositories/domainTypes'
import { missionRepository } from '../../repositories/missionRepository'
import { normalizeAppError } from '../../services/errors'
import { queryKeys } from '../../services/queryKeys'
import { LiveMissionScreen } from './MissionScreens'
import { RequesterTrackingScreen, REQUESTER_TRACKING_STATUSES } from './RequesterTrackingScreen.web'

const COPY = {
  ar: { subtitle: 'تم إرسال طلبك، وعم نبحث عن مساعد قريب', notice: 'رح يوصلك إشعار أول ما ينقبل طلبك', sent: 'تم الإرسال', searching: 'البحث عن مساعد', accepted: 'قبول الطلب', waiting: 'بانتظار القبول', recenter: 'إعادة توسيط الخريطة' },
  en: { subtitle: 'Your request is sent. We’re looking for a nearby helper.', notice: 'We’ll notify you when someone accepts your request.', sent: 'Request sent', searching: 'Finding a helper', accepted: 'Accepted', waiting: 'Waiting for acceptance', recenter: 'Recenter map' },
  he: { subtitle: 'הבקשה נשלחה, ואנחנו מחפשים עזרה בקרבתכם', notice: 'נשלח הודעה ברגע שמישהו יקבל את הבקשה', sent: 'הבקשה נשלחה', searching: 'חיפוש עזרה', accepted: 'קבלת הבקשה', waiting: 'בהמתנה לקבלת הבקשה', recenter: 'מרכוז המפה מחדש' }
} as const

// Stay mounted across requester states so a helper release still shows the
// existing notice. Tracking and finished states keep their own presentations.
export function RequesterMissionWebScreen({ mission }: { mission: Mission }) {
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
  const previous = useRef(mission)
  const [justReleased, setJustReleased] = useState(false)
  const [now, setNow] = useState(Date.now())
  const [confirmingCancel, setConfirmingCancel] = useState(false)
  const [busy, setBusy] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const searching = mission.status === 'matching'
  const latitude = mission.request?.latitude ?? 31.7784
  const longitude = mission.request?.longitude ?? 35.2066

  useEffect(() => {
    if (previous.current.helper_id && !mission.helper_id && searching && previous.current.status !== 'matching') setJustReleased(true)
    previous.current = mission
    if (!searching) setConfirmingCancel(false)
  }, [mission, searching])

  useEffect(() => {
    if (!searching) return
    setNow(Date.now())
    const timer = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(timer)
  }, [searching])

  async function refresh() {
    setRefreshing(true)
    try {
      await queryClient.invalidateQueries({ queryKey: queryKeys.mission(mission.id) }, { throwOnError: true })
    } catch (cause) { toast.show(translateActionError(t, normalizeAppError(cause)), 'error') } finally { setRefreshing(false) }
  }

  async function cancel() {
    if (!searching || busy) return
    setBusy(true)
    try {
      await missionRepository.cancel(mission.id)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.mission(mission.id) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.activeMission(mission.requester_id) })
      ])
    } catch (cause) { toast.show(translateActionError(t, normalizeAppError(cause)), 'error') } finally {
      setBusy(false)
      setConfirmingCancel(false)
    }
  }

  if (REQUESTER_TRACKING_STATUSES.includes(mission.status)) return <RequesterTrackingScreen mission={mission} />
  if (!searching) return <LiveMissionScreen />

  return (
    <AppScreen
      header={<ScreenHeader title="" back onBack={() => router.replace('/(tabs)')} />}
      contentStyle={compact ? styles.compactContent : styles.content}
      footer={
        <View style={[styles.footer, dirStyles(isRTL).row]}>
          {confirmingCancel ? <>
            <View style={styles.action}><Button label={t('activeRequest.cancelBack')} variant="outline" disabled={busy} onPress={() => setConfirmingCancel(false)} style={styles.footerButton} /></View>
            <View style={styles.action}><Button label={t('activeRequest.cancelConfirm')} variant="danger" loading={busy} onPress={cancel} style={styles.footerButton} /></View>
          </> : <>
            <View style={styles.action}><Button label={t('activeRequest.updateStatus')} variant="ghost" leading={<ArrowClockwise size={18} color={theme.colors.primary} />} loading={refreshing} onPress={refresh} style={{ ...styles.footerButton, backgroundColor: theme.colors.primarySoft }} /></View>
            <View style={styles.action}><Button label={t('activeRequest.cancel')} variant="secondary" disabled={refreshing} onPress={() => setConfirmingCancel(true)} style={{ ...styles.footerButton, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.borderStrong }} /></View>
          </>}
        </View>
      }
    >
      <View style={styles.heading}>
        <Text accessibilityRole="header" style={[typography.h1, styles.center, { color: theme.colors.textPrimary }]}>{t('activeRequest.title')}</Text>
        <Text style={[typography.body, styles.center, { color: theme.colors.textSecondary }]}>{copy.subtitle}</Text>
      </View>

      <View style={[styles.mapFrame, { borderColor: theme.colors.border }]}>
        <SanadMap ref={mapRef} latitude={latitude} longitude={longitude} height={compact ? 155 : 195} zoom={13} style={styles.map} />
        <IconButton label={copy.recenter} icon={<Crosshair size={20} color={theme.colors.primary} />} onPress={() => mapRef.current?.recenter(latitude, longitude, 13)} style={{ ...styles.mapControl, [isRTL ? 'left' : 'right']: space.md }} />
      </View>

      {justReleased ? <Card tone="default" elevation="none" title={t('activeRequest.releasedNotice.title')} subtitle={t('activeRequest.releasedNotice.message')} /> : null}

      <View style={[styles.statusCard, compact && styles.compactCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <View accessible={false} style={[styles.halo, compact && styles.compactHalo, { backgroundColor: theme.colors.primarySoft }]}>
          <View style={[styles.searchIcon, { backgroundColor: theme.colors.primary }]}><UserFocus size={26} color={theme.colors.onPrimary} weight="fill" /></View>
        </View>
        <View style={styles.statusCopy}>
          <Text accessibilityRole="header" style={[typography.h3, styles.center, { color: theme.colors.textPrimary }]}>{t('activeRequest.searchingCard.title')}</Text>
          <Text style={[typography.small, styles.center, { color: theme.colors.textSecondary }]}>{copy.notice}</Text>
        </View>
        <View style={[styles.timeline, dirStyles(isRTL).row]}>
          {[copy.sent, copy.searching, copy.accepted].map((label, index) => (
            <View key={label} style={styles.step}>
              <View style={[styles.nodeRow, dirStyles(isRTL).row]}>
                <View style={[styles.connector, { backgroundColor: index === 0 ? 'transparent' : index === 1 ? theme.colors.primary : theme.colors.border }]} />
                <View style={[styles.node, { borderColor: index === 0 ? theme.colors.community : index === 1 ? theme.colors.primary : theme.colors.border, backgroundColor: index === 0 ? theme.colors.community : index === 1 ? theme.colors.primary : theme.colors.surface }]}>
                  {index === 0 ? <Check size={18} color={theme.colors.onCommunity} weight="bold" /> : index === 1 ? <UserFocus size={18} color={theme.colors.onPrimary} weight="fill" /> : null}
                </View>
                <View style={[styles.connector, { backgroundColor: index === 2 ? 'transparent' : index === 0 ? theme.colors.primary : theme.colors.border }]} />
              </View>
              <Text style={[typography.caption, styles.center, { color: index === 1 ? theme.colors.primary : theme.colors.textSecondary }]}>{label}</Text>
            </View>
          ))}
        </View>
        <Text style={[typography.caption, styles.center, { color: theme.colors.textMuted }]}>{copy.waiting} · {formatElapsed(Math.max(0, now - new Date(mission.created_at).getTime()), t)}</Text>
      </View>

      {mission.request?.photo_url ? <Image source={{ uri: mission.request.photo_url }} style={styles.photo} resizeMode="contain" /> : null}
    </AppScreen>
  )
}

const styles = StyleSheet.create({
  content: { gap: space.lg },
  compactContent: { gap: space.md },
  heading: { gap: space.sm },
  center: { textAlign: 'center' },
  footer: { width: '100%', maxWidth: 520, alignSelf: 'center', gap: space.md },
  action: { flex: 1, minWidth: 0 },
  footerButton: { flex: 1, paddingHorizontal: space.sm },
  mapFrame: { borderWidth: 1, borderRadius: radius.xl, overflow: 'hidden', ...shadow.soft },
  map: { marginTop: 0, borderWidth: 0, borderRadius: 0 },
  mapControl: { position: 'absolute', top: space.md },
  statusCard: { alignItems: 'center', gap: space.md, padding: space.lg, borderWidth: 1, borderRadius: radius.xl, ...shadow.soft },
  compactCard: { gap: space.sm, padding: space.md },
  halo: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  compactHalo: { width: 56, height: 56, borderRadius: 28 },
  searchIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  statusCopy: { gap: 6, alignSelf: 'stretch' },
  timeline: { alignSelf: 'stretch', alignItems: 'flex-start', paddingTop: space.xs },
  step: { flex: 1, minWidth: 0, gap: 6 },
  nodeRow: { alignItems: 'center' },
  node: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  connector: { flex: 1, height: 2 },
  photo: { width: '100%', height: 180, borderRadius: radius.md }
})
