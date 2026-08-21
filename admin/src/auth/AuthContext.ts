import { createContext } from 'react'
import type { Session } from '@supabase/supabase-js'

export type AuthState =
  | { status: 'loading' }
  | { status: 'logged_out' }
  | { status: 'checking_admin' }
  | { status: 'admin'; session: Session }
  | { status: 'non_admin'; session: Session }
  | { status: 'network_error'; retry: () => void }

export const AuthContext = createContext<{ state: AuthState; signOut: () => void } | undefined>(undefined)
