import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useIsAdminQuery } from './useIsAdminQuery'
import { AuthContext } from './AuthContext'
import type { AuthState } from './AuthContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  // undefined = initial getSession() still in flight, null = confirmed logged out
  const [session, setSession] = useState<Session | null | undefined>(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  const isAdminQuery = useIsAdminQuery(!!session)

  function signOut() {
    supabase.auth.signOut()
  }

  let state: AuthState
  if (session === undefined) {
    state = { status: 'loading' }
  } else if (session === null) {
    state = { status: 'logged_out' }
  } else if (isAdminQuery.isPending) {
    state = { status: 'checking_admin' }
  } else if (isAdminQuery.isError) {
    state = { status: 'network_error', retry: () => isAdminQuery.refetch() }
  } else if (isAdminQuery.data) {
    state = { status: 'admin', session }
  } else {
    state = { status: 'non_admin', session }
  }

  return <AuthContext.Provider value={{ state, signOut }}>{children}</AuthContext.Provider>
}
