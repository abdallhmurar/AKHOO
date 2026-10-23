import { SOUND_CHANNELS, SOUND_PACK, type SoundCategory } from '../../../shared/notificationSounds.ts'
import type { PushMessage } from './push.ts'
import type { EventKey } from './notificationCopy.ts'

// deno-lint-ignore no-explicit-any
type Db = any

// Which sound each notify-event notification uses. Every event must be listed (the type enforces it).
export const eventSound: Record<EventKey, SoundCategory> = {
  request_still_open: 'requests',
  request_accepted: 'updates', helper_on_the_way: 'updates', helper_arrived: 'updates', completion_requested: 'updates',
  completion_rejected: 'updates', helper_released: 'updates', request_sent: 'updates', no_volunteer: 'updates', mission_cancelled: 'updates',
  request_completed: 'updates', level_up: 'updates', first_help: 'updates', milestone: 'updates', rating_reminder: 'updates',
  redemption_created: 'updates', redemption_redeemed: 'updates', redemption_redeemed_partner: 'updates', redemption_expiring: 'updates',
  offer_approved: 'updates', offer_rejected: 'updates', volunteer_verified: 'updates', new_device: 'updates',
  support_resolved: 'calm', report_reviewed: 'calm', account_banned: 'calm', account_unbanned: 'calm',
  admin_support_message: 'calm', admin_report: 'calm', admin_offer_pending: 'calm'
}

// Gives each message the channel and sound of its category, but only for devices that reported the sound pack.
// If the lookup fails the messages go out unchanged (default channel, system sound): a sound is never worth a lost push.
export async function withSounds(db: Db, messages: PushMessage[], category: SoundCategory): Promise<PushMessage[]> {
  if (!messages.length) return messages
  try {
    const tokens = [...new Set(messages.map(message => message.to))]
    const packs = new Map<string, number>()
    for (let offset = 0; offset < tokens.length; offset += 200) {
      const { data, error } = await db.from('push_devices').select('token, sound_pack').in('token', tokens.slice(offset, offset + 200))
      if (error) throw error
      for (const row of (data ?? []) as { token: string; sound_pack: number | null }[]) packs.set(row.token, Number(row.sound_pack ?? 0))
    }
    const { sound } = SOUND_CHANNELS[category]
    return messages.map(message => (packs.get(message.to) ?? 0) >= SOUND_PACK ? { ...message, channelId: category, sound } : message)
  } catch {
    return messages
  }
}
