// Pure decisions extracted out of App.tsx so they're unit-testable without
// mocking Supabase's auth client or React state.

// Confirmed on a real device: Supabase can re-emit 'SIGNED_IN' for the SAME
// already-logged-in user after the app resumes from background (session
// restoration/token refresh presenting as a fresh sign-in, not a real
// account change). Resetting screen/activeRequest on every 'SIGNED_IN' by
// name wiped out an already-recovered ActiveRequestScreen/VolunteerJobScreen
// and dropped the user back on Home despite a real active mission still
// existing. Only a genuine identity change (or a real sign-out) should
// trigger that reset.
export function isRealAuthTransition(event: string, nextUserId: string | null, lastUserId: string | null): boolean {
  if (event === 'SIGNED_OUT') return true
  return event === 'SIGNED_IN' && nextUserId !== lastUserId
}

export type ActiveMissionTarget = { screen: 'active-request' } | { screen: 'volunteer-job' } | null

// The two queries (as requester, as volunteer) are already scoped to
// ACTIVE_STATUSES at the database level - a terminal (completed/cancelled)
// mission simply never comes back as a row here, so `null` naturally covers
// "nothing to resume" without a separate status check on this side.
export function resolveActiveMissionScreen(asRequesterMission: unknown, asVolunteerMission: unknown): ActiveMissionTarget {
  if (asRequesterMission) return { screen: 'active-request' }
  if (asVolunteerMission) return { screen: 'volunteer-job' }
  return null
}

export type MissionRecoveryDeps<T> = {
  fetchAsRequester: () => Promise<T>
  fetchAsVolunteer: () => Promise<T>
  // Re-checked after each await, so a result that only resolves after the
  // session changed or the caller's effect was cleaned up never gets
  // applied - confirmed on a real device as a real (if narrow-window) race.
  isStale: () => boolean
  onFound: (target: 'active-request' | 'volunteer-job', mission: T) => void
}

export async function recoverActiveMission<T>({ fetchAsRequester, fetchAsVolunteer, isStale, onFound }: MissionRecoveryDeps<T>): Promise<void> {
  const asRequester = await fetchAsRequester()
  if (isStale()) return
  if (resolveActiveMissionScreen(asRequester, null)?.screen === 'active-request') {
    onFound('active-request', asRequester)
    return
  }

  const asVolunteer = await fetchAsVolunteer()
  if (isStale()) return
  if (resolveActiveMissionScreen(null, asVolunteer)?.screen === 'volunteer-job') {
    onFound('volunteer-job', asVolunteer)
  }
}
