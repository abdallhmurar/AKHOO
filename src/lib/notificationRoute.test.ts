import { describe, expect, it } from 'vitest'
import { notificationRoute } from './notificationRoute'
describe('push navigation', () => {
  it('opens the corresponding chat or nearby requests', () => {
    const id = '00000000-0000-0000-0000-000000000001'
    expect(notificationRoute({ requestId: id, missionChat: true })).toBe(`/mission/${id}/chat`)
    expect(notificationRoute({ requestId: id })).toBe('/helper')
  })
  it('opens the announcements screen for an admin broadcast', () => {
    expect(notificationRoute({ broadcastNotificationId: '00000000-0000-0000-0000-000000000002' })).toBe('/announcements')
    expect(notificationRoute({ broadcastNotificationId: '../account' })).toBeNull()
  })
  it('ignores untrusted links and invalid request identifiers', () => {
    expect(notificationRoute({ url: 'https://example.com' })).toBeNull()
    expect(notificationRoute({ requestId: '../account/delete-confirm', missionChat: true })).toBeNull()
  })
})
