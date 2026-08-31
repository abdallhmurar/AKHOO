import * as Linking from 'expo-linking'
import type { Session } from '@supabase/supabase-js'
import { stopBackgroundLocationUpdates } from '../lib/location'
import { authRepository } from '../repositories/authRepository'
import { normalizeAppError } from './errors'

export type AuthLinkResult = {
  handled: boolean
  recovery: boolean
  session: Session | null
}

function getUrlParameters(url: string) {
  const queryIndex = url.indexOf('?')
  const hashIndex = url.indexOf('#')
  const query = queryIndex >= 0
    ? url.slice(queryIndex + 1, hashIndex >= 0 ? hashIndex : undefined)
    : ''
  const hash = hashIndex >= 0 ? url.slice(hashIndex + 1) : ''
  return new URLSearchParams([query, hash].filter(Boolean).join('&'))
}

export async function consumeAuthLink(url: string): Promise<AuthLinkResult> {
  const params = getUrlParameters(url)
  const type = params.get('type')
  const recovery = type === 'recovery' || url.includes('reset-password')
  const accessToken = params.get('access_token')
  const refreshToken = params.get('refresh_token')
  const code = params.get('code')

  // Google/Apple (or Supabase itself) can redirect back with an error
  // instead of a token - e.g. a misconfigured provider, a redirect URL not
  // on the allow list, or a denied consent. Without this check that failure
  // was silently swallowed: `handled: false` with no thrown error, so the
  // caller just fell back to signed-out with nothing visible to explain why.
  const errorCode = params.get('error') ?? params.get('error_code')
  if (errorCode) {
    const description = params.get('error_description') ?? errorCode
    throw normalizeAppError(description.replace(/\+/g, ' '), { domain: 'auth', operation: 'oauth-callback', metadata: { errorCode } })
  }

  if (accessToken && refreshToken) {
    const session = await authRepository.setSession(accessToken, refreshToken)
    return { handled: true, recovery, session }
  }

  if (code) {
    const session = await authRepository.exchangeCode(code)
    return { handled: true, recovery, session }
  }

  return { handled: false, recovery, session: null }
}

export async function getInitialAuthLink() {
  const url = await Linking.getInitialURL()
  return url ? consumeAuthLink(url) : null
}

/** Stop OS location work before invalidating the user's auth session. */
export async function signOutSafely() {
  try {
    await stopBackgroundLocationUpdates()
  } finally {
    await authRepository.signOut()
  }
}
