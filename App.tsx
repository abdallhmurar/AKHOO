import { useEffect, useState } from 'react'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import * as Linking from 'expo-linking'
import { useFonts, Tajawal_400Regular, Tajawal_500Medium, Tajawal_700Bold, Tajawal_800ExtraBold } from '@expo-google-fonts/tajawal'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './src/lib/supabase'
import { colors, font } from './src/lib/theme'
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

type ScreenName = 'main' | 'request' | 'active-request' | 'volunteer' | 'volunteer-job' | 'admin'

const ACTIVE_STATUSES = ['open', 'accepted', 'on_the_way', 'arrived']

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
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [recovering, setRecovering] = useState(true)
  const [screen, setScreen] = useState<ScreenName>('main')
  const [mainTab, setMainTab] = useState<MainTab>('home')
  const [activeRequest, setActiveRequest] = useState<HelpRequest | null>(null)
  const [passwordRecovery, setPasswordRecovery] = useState(false)

  useEffect(() => {
    async function handleUrl(url: string | null) {
      if (!url) return
      const params = parseHashParams(url)
      if (params.type === 'recovery' && params.access_token && params.refresh_token) {
        setPasswordRecovery(true)
        await supabase.auth.setSession({ access_token: params.access_token, refresh_token: params.refresh_token })
      }
    }
    Linking.getInitialURL().then(handleUrl)
    const subscription = Linking.addEventListener('url', ({ url }) => handleUrl(url))
    return () => subscription.remove()
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession)
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
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
      return
    }
    supabase.from('profiles').select('id,full_name,phone,avatar_url,is_admin,is_banned').eq('id', session.user.id).single().then(({ data }) => {
      if (data) setProfile(data as Profile)
    })
  }, [session?.user.id])

  // Recover an in-progress request/job after a reload or fresh app open, so
  // it doesn't just vanish - screen/activeRequest only ever lived in memory.
  useEffect(() => {
    const uid = session?.user.id
    if (!uid) {
      setRecovering(false)
      return
    }
    setRecovering(true)
    ;(async () => {
      const { data: asRequester } = await supabase
        .from('help_requests')
        .select('*')
        .eq('requester_id', uid)
        .in('status', ACTIVE_STATUSES)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (asRequester) {
        setActiveRequest(asRequester as HelpRequest)
        setScreen('active-request')
        setRecovering(false)
        return
      }

      const { data: asVolunteer } = await supabase
        .from('help_requests')
        .select('*')
        .eq('volunteer_id', uid)
        .in('status', ACTIVE_STATUSES)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (asVolunteer) {
        setActiveRequest(asVolunteer as HelpRequest)
        setScreen('volunteer-job')
      }
      setRecovering(false)
    })()
  }, [session?.user.id])

  if (!fontsLoaded || loading || recovering) {
    return (
      <View style={styles.loading}>
        <View style={styles.splashMark}><Text style={styles.splashMarkText}>س</Text></View>
        {fontsLoaded ? <Text style={styles.splashWord}>سَنَد</Text> : null}
        <ActivityIndicator size="small" color={colors.forest} style={styles.splashSpinner} />
      </View>
    )
  }

  if (passwordRecovery) {
    return <ResetPasswordScreen onDone={() => setPasswordRecovery(false)} />
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
          />
        ) : (
          <View style={styles.tabLoading}><ActivityIndicator color={colors.forest} /></View>
        )}
      </View>
      <TabBar active={mainTab} onChange={setMainTab} />
    </View>
  )
}

const styles = StyleSheet.create({
  mainWrap: { flex: 1, backgroundColor: colors.bg },
  tabContent: { flex: 1 },
  tabLoading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  splashMark: { width: 72, height: 72, borderRadius: 24, backgroundColor: colors.forest, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  splashMarkText: { color: '#fff', fontSize: 34, fontFamily: font.extraBold },
  splashWord: { color: colors.text, fontSize: 20, fontFamily: font.bold, marginBottom: 22 },
  splashSpinner: { marginTop: 4 }
})
