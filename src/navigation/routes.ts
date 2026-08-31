export const publicRoutes = ['/welcome', '/login', '/signup', '/forgot-password', '/reset-password', '/restricted'] as const

export const tabRoutes = ['/(tabs)', '/(tabs)/community', '/(tabs)/activity', '/(tabs)/account'] as const

export const requesterRoutes = ['/requester'] as const

export const helperRoutes = ['/helper'] as const

export const communityRoutes = [
  '/community', '/community/business/[businessId]', '/community/offer/[offerId]'
] as const

// Account has no sub-routes in the real product - it's one screen, reached
// only via the (tabs)/account tab (see tabRoutes).
export const accountRoutes = [] as const

export const protectedRouteFamilies = [requesterRoutes, helperRoutes, communityRoutes, accountRoutes] as const

export type LaunchState = {
  bootstrapped: boolean
  hasSession: boolean
  restricted: boolean
}

// Real SANAD launch resolution: no mandatory first-launch language picker
// (language auto-detects, changeable later from Account) - unauthenticated
// users land on the Welcome screen, which offers "create account" / "I
// already have an account" into Signup/Login.
export function resolveLaunchRoute(state: LaunchState) {
  if (!state.bootstrapped) return null
  if (state.restricted) return '/restricted' as const
  if (!state.hasSession) return '/welcome' as const
  return '/(tabs)' as const
}
