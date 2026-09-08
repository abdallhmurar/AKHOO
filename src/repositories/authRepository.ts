import { Platform } from 'react-native'
import * as WebBrowser from 'expo-web-browser'
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { normalizeAppError, throwIfError } from '../services/errors'

export type SignUpInput = {
  email: string
  password: string
  fullName: string
  phone: string
}

export type OAuthProvider = 'google' | 'apple'

export const authRepository = {
  async getSession() {
    const { data, error } = await supabase.auth.getSession()
    throwIfError(error, { domain: 'auth', operation: 'get-session', silent: true })
    return data.session
  },

  async getUser(): Promise<User | null> {
    const { data, error } = await supabase.auth.getUser()
    throwIfError(error, { domain: 'auth', operation: 'get-user', silent: true })
    return data.user
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    throwIfError(error, { domain: 'auth', operation: 'sign-in' })
    return data
  },

  async signUp(input: SignUpInput) {
    const { data, error } = await supabase.auth.signUp({
      email: input.email.trim(),
      password: input.password,
      options: {
        data: {
          full_name: input.fullName.trim(),
          phone: input.phone
        }
      }
    })
    throwIfError(error, { domain: 'auth', operation: 'sign-up' })
    return data
  },

  /**
   * Signs in with Google/Apple, creating the account on first use - same
   * behavior Supabase gives every OAuth provider, no separate signup call.
   * Web does a full-page redirect. Native returns the `akhoo://auth-callback`
   * URL (or null if the user cancelled) for the caller to hand to
   * `consumeAuthLink` - `ASWebAuthenticationSession` (what this runs on under
   * the hood on iOS) intercepts its own callback scheme internally and
   * resolves it only through this promise's result; it never reaches the
   * app's normal `Linking` 'url' event, so nothing else will ever see it.
   */
  async signInWithOAuth(provider: OAuthProvider): Promise<string | null> {
    if (Platform.OS === 'web') {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: window.location.origin }
      })
      throwIfError(error, { domain: 'auth', operation: `oauth-${provider}` })
      return null
    }

    const redirectTo = 'akhoo://auth-callback'
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo, skipBrowserRedirect: true }
    })
    throwIfError(error, { domain: 'auth', operation: `oauth-${provider}` })
    if (!data.url) throw normalizeAppError('Could not start sign-in.', { domain: 'auth', operation: `oauth-${provider}` })

    // A 'cancel'/'dismiss' result just means the user closed the sheet - not
    // an error worth surfacing, just nothing for the caller to consume.
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo)
    return result.type === 'success' ? result.url : null
  },

  async resendVerification(email: string, emailRedirectTo?: string) {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim(),
      options: emailRedirectTo ? { emailRedirectTo } : undefined
    })
    throwIfError(error, { domain: 'auth', operation: 'resend-verification' })
  },

  async requestPasswordReset(email: string, redirectTo = 'akhoo://reset-password') {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo })
    throwIfError(error, { domain: 'auth', operation: 'request-password-reset' })
  },

  async updatePassword(password: string) {
    const { data, error } = await supabase.auth.updateUser({ password })
    throwIfError(error, { domain: 'auth', operation: 'update-password' })
    return data.user
  },

  async setSession(accessToken: string, refreshToken: string): Promise<Session> {
    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken
    })
    throwIfError(error, { domain: 'auth', operation: 'set-session' })
    if (!data.session) throw normalizeAppError('The authentication link is no longer valid.', { domain: 'auth', operation: 'set-session' })
    return data.session
  },

  async exchangeCode(code: string): Promise<Session> {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    throwIfError(error, { domain: 'auth', operation: 'exchange-code' })
    return data.session
  },

  async refreshSession() {
    const { data, error } = await supabase.auth.refreshSession()
    throwIfError(error, { domain: 'auth', operation: 'refresh-session', silent: true })
    return data.session
  },

  async signOut(scope: 'global' | 'local' | 'others' = 'local') {
    const { error } = await supabase.auth.signOut({ scope })
    throwIfError(error, { domain: 'auth', operation: 'sign-out' })
  },

  subscribe(listener: (event: AuthChangeEvent, session: Session | null) => void) {
    const { data } = supabase.auth.onAuthStateChange(listener)
    return () => data.subscription.unsubscribe()
  }
}
