import { useCallback, useEffect, useRef, useState } from 'react'
import { ActivityIndicator, AppState, StyleSheet, Text, View } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import * as Linking from 'expo-linking'
import { useFonts, Tajawal_400Regular, Tajawal_500Medium, Tajawal_700Bold, Tajawal_800ExtraBold } from '@expo-google-fonts/tajawal'
import { I18nextProvider, useTranslation } from 'react-i18next'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './src/lib/supabase'
import { colors, font, radius, space } from './src/lib/theme'
import { i18next, initI18n } from './src/lib/i18n'
import { isRealAuthTransition, recoverActiveMission as recoverActiveMissionCore } from './src/lib/sessionRecovery'
import type { HelpRequest, Profile } from './src/types'
import { AuthScreen } from './src/screens/AuthScreen'
import { RoleScreen } from './src/screens/RoleScreen'
import { PerksScreen } from './src/screens/PerksScreen'
import { RequestHelpScreen } from './src/screens/RequestHelpScreen'
import { ActiveRequestScreen } from './src/screens/ActiveRequestScreen'
import { VolunteerScreen } from './src/screens/VolunteerScreen'
import { VolunteerJobScreen } from './src/screens/VolunteerJobScreen'
import { AdminScreen } from './src/screens/AdminScreen'
import { HistoryScreen } from './src/screens/HistoryScreen'
import { ResetPasswordScreen } from './src/screens/ResetPasswordScreen'
import { AccountScreen } from './src/screens/AccountScreen'
import { TabBar } from './src/components/TabBar'
import type { MainTab } from './src/components/TabBar'
import { AuthScreenLayout } from './src/components/AuthScreenLayout'
import { AuthPrimaryButton } from './src/components/AuthPrimaryButton'
import { PrimaryButton } from './src/components/PrimaryButton'
import { Skeleton } from './src/components/Skeleton'
import { Surface } from './src/components/Surface'

type ScreenName = 'main' | 'request' | 'active-request' | 'volunteer' | 'volunteer-job' | 'admin'

const ACTIVE_STATUSES = ['open', 'accepted', 'on_the_way', 'arrived', 'awaiting_confirmation']

function parseHashParams(url: string): Record<string, string> {
  const hashIndex = url.indexOf('#')
  if (hashIndex === -1) return {}
  const params: Record<string, string> = {}
  for (const pair of url.slice(hashIndex + 1).split('&')) {
    const [key, value] = pair.split('=')
    if (key) params[decodeURIComponent(key)] = decodeURIComponent(value ?? '')
  }
  return params
}

export default function App() {
  const [fontsLoaded] = useFonts({ Tajawal_400Regular, Tajawal_500Medium, Tajawal_700Bold, Tajawal_800ExtraBold })
  const [i18nReady, setI18nReady] = useState(false)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [recovering, setRecovering] = useState(true)
  const [screen, setScreen] = useState<ScreenName>('main')
  const [mainTab, setMainTab] = useState<MainTab>('home')
  const [activeRequest, setActiveRequest] = useState<HelpRequest | null>(null)
  const [passwordRecovery, setPasswordRecovery] = useState(false)
  const [recoveryError, setRecoveryError] = useState(false)
  const [urlHandled, setUrlHandled] = useState(false)
  const [profileError, setProfileError] = useState(false)
  const [profileRetryTick, setProfileRetryTick] = useState(0)

  useEffect(() => {
    initI18n().then(() => setI18nReady(true))
  }, [])

  useEffect(() => {
    async function handleUrl(url: string | null) {
      if (!url) return
      const params = parseHashParams(url)
      // Supabase appends #error=access_denied&error_code=otp_expired&... for
      // an expired/already-used reset link - no type/tokens present at all,
      // so this has to be checked before the recovery branch below.
      if (params.error || params.error_code) {
        setRecoveryError(true)
        return
      }
      if (params.type === 'recovery' && params.access_token && params.refresh_token) {
        const { error } = await supabase.auth.setSession({ access_token: params.access_token, refresh_token: params.refresh_token })
        if (error) {
          setRecoveryError(true)
          return
        }
        setPasswordRecovery(true)
      }
    }
    Linking.getInitialURL()
      .then(handleUrl)
      .finally(() => setUrlHandled(true))
    const subscription = Linking.addEventListener('url', ({ url }) => handleUrl(url))
    return () => subscription.remove()
  }, [])

  // Tracks the last known signed-in user id outside React state, purely to
  // tell a REAL sign-in/out transition apart from Supabase re-emitting
  // 'SIGNED_IN' for the SAME already-logged-in user - confirmed on a real
  // Android device this happens on session restoration after the app is
  // backgrounded long enough for the JS engine to be torn down and
  // recreated (or a token refresh presenting as 'SIGNED_IN'). Resetting
  // screen/activeRequest on every 'SIGNED_IN' by name was wiping out an
  // already-recovered ActiveRequestScreen/VolunteerJobScreen and dropping
  // the user back on Home despite a real active mission still existing.
  const lastUserIdRef = useRef<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      lastUserIdRef.current = data.session?.user.id ?? null
      setSession(data.session)
      setLoading(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      const nextUserId = nextSession?.user.id ?? null
      const realTransition = isRealAuthTransition(event, nextUserId, lastUserIdRef.current)
      lastUserIdRef.current = nextUserId
      setSession(nextSession)
      if (realTransition) {
        setScreen('main')
        setMainTab('home')
        setActiveRequest(null)
      }
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session?.user.id) {
      setProfile(null)
      setProfileError(false)
      return
    }
    setProfileError(false)
    supabase.from('profiles').select('id,full_name,phone,avatar_url,is_admin,is_banned,created_at').eq('id', session.user.id).single().then(({ data, error }) => {
      if (data) setProfile(data as Profile)
      else if (error) setProfileError(true)
    })
  }, [session?.user.id, profileRetryTick])

  // Shared by both recovery effects below - sets screen/activeRequest if a
  // real non-terminal mission is found. isStale lets each caller (cold-start
  // effect, AppState listener below) supply its own cancellation check, so a
  // slow query resolving after the session changed or the effect was
  // cleaned up never applies its result. The stale-guard orchestration
  // itself lives in sessionRecovery.ts so it's unit-testable independent of
  // Supabase/React state.
  const recoverActiveMission = useCallback(async (uid: string, isStale: () => boolean) => {
    await recoverActiveMissionCore({
      fetchAsRequester: async () => {
        const { data } = await supabase
          .from('help_requests')
          .select('*')
          .eq('requester_id', uid)
          .in('status', ACTIVE_STATUSES)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        return data
      },
      fetchAsVolunteer: async () => {
        const { data } = await supabase
          .from('help_requests')
          .select('*')
          .eq('volunteer_id', uid)
          .in('status', ACTIVE_STATUSES)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        return data
      },
      isStale,
      onFound: (target, mission) => {
        setActiveRequest(mission as HelpRequest)
        setScreen(target)
      }
    })
  }, [])

  // Recover an in-progress request/job after a reload or fresh app open, so
  // it doesn't just vanish - screen/activeRequest only ever lived in memory.
  // Gates the splash via `recovering` - this is the cold-start path only.
  useEffect(() => {
    const uid = session?.user.id
    if (!uid) {
      setRecovering(false)
      return
    }
    let cancelled = false
    setRecovering(true)
    recoverActiveMission(uid, () => cancelled).finally(() => {
      if (!cancelled) setRecovering(false)
    })
    return () => { cancelled = true }
  }, [session?.user.id, recoverActiveMission])

  // Safety net for returning from background, without the blocking splash:
  // confirmed on a real device that a user with a genuinely active mission
  // could land on 'main' after backgrounding/foregrounding (see the
  // onAuthStateChange fix above for the primary cause). Only acts when
  // we're actually sitting on 'main' with no activeRequest already tracked,
  // so this can never interrupt an in-progress request/volunteer flow or
  // fight manual navigation elsewhere in the app.
  useEffect(() => {
    const uid = session?.user.id
    if (!uid) return
    let cancelled = false
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active' && screen === 'main' && !activeRequest) {
        recoverActiveMission(uid, () => cancelled)
      }
    })
    return () => {
      cancelled = true
      subscription.remove()
    }
  }, [session?.user.id, screen, activeRequest, recoverActiveMission])

  if (!fontsLoaded || !i18nReady || loading || recovering || !urlHandled) {
    return (
      <GestureHandlerRootView style={styles.flexFill}>
        <View style={styles.loading}>
          <View style={styles.splashMark}><Text style={styles.splashMarkText}>س</Text></View>
          {fontsLoaded ? <Text style={styles.splashWord}>سَنَد</Text> : null}
          <ActivityIndicator size="small" color={colors.forest} style={styles.splashSpinner} />
        </View>
      </GestureHandlerRootView>
    )
  }

  function renderScreen() {
    if (recoveryError) {
      return <RecoveryLinkExpired onBack={() => setRecoveryError(false)} />
    }

    if (passwordRecovery) {
      return <ResetPasswordScreen onCancel={() => setPasswordRecovery(false)} onDone={() => setPasswordRecovery(false)} />
    }

    if (!session) return <AuthScreen />

    if (screen === 'request') {
      return <RequestHelpScreen userId={session.user.id} onBack={() => setScreen('main')} onCreated={request => { setActiveRequest(request); setScreen('active-request') }} />
    }

    if (screen === 'active-request' && activeRequest) {
      return <ActiveRequestScreen initialRequest={activeRequest} onBack={() => setScreen('main')} onDone={() => { setActiveRequest(null); setScreen('main') }} />
    }

    if (screen === 'volunteer') {
      return <VolunteerScreen userId={session.user.id} onBack={() => setScreen('main')} onAccepted={request => { setActiveRequest(request); setScreen('volunteer-job') }} />
    }

    if (screen === 'volunteer-job' && activeRequest) {
      return <VolunteerJobScreen request={activeRequest} onBack={() => setScreen('main')} onDone={() => { setActiveRequest(null); setScreen('main') }} />
    }

    if (screen === 'admin') {
      return <AdminScreen onBack={() => setScreen('main')} />
    }

    const activeKind: 'request' | 'job' | null = !activeRequest
      ? null
      : activeRequest.requester_id === session.user.id
        ? 'request'
        : 'job'

    return (
      <View style={styles.mainWrap}>
        <View style={styles.tabContent}>
          {mainTab === 'home' ? (
            <RoleScreen
              name={profile?.full_name ?? ''}
              avatarUrl={profile?.avatar_url ?? null}
              isAdmin={profile?.is_admin ?? false}
              activeKind={activeKind}
              onRequester={() => setScreen('request')}
              onVolunteer={() => setScreen('volunteer')}
              onAdmin={() => setScreen('admin')}
              onResumeActive={() => setScreen(activeKind === 'request' ? 'active-request' : 'volunteer-job')}
              onDiscoverPerks={() => setMainTab('perks')}
            />
          ) : mainTab === 'perks' ? (
            <PerksScreen userId={session.user.id} />
          ) : mainTab === 'activity' ? (
            <HistoryScreen
              userId={session.user.id}
              onBack={() => setMainTab('home')}
              onOpen={request => {
                setActiveRequest(request)
                setScreen(request.volunteer_id === session.user.id && request.requester_id !== session.user.id ? 'volunteer-job' : 'active-request')
              }}
            />
          ) : profile ? (
            <AccountScreen
              profile={profile}
              email={session.user.email ?? ''}
              onBack={() => setMainTab('home')}
              onUpdated={setProfile}
              onViewActivity={() => setMainTab('activity')}
            />
          ) : profileError ? (
            <ProfileLoadError onRetry={() => { setProfileError(false); setProfileRetryTick(tick => tick + 1) }} />
          ) : (
            <AccountSkeleton />
          )}
        </View>
        <TabBar active={mainTab} onChange={setMainTab} />
      </View>
    )
  }

  return (
    <GestureHandlerRootView style={styles.flexFill}>
      <BottomSheetModalProvider>
        <I18nextProvider i18n={i18next}>{renderScreen()}</I18nextProvider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  )
}

function RecoveryLinkExpired({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation()
  return (
    <AuthScreenLayout title={t('auth.reset.linkExpired.title')} subtitle={t('auth.reset.linkExpired.message')}>
      <AuthPrimaryButton title={t('auth.reset.linkExpired.backToLogin')} onPress={onBack} />
    </AuthScreenLayout>
  )
}

function AccountSkeleton() {
  return (
    <View style={styles.tabLoading}>
      <Skeleton width={88} height={88} radius={44} />
      <Skeleton width={140} height={18} style={styles.skeletonGap} />
      <Skeleton width={180} height={13} />
      <Surface elevation="soft" padding="lg" style={styles.skeletonCard}>
        <Skeleton width="100%" height={44} radius={radius.md} />
        <Skeleton width="100%" height={44} radius={radius.md} style={styles.skeletonGap} />
      </Surface>
    </View>
  )
}

function ProfileLoadError({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation()
  return (
    <View style={styles.tabLoading}>
      <Text style={styles.profileErrorText}>{t('account.errors.loadFailed')}</Text>
      <PrimaryButton title={t('common.retry')} onPress={onRetry} />
    </View>
  )
}

const styles = StyleSheet.create({
  flexFill: { flex: 1 },
  mainWrap: { flex: 1, backgroundColor: colors.bg },
  tabContent: { flex: 1 },
  tabLoading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 32 },
  skeletonGap: { marginTop: space.sm },
  skeletonCard: { width: '100%', gap: space.sm, marginTop: space.lg },
  profileErrorText: { color: colors.text, fontSize: 14, fontFamily: font.medium, textAlign: 'center' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  splashMark: { width: 72, height: 72, borderRadius: 24, backgroundColor: colors.forest, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  splashMarkText: { color: '#fff', fontSize: 34, fontFamily: font.extraBold },
  splashWord: { color: colors.text, fontSize: 20, fontFamily: font.bold, marginBottom: 22 },
  splashSpinner: { marginTop: 4 }
})
