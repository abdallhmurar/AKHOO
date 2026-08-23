// A failed/short-circuited push registration must not overwrite a
// previously stored valid token with null - only include push_token in the
// upsert payload when a real token was actually obtained this time.
export function buildAvailableUpsertPayload(
  userId: string,
  position: { latitude: number; longitude: number },
  pushToken: string | null
) {
  return {
    user_id: userId,
    is_available: true as const,
    latitude: position.latitude,
    longitude: position.longitude,
    ...(pushToken ? { push_token: pushToken } : {}),
    updated_at: new Date().toISOString()
  }
}
