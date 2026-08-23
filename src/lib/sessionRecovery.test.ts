import { describe, expect, it } from 'vitest'
import { isRealAuthTransition, recoverActiveMission, resolveActiveMissionScreen } from './sessionRecovery'

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

describe('recoverActiveMission', () => {
  // The actual bug this round: the requester-mission query can still be in
  // flight when the session changes or the caller's effect is cleaned up.
  // Without re-checking isStale() after the await, a late result would
  // overwrite newer session state with a stale mission.
  it('does not apply a requester-mission result that resolves after the caller goes stale', async () => {
    let stale = false
    const found: unknown[] = []
    let resolveRequester!: (value: unknown) => void
    const requesterPromise = new Promise(resolve => { resolveRequester = resolve })

    const run = recoverActiveMission({
      fetchAsRequester: () => requesterPromise,
      fetchAsVolunteer: () => Promise.resolve(null),
      isStale: () => stale,
      onFound: (target, mission) => found.push({ target, mission })
    })

    stale = true
    resolveRequester({ id: 'req-1' })
    await run

    expect(found).toEqual([])
  })

  // Same race, but on the second (volunteer) query - proves isStale() is
  // re-checked at both await points, not just the first.
  it('does not apply a volunteer-mission result that resolves after the caller goes stale', async () => {
    let stale = false
    const found: unknown[] = []
    let resolveVolunteer!: (value: unknown) => void
    const volunteerPromise = new Promise(resolve => { resolveVolunteer = resolve })

    const run = recoverActiveMission({
      fetchAsRequester: () => Promise.resolve(null),
      fetchAsVolunteer: () => volunteerPromise,
      isStale: () => stale,
      onFound: (target, mission) => found.push({ target, mission })
    })

    stale = true
    resolveVolunteer({ id: 'req-2' })
    await run

    expect(found).toEqual([])
  })

  it('applies the requester-mission result when the caller never goes stale', async () => {
    const found: unknown[] = []
    await recoverActiveMission({
      fetchAsRequester: () => Promise.resolve({ id: 'req-1' }),
      fetchAsVolunteer: () => Promise.resolve(null),
      isStale: () => false,
      onFound: (target, mission) => found.push({ target, mission })
    })
    expect(found).toEqual([{ target: 'active-request', mission: { id: 'req-1' } }])
  })

  it('falls through to the volunteer-mission result when not stale and no requester mission exists', async () => {
    const found: unknown[] = []
    await recoverActiveMission({
      fetchAsRequester: () => Promise.resolve(null),
      fetchAsVolunteer: () => Promise.resolve({ id: 'req-2' }),
      isStale: () => false,
      onFound: (target, mission) => found.push({ target, mission })
    })
    expect(found).toEqual([{ target: 'volunteer-job', mission: { id: 'req-2' } }])
  })
})
