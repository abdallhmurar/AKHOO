const UUID = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i

export function notificationRoute(data: Record<string, unknown>): `/mission/${string}` | `/mission/${string}/chat` | '/helper' | '/announcements' | null {
  // Admin broadcasts (send-broadcast-notification) carry only their own id;
  // the announcements screen lists them, so the id is never used in the path.
  if (typeof data.broadcastNotificationId === 'string' && UUID.test(data.broadcastNotificationId)) return '/announcements'
  const id = data.requestId
  if (typeof id !== 'string' || !UUID.test(id)) return null
  // New-request notifications belong in the live nearby list; a request may
  // have been claimed since delivery. Chat routes remain RLS protected.
  return data.missionChat === true ? `/mission/${id}/chat` : '/helper'
}
