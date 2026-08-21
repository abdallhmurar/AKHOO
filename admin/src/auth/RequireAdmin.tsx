import { Outlet } from 'react-router-dom'
import { FullPageSpinner } from '@/components/FullPageSpinner'
import { useAuth } from './useAuth'
import { LoginPage } from './LoginPage'
import { AccessDeniedPage } from './AccessDeniedPage'
import { NetworkErrorPage } from './NetworkErrorPage'

// Re-evaluated on every render of this layout route, i.e. on every
// navigation under it - the `is-admin` query's 5-minute staleTime keeps
// that cheap (no network round trip per click) while refetchOnWindowFocus
// re-verifies within seconds of the tab regaining focus. A revoked admin
// is fully locked out (AdminShell/data queries never mount) the moment
// this check next resolves to false, not "never" - bounded by that window.
export function RequireAdmin() {
  const { state } = useAuth()

  switch (state.status) {
    case 'loading':
    case 'checking_admin':
      return <FullPageSpinner />
    case 'logged_out':
      return <LoginPage />
    case 'non_admin':
      return <AccessDeniedPage />
    case 'network_error':
      return <NetworkErrorPage onRetry={state.retry} />
    case 'admin':
      return <Outlet />
  }
}
