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

type ScreenName = 'roles' | 'request' | 'active-request' | 'volunteer' | 'volunteer-job'

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
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
    supabase.from('profiles').select('id,full_name,phone').eq('id', session.user.id).single().then(({ data }) => {
      if (data) setProfile(data as Profile)
    })
  }, [session?.user.id])

  if (loading) {
    return <View style={styles.loading}><ActivityIndicator size="large" color={colors.blue} /></View>
  }

  if (!session) return <AuthScreen />

  if (screen === 'request') {
    return <RequestHelpScreen userId={session.user.id} onBack={() => setScreen('roles')} onCreated={request => { setActiveRequest(request); setScreen('active-request') }} />
  }

  if (screen === 'active-request' && activeRequest) {
    return <ActiveRequestScreen initialRequest={activeRequest} onDone={() => { setActiveRequest(null); setScreen('roles') }} />
  }

  if (screen === 'volunteer') {
    return <VolunteerScreen userId={session.user.id} onBack={() => setScreen('roles')} onAccepted={request => { setActiveRequest(request); setScreen('volunteer-job') }} />
  }

  if (screen === 'volunteer-job' && activeRequest) {
    return <VolunteerJobScreen request={activeRequest} onDone={() => { setActiveRequest(null); setScreen('roles') }} />
  }

  return <RoleScreen name={profile?.full_name ?? ''} onRequester={() => setScreen('request')} onVolunteer={() => setScreen('volunteer')} />
}

const styles = StyleSheet.create({ loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg } })
