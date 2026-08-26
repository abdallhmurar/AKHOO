import { Redirect } from 'expo-router'
import { LaunchScreen, useAuth, useLanguageDirection } from '../src/providers'
import { resolveLaunchRoute } from '../src/navigation/routes'

export default function IndexRoute() {
  const { session, loading, isRestricted } = useAuth()
  const { ready } = useLanguageDirection()
  const route = resolveLaunchRoute({ bootstrapped: ready && !loading, hasSession: !!session, restricted: isRestricted })
  if (!route) return <LaunchScreen />
  return <Redirect href={route} />
}
