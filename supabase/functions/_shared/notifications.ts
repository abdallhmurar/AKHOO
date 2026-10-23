import { sendPushMessages, type PushMessage } from './push.ts'
import { MILESTONES, asLang, levelFor, render, type EventKey, type Lang } from './notificationCopy.ts'
import { readAll } from './pagination.ts'

// deno-lint-ignore no-explicit-any
type Db = any

// requests/mission/rewards/reminders/offers/announcements can be switched off by the user (stored in
// notification_preferences). support, account, partner and admin are essential and always on.
export type Category = 'requests' | 'mission' | 'rewards' | 'reminders' | 'offers' | 'announcements' | 'support' | 'account' | 'partner' | 'admin'

// reminders and offers are the promotional kind: off until the user opts in (App Store rule 4.5.4).
export const DEFAULT_PREFS = { requests: true, mission: true, rewards: true, reminders: false, offers: false, announcements: true } as const
type Toggleable = keyof typeof DEFAULT_PREFS
type PrefRow = { user_id: string } & Partial<Record<Toggleable, boolean>>

export function isToggleable(category: Category): category is Toggleable {
  return category in DEFAULT_PREFS
}

// Users who may receive this category: everyone for essential categories, otherwise the stored choice,
// falling back to the default for users who never opened the settings.
export function allowedUsers(category: Category, userIds: string[], rows: PrefRow[]): string[] {
  if (!isToggleable(category)) return userIds
  const byUser = new Map(rows.map(row => [row.user_id, row]))
  return userIds.filter(id => (byUser.get(id)?.[category] ?? DEFAULT_PREFS[category]) === true)
}

export async function usersAllowed(db: Db, category: Category, userIds: string[]): Promise<string[]> {
  if (!userIds.length || !isToggleable(category)) return userIds
  const { data } = await db.from('notification_preferences').select('*').in('user_id', userIds)
  return allowedUsers(category, userIds, (data ?? []) as PrefRow[])
}

export type Outgoing = {
  event: EventKey
  category: Category
  userIds: string[]
  // Key that makes the notification once-only per user (retried webhooks, repeated ticks).
  dedupe?: string
  vars?: Record<string, string | number> | ((language: Lang) => Record<string, string | number>)
  data?: Record<string, unknown>
  // For account notices that must reach a suspended user too.
  includeBanned?: boolean
}

type Device = { user_id: string; token: string; language: string | null }

// The whole pipeline for one notification: preferences, once-only, devices and languages, send, clean up
// dead tokens. Returns how many pushes Expo accepted.
export async function deliver(db: Db, out: Outgoing, send: typeof sendPushMessages = sendPushMessages) {
  let ids = [...new Set(out.userIds.filter(Boolean))]
  ids = await usersAllowed(db, out.category, ids)
  if (ids.length && out.dedupe) {
    const { data: fresh, error } = await db.from('notification_log')
      .upsert(ids.map(user_id => ({ user_id, dedupe_key: out.dedupe, event: out.event })), { onConflict: 'user_id,dedupe_key', ignoreDuplicates: true })
      .select('user_id')
    if (error) throw error
    ids = ((fresh ?? []) as { user_id: string }[]).map(row => row.user_id)
  }
  if (!ids.length) return { attempted: 0, sent: 0, reachedUsers: [] as string[] }

  const devices = out.includeBanned
    ? await readAll<Device>((from, to) => db.from('push_devices').select('user_id, token, language').in('user_id', ids).eq('enabled', true).order('token').range(from, to))
    : await readAll<Device>((from, to) => db.rpc('get_localized_push_recipients', { p_user_ids: ids }).order('token').range(from, to))

  const messages: PushMessage[] = devices.map(device => {
    const language = asLang(device.language)
    const vars = typeof out.vars === 'function' ? out.vars(language) : out.vars
    const text = render(out.event, language, vars)
    return { to: device.token, title: text.title, body: text.body, sound: 'default', data: { ...out.data, event: out.event } }
  })
  const results = await send(messages)
  const invalid = results.filter(r => r.error === 'DeviceNotRegistered').map(r => r.token)
  if (invalid.length) await db.from('push_devices').delete().in('token', invalid)
  const sentTokens = new Set(results.filter(r => r.status === 'sent').map(r => r.token))
  const reachedUsers = [...new Set(devices.filter(d => sentTokens.has(d.token)).map(d => d.user_id))]
  return { attempted: messages.length, sent: sentTokens.size, reachedUsers }
}

export async function adminUserIds(db: Db): Promise<string[]> {
  const { data } = await db.from('profiles').select('id').eq('is_admin', true)
  return ((data ?? []) as { id: string }[]).map(row => row.id)
}

export async function partnerUserIds(db: Db, partnerId: string | null | undefined): Promise<string[]> {
  if (!partnerId) return []
  const { data } = await db.from('partner_users').select('user_id').eq('partner_id', partnerId).eq('is_active', true)
  return ((data ?? []) as { user_id: string }[]).map(row => row.user_id)
}

// What a completed mission earns besides the points: a level-up wins over a milestone, and the very first
// help gets its own message. `completed` is the volunteer's number of completed missions AFTER this one.
export type Achievement = { event: 'level_up'; level: 'bronze' | 'silver' | 'gold' | 'green' } | { event: 'first_help' } | { event: 'milestone'; n: number }

export function achievementFor(completed: number): Achievement | null {
  const level = levelFor(completed)
  if (level !== 'none' && level !== levelFor(completed - 1)) return { event: 'level_up', level }
  if (completed === 1) return { event: 'first_help' }
  if (MILESTONES.includes(completed)) return { event: 'milestone', n: completed }
  return null
}
