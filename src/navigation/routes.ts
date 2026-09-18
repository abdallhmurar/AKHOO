export const publicRoutes = ['/welcome', '/login', '/signup', '/forgot-password', '/reset-password', '/restricted'] as const

export const tabRoutes = ['/(tabs)', '/(tabs)/community', '/(tabs)/activity', '/(tabs)/account'] as const

export const requesterRoutes = ['/requester'] as const

export const helperRoutes = ['/helper'] as const

export const communityRoutes = [
  '/community', '/community/business/[businessId]', '/community/offer/[offerId]'
] as const

// Partner Tools performs its own permission check in addition to the root
// session guard. It is part of Account, not an additional product tab.
export const accountRoutes = ['/(tabs)/account/partner'] as const

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
