// The notification sounds, shared by the app (which creates the Android channels and bundles the files) and the
// Edge Functions (which pick the channel and sound for each push). Android cannot change a channel's sound after
// it exists, so every sound has its own channel and the channel id is the category name.
//
// SOUND_PACK is what a device reports once it has this app code and these files. Older builds report nothing (0)
// and keep getting the "default" channel and the system sound: naming a channel that does not exist on a phone
// would make Android drop the notification, so the server only uses these for devices that reported the pack.

export type SoundCategory = 'requests' | 'updates' | 'messages' | 'calm'

export const SOUND_PACK = 1

export const SOUND_CHANNELS: Record<SoundCategory, { sound: string; importance: 'high' | 'default' }> = {
  // A nearby request: the one sound that has to be noticed.
  requests: { sound: 'akhoo_request.wav', importance: 'high' },
  // News about my request, points, levels and offers.
  updates: { sound: 'akhoo_update.wav', importance: 'high' },
  // A chat message.
  messages: { sound: 'akhoo_message.wav', importance: 'high' },
  // Support, announcements, account notices and admin alerts.
  calm: { sound: 'akhoo_calm.wav', importance: 'default' }
}
