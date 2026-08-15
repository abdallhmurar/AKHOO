import { useEffect, useState } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './src/lib/supabase'
import { colors } from './src/lib/theme'
import type { HelpRequest, Profile } from './src/types'
import { AuthScreen } from './src/screens/AuthScreen'
import { RoleScreen } from './src/screens/RoleScreen'
import { RequestHelpScreen } from './src/screens/RequestHelpScreen'
import { ActiveRequestScreen } from './src/screens/ActiveRequestScreen'
import { VolunteerScreen } from './src/screens/VolunteerScreen'
import { VolunteerJobScreen } from './src/screens/VolunteerJobScreen'
import { AdminScreen } from './src/screens/AdminScreen'
import { HistoryScreen } from './src/screens/HistoryScreen'

type ScreenName = 'roles' | 'request' | 'active-request' | 'volunteer' | 'volunteer-job' | 'admin' | 'history'

const ACTIVE_STATUSES = ['open', 'accepted', 'on_the_way', 'arrived']

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [recovering, setRecovering] = useState(true)
  const [screen, setScreen] = useState<ScreenName>('roles')
  const [activeRequest, setActiveRequest] = useState<HelpRequest | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession)
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        setScreen('roles')
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
    supabase.from('profiles').select('id,full_name,phone,is_admin,is_banned').eq('id', session.user.id).single().then(({ data }) => {
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

  if (loading || recovering) {
    return <View style={styles.loading}><ActivityIndicator size="large" color={colors.blue} /></View>
  }

  if (!session) return <AuthScreen />

  if (screen === 'request') {
    return <RequestHelpScreen userId={session.user.id} onBack={() => setScreen('roles')} onCreated={request => { setActiveRequest(request); setScreen('active-request') }} />
  }

  if (screen === 'active-request' && activeRequest) {
    return <ActiveRequestScreen initialRequest={activeRequest} onBack={() => setScreen('roles')} onDone={() => { setActiveRequest(null); setScreen('roles') }} />
  }

  if (screen === 'volunteer') {
    return <VolunteerScreen userId={session.user.id} onBack={() => setScreen('roles')} onAccepted={request => { setActiveRequest(request); setScreen('volunteer-job') }} />
  }

  if (screen === 'volunteer-job' && activeRequest) {
    return <VolunteerJobScreen request={activeRequest} onBack={() => setScreen('roles')} onDone={() => { setActiveRequest(null); setScreen('roles') }} />
  }

  if (screen === 'admin') {
    return <AdminScreen onBack={() => setScreen('roles')} />
  }

  if (screen === 'history') {
    return (
      <HistoryScreen
        userId={session.user.id}
        onBack={() => setScreen('roles')}
        onOpen={request => {
          setActiveRequest(request)
          setScreen(request.volunteer_id === session.user.id && request.requester_id !== session.user.id ? 'volunteer-job' : 'active-request')
        }}
      />
    )
  }

  return (
    <RoleScreen
      name={profile?.full_name ?? ''}
      isAdmin={profile?.is_admin ?? false}
      onRequester={() => setScreen('request')}
      onVolunteer={() => setScreen('volunteer')}
      onAdmin={() => setScreen('admin')}
      onHistory={() => setScreen('history')}
    />
  )
}

const styles = StyleSheet.create({ loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg } })
