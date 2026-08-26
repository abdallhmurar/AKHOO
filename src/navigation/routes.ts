export const publicRoutes = [
  '/language', '/welcome', '/login', '/signup', '/verify-email',
  '/forgot-password', '/reset-password', '/session-expired', '/offline-auth', '/restricted'
] as const

export const tabRoutes = ['/(tabs)', '/(tabs)/community', '/(tabs)/activity', '/(tabs)/account'] as const

export const requesterRoutes = [
  '/requester/emergency', '/requester/category', '/requester/scenario', '/requester/details',
  '/requester/media', '/requester/location', '/requester/review', '/requester/matching', '/requester/assigned'
] as const

export const helperRoutes = [
  '/helper', '/helper/onboarding', '/helper/skills', '/helper/languages',
  '/helper/availability', '/helper/nearby', '/helper/request/[requestId]'
] as const

export const communityRoutes = [
  '/community', '/community/businesses', '/community/business/[businessId]', '/community/offers',
  '/community/offer/[offerId]', '/community/plus', '/community/rewards', '/community/points'
] as const

export const accountRoutes = [
  '/account', '/account/profile', '/account/settings', '/account/language', '/account/notifications',
  '/account/accessibility', '/account/privacy', '/account/safety', '/account/support'
] as const

export const protectedRouteFamilies = [requesterRoutes, helperRoutes, communityRoutes, accountRoutes] as const

export type LaunchState = {
  bootstrapped: boolean
  hasSelectedLanguage: boolean
  hasSession: boolean
  restricted: boolean
  sessionExpired: boolean
}

export function resolveLaunchRoute(state: LaunchState) {
  if (!state.bootstrapped) return null
  if (!state.hasSelectedLanguage) return '/language' as const
  if (state.restricted) return '/restricted' as const
  if (state.sessionExpired) return '/session-expired' as const
  if (!state.hasSession) return '/welcome' as const
  return '/(tabs)' as const
}
