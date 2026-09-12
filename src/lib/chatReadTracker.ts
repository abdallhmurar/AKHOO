import AsyncStorage from '@react-native-async-storage/async-storage'

// Local, per-device "have I opened this request's chat since X" marker -
// enough to drive an unread badge on the mission screen's chat button
// without a synced read-receipts table. Keyed per request since a user
// can only ever have one active mission at a time, but this keeps old
// requests' markers around harmlessly (never read back once the mission
// screen is gone) rather than needing separate cleanup.
const PREFIX = 'sanad_chat_last_read_'

export async function getLastReadAt(requestId: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(PREFIX + requestId)
  } catch {
    return null
  }
}

export async function setLastReadAt(requestId: string, iso: string) {
  try {
    await AsyncStorage.setItem(PREFIX + requestId, iso)
  } catch {
    // Best-effort - a failed write just means the badge might show a
    // message as unread again later, not a functional break.
  }
}
