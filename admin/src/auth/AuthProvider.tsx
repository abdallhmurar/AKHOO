import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useIsAdminQuery } from './useIsAdminQuery'
import { AuthContext } from './AuthContext'
import type { AuthState } from './AuthContext'
import { useQueryClient } from '@tanstack/react-query'

export function AuthProvider({ children }: { children: ReactNode }) {
  // undefined = initial getSession() still in flight, null = confirmed logged out
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const queryClient = useQueryClient()

  useEffect(() => {
    let active = true
    let authEventReceived = false
    let currentUser: string | null = null
    const applySession = (next: Session | null) => {
      if (!active) return
      if (currentUser !== (next?.user.id ?? null)) {
        queryClient.clear()
        currentUser = next?.user.id ?? null
      }
      setSession(next)
    }
    supabase.auth.getSession().then(({ data }) => {
      if (!authEventReceived) applySession(data.session)
    }).catch(() => { if (!authEventReceived) applySession(null) })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      authEventReceived = true
      applySession(nextSession)
    })
    return () => { active = false; listener.subscription.unsubscribe() }
  }, [queryClient])

  const isAdminQuery = useIsAdminQuery(session?.user.id ?? null)

  function signOut() {
    queryClient.clear()
    setSession(null)
    void supabase.auth.signOut({ scope: 'local' })
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
