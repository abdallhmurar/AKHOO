import { describe, expect, it } from 'vitest'
import { isRealAuthTransition, resolveActiveMissionScreen } from './sessionRecovery'

describe('isRealAuthTransition', () => {
  it('is always a real transition on SIGNED_OUT', () => {
    expect(isRealAuthTransition('SIGNED_OUT', null, 'user-1')).toBe(true)
  })

  it('is a real transition when SIGNED_IN carries a different user than before', () => {
    expect(isRealAuthTransition('SIGNED_IN', 'user-2', 'user-1')).toBe(true)
  })

  it('is a real transition for the very first sign-in (no prior user)', () => {
    expect(isRealAuthTransition('SIGNED_IN', 'user-1', null)).toBe(true)
  })

  // The actual bug this round: Supabase re-emitting SIGNED_IN for the same
  // already-logged-in user (session restore/token refresh after the app
  // resumes from background) must NOT be treated as a real transition, or
  // it wipes out an already-recovered active mission screen.
  it('is NOT a real transition when SIGNED_IN re-fires for the same user', () => {
    expect(isRealAuthTransition('SIGNED_IN', 'user-1', 'user-1')).toBe(false)
  })

  it('is not a real transition for unrelated event types (e.g. TOKEN_REFRESHED)', () => {
    expect(isRealAuthTransition('TOKEN_REFRESHED', 'user-1', 'user-1')).toBe(false)
  })
})

describe('resolveActiveMissionScreen', () => {
  it('resolves to active-request when a requester mission exists', () => {
    expect(resolveActiveMissionScreen({ id: 'req-1' }, null)).toEqual({ screen: 'active-request' })
  })

  it('resolves to volunteer-job when a volunteer mission exists', () => {
    expect(resolveActiveMissionScreen(null, { id: 'req-2' })).toEqual({ screen: 'volunteer-job' })
  })

  it('prefers the requester mission when both are somehow present', () => {
    expect(resolveActiveMissionScreen({ id: 'req-1' }, { id: 'req-2' })).toEqual({ screen: 'active-request' })
  })

  // A terminal (completed/cancelled) mission never comes back from the
  // ACTIVE_STATUSES-filtered query in the first place - null covers it.
  it('resolves to null (no resume) when neither query found anything', () => {
    expect(resolveActiveMissionScreen(null, null)).toBeNull()
  })
})
