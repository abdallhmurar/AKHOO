import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { PropsWithChildren } from 'react'
import type { Session } from '@supabase/supabase-js'
import { authRepository, type OAuthProvider, type SignUpInput } from '../repositories/authRepository'
import { profileRepository } from '../repositories/profileRepository'
import { consumeAuthLink, signOutSafely } from '../services/authService'
import { normalizeAppError, reportAppError, type AppError } from '../services/errors'
import type { Profile } from '../types'
import * as Linking from 'expo-linking'

// Captured at module load, before Expo Router mounts. On web, an OAuth
// redirect lands back with #access_token=... in the URL, but Expo Router's
// own linking setup rewrites the visible URL to the resolved route (history
// replaceState) as it mounts - which runs before this provider's effect and
// silently strips the hash. Reading window.location.href this early, before
// any router code executes, avoids that race entirely.
const capturedWebUrl = typeof window !== 'undefined' ? window.location.href : null

type AuthStatus = 'restoring' | 'signed-out' | 'signed-in' | 'restricted'

type AuthContextValue = {
  session: Session | null
  profile: Profile | null
  status: AuthStatus
  loading: boolean
  error: AppError | null
  isRestricted: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (input: SignUpInput) => ReturnType<typeof authRepository.signUp>
  signInWithOAuth: (provider: OAuthProvider) => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [status, setStatus] = useState<AuthStatus>('restoring')
  const [error, setError] = useState<AppError | null>(null)
  const mounted = useRef(true)

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
        const initialUrl = capturedWebUrl ?? await Linking.getInitialURL()
        if (initialUrl) await consumeAuthLink(initialUrl)
        const restored = await authRepository.getSession()
        if (!mounted.current) return
        setSession(restored)
        if (restored) await loadProfile(restored.user.id)
        else setStatus('signed-out')
      } catch (cause) {
        if (!mounted.current) return
        // Surfaced as a toast (not just kept in context state, which nothing
        // reads) so a failed auth-link exchange - e.g. an OAuth or
        // password-reset redirect - is visible instead of silently dropping
        // the user back on the signed-out Welcome screen.
        setError(reportAppError(cause, { domain: 'auth', operation: 'restore' }))
        setStatus('signed-out')
      }
    }
    void restore()
    const unsubscribeAuth = authRepository.subscribe((_event, next) => {
      if (!mounted.current) return
      setSession(next)
      const nextUser = next?.user.id ?? null
      if (nextUser) {
        void loadProfile(nextUser)
      } else {
        setProfile(null)
        setStatus('signed-out')
      }
    })
    const linkSubscription = Linking.addEventListener('url', ({ url }) => {
      if (!authLinksActive) return
      consumeAuthLink(url).catch(cause => setError(reportAppError(cause, { domain: 'auth', operation: 'deep-link' })))
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

  const signInWithOAuth = useCallback(async (provider: OAuthProvider) => {
    setError(null)
    try { await authRepository.signInWithOAuth(provider) } catch (cause) { const next = normalizeAppError(cause, { domain: 'auth', operation: `oauth-${provider}` }); setError(next); throw next }
  }, [])

  const signOut = useCallback(async () => {
    await signOutSafely()
  }, [])

  const refreshProfile = useCallback(async () => {
    if (session?.user.id) await loadProfile(session.user.id)
  }, [session?.user.id, loadProfile])

  const value = useMemo<AuthContextValue>(() => ({
    session,
    profile,
    status,
    loading: status === 'restoring',
    error,
    isRestricted: status === 'restricted' || profile?.is_banned === true,
    signIn,
    signUp,
    signInWithOAuth,
    signOut,
    refreshProfile
  }), [session, profile, status, error, signIn, signUp, signInWithOAuth, signOut, refreshProfile])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
