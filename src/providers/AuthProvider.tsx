import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { PropsWithChildren } from 'react'
import type { Session } from '@supabase/supabase-js'
import { authRepository, type SignUpInput } from '../repositories/authRepository'
import { profileRepository } from '../repositories/profileRepository'
import { consumeAuthLink, signOutSafely } from '../services/authService'
import { normalizeAppError, type AppError } from '../services/errors'
import type { Profile } from '../types'
import * as Linking from 'expo-linking'

type AuthStatus = 'restoring' | 'signed-out' | 'signed-in' | 'session-expired' | 'restricted'

type AuthContextValue = {
  session: Session | null
  profile: Profile | null
  status: AuthStatus
  loading: boolean
  error: AppError | null
  isRestricted: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (input: SignUpInput) => ReturnType<typeof authRepository.signUp>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  clearSessionState: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [status, setStatus] = useState<AuthStatus>('restoring')
  const [error, setError] = useState<AppError | null>(null)
  const mounted = useRef(true)
  const manualSignOut = useRef(false)
  const previousUser = useRef<string | null>(null)

  const loadProfile = useCallback(async (userId: string) => {
    try {
      const next = await profileRepository.get(userId)
      if (!mounted.current) return
      setProfile(next)
      setStatus(next?.is_banned ? 'restricted' : 'signed-in')
      setError(null)
    } catch (cause) {
      if (!mounted.current) return
      setError(normalizeAppError(cause, { domain: 'auth', operation: 'load-profile' }))
      setStatus('signed-in')
    }
  }, [])

  useEffect(() => {
    mounted.current = true
    let authLinksActive = true
    const restore = async () => {
      try {
        const initialUrl = await Linking.getInitialURL()
        if (initialUrl) await consumeAuthLink(initialUrl)
        const restored = await authRepository.getSession()
        if (!mounted.current) return
        previousUser.current = restored?.user.id ?? null
        setSession(restored)
        if (restored) await loadProfile(restored.user.id)
        else setStatus('signed-out')
      } catch (cause) {
        if (!mounted.current) return
        setError(normalizeAppError(cause, { domain: 'auth', operation: 'restore' }))
        setStatus('signed-out')
      }
    }
    void restore()
    const unsubscribeAuth = authRepository.subscribe((event, next) => {
      if (!mounted.current) return
      const hadUser = previousUser.current
      const nextUser = next?.user.id ?? null
      previousUser.current = nextUser
      setSession(next)
      if (nextUser) {
        void loadProfile(nextUser)
      } else {
        setProfile(null)
        const unexpected = hadUser && event === 'SIGNED_OUT' && !manualSignOut.current
        setStatus(unexpected ? 'session-expired' : 'signed-out')
        manualSignOut.current = false
      }
    })
    const linkSubscription = Linking.addEventListener('url', ({ url }) => {
      if (!authLinksActive) return
      consumeAuthLink(url).catch(cause => setError(normalizeAppError(cause, { domain: 'auth', operation: 'deep-link' })))
    })
    return () => {
      mounted.current = false
      authLinksActive = false
      unsubscribeAuth()
      linkSubscription.remove()
    }
  }, [loadProfile])

  const signIn = useCallback(async (email: string, password: string) => {
    setError(null)
    try { await authRepository.signIn(email, password) } catch (cause) { const next = normalizeAppError(cause, { domain: 'auth', operation: 'sign-in' }); setError(next); throw next }
  }, [])

  const signUp = useCallback(async (input: SignUpInput) => {
    setError(null)
    try { return await authRepository.signUp(input) } catch (cause) { const next = normalizeAppError(cause, { domain: 'auth', operation: 'sign-up' }); setError(next); throw next }
  }, [])

  const signOut = useCallback(async () => {
    manualSignOut.current = true
    await signOutSafely()
  }, [])

  const refreshProfile = useCallback(async () => {
    if (session?.user.id) await loadProfile(session.user.id)
  }, [session?.user.id, loadProfile])

  const clearSessionState = useCallback(() => {
    setStatus(session ? 'signed-in' : 'signed-out')
    setError(null)
  }, [session])

  const value = useMemo<AuthContextValue>(() => ({
    session,
    profile,
    status,
    loading: status === 'restoring',
    error,
    isRestricted: status === 'restricted' || profile?.is_banned === true,
    signIn,
    signUp,
    signOut,
    refreshProfile,
    clearSessionState
  }), [session, profile, status, error, signIn, signUp, signOut, refreshProfile, clearSessionState])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
