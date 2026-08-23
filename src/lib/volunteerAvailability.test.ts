import { describe, expect, it } from 'vitest'
import { buildAvailableUpsertPayload } from './volunteerAvailability'

const POSITION = { latitude: 31.7683, longitude: 35.2137 }

describe('buildAvailableUpsertPayload', () => {
  it('includes push_token when a valid token was obtained', () => {
    const payload = buildAvailableUpsertPayload('user-1', POSITION, 'ExponentPushToken[abc]')
    expect(payload.push_token).toBe('ExponentPushToken[abc]')
  })

  // The actual bug this round: registerForPushNotificationsAsync() failing
  // must not wipe out a previously stored valid token with null.
  it('omits push_token entirely when registration failed (null token), so an upsert never writes null over it', () => {
    const payload = buildAvailableUpsertPayload('user-1', POSITION, null)
    expect('push_token' in payload).toBe(false)
  })

  it('always marks the volunteer available with the given position regardless of token outcome', () => {
    const payload = buildAvailableUpsertPayload('user-1', POSITION, null)
    expect(payload.user_id).toBe('user-1')
    expect(payload.is_available).toBe(true)
    expect(payload.latitude).toBe(POSITION.latitude)
    expect(payload.longitude).toBe(POSITION.longitude)
  })
})
