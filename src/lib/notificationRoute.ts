export function notificationRoute(data: Record<string, unknown>): `/mission/${string}` | `/mission/${string}/chat` | '/helper' | null {
  const id = data.requestId
  if (typeof id !== 'string' || !/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(id)) return null
  // New-request notifications belong in the live nearby list; a request may
  // have been claimed since delivery. Chat routes remain RLS protected.
  return data.missionChat === true ? `/mission/${id}/chat` : '/helper'
}
