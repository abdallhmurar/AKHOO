import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { subscribeToAppErrors } from '../services/errors'
import { useAuth } from './AuthProvider'

export function DiagnosticsBridge() {
  const { session } = useAuth()
  const userId = session?.user.id
  useEffect(() => {
    if (!userId) return
    const sent = new Map<string, number>()
    return subscribeToAppErrors(({ error }) => {
      if (['offline','validation','conflict'].includes(error.code)) return
      const domain = error.context?.domain ?? ''
      const operation = error.context?.operation ?? ''
      if (!/^[a-z-]{0,40}$/.test(domain) || !/^[a-z-]{0,60}$/.test(operation)) return
      const key = `${error.code}:${domain}:${operation}`
      if (Date.now() - (sent.get(key) ?? 0) < 60_000) return
      sent.set(key, Date.now())
      // Never pass the raw exception or recurse through reportAppError.
      void Promise.resolve(supabase.rpc('record_client_error', { p_code: error.code, p_domain: domain, p_operation: operation })).catch(() => {})
    })
  }, [userId])
  return null
}
