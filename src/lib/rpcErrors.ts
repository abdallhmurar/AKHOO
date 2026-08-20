import type { TFunction } from 'i18next'

// Server-side RPCs (accept_help_request, update_help_request_status,
// confirm_help_request_completion, cancel_help_request) raise plain-text
// Postgres exceptions - supabase-js surfaces that text verbatim as
// error.message. Without this map, those exact English strings render
// straight into the UI regardless of the user's language. Anything not
// listed here falls back to the generic translated error message rather
// than ever showing raw text.
const KNOWN_MESSAGES: Record<string, string> = {
  'Not authenticated': 'common.rpcErrors.notAuthenticated',
  'Volunteer is not available': 'common.rpcErrors.volunteerNotAvailable',
  'Account is banned': 'common.rpcErrors.accountBanned',
  'Invalid status': 'common.rpcErrors.invalidStatus',
  'Invalid status transition': 'common.rpcErrors.invalidTransition',
  'Request not found': 'common.rpcErrors.requestNotFound',
  'Not authorized': 'common.rpcErrors.notAuthorized',
  LOCATION_PERMISSION_DENIED: 'common.rpcErrors.locationDenied',
  'Not your mission': 'common.rpcErrors.notYourMission',
  'Mission cannot be released from its current state': 'common.rpcErrors.cannotRelease',
  'You already released this mission': 'common.rpcErrors.alreadyReleased'
}

export function translateActionError(t: TFunction, error: { message?: string; code?: string } | null | undefined): string {
  // Postgres unique_violation on help_requests_one_active_per_requester
  // (the DB-level backstop for "one active request per requester").
  if (error?.code === '23505') return t('common.rpcErrors.alreadyHaveActiveRequest')
  const message = error?.message ?? ''
  const key = KNOWN_MESSAGES[message]
  return key ? t(key) : t('common.error')
}
