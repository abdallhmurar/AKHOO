export const guidePages = {
  home: ['home.request', 'home.help', 'home.perks', 'navigation'],
  request: ['request.services', 'request.next'],
  details: ['details.note', 'details.photo', 'request.next'],
  location: ['location.position', 'request.next'],
  helper: ['helper.availability', 'helper.map', 'helper.nearby'],
  perks: ['perks.points', 'perks.offers'],
  activity: ['activity.stats', 'activity.filters', 'activity.history'],
  account: ['account.profile', 'account.settings', 'account.guide']
} as const
export type GuidePage = keyof typeof guidePages
export type GuideState = { user_id: string; enabled: boolean; progress: Partial<Record<GuidePage, { step: number; status: 'active' | 'done' | 'skipped' }>> }
export function pendingGuideStep(state: GuideState | null | undefined, page: GuidePage | null): number | null {
  if (!state?.enabled || !page) return null
  // Introduce the app on Home before showing contextual page tours.
  if (page !== 'home' && state.progress.home?.status !== 'done') return null
  const saved = state.progress[page]
  if (saved?.status === 'done' || saved?.status === 'skipped') return null
  return Math.max(0, Math.min(saved?.step ?? 0, guidePages[page].length - 1))
}
