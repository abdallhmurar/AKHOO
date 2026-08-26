import { Redirect } from 'expo-router'
import { LaunchScreen, useAuth, useLanguageDirection } from '../src/providers'
import { resolveLaunchRoute } from '../src/navigation/routes'

export default function IndexRoute() {
  const { session, loading, isRestricted, status } = useAuth()
  const { ready, hasSelectedLanguage } = useLanguageDirection()
  const route = resolveLaunchRoute({ bootstrapped: ready && !loading, hasSelectedLanguage, hasSession: !!session, restricted: isRestricted, sessionExpired: status === 'session-expired' })
  if (!route) return <LaunchScreen />
  return <Redirect href={route} />
}
