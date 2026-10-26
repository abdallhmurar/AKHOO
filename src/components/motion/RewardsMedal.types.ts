import type { ActivityLevel } from '../../lib/activityLevel'
export type RewardsMedalProps = { level: ActivityLevel; size: number; active: boolean; label: string }
export const REWARD_METALS: Record<ActivityLevel, string> = { none: '#a1b2c1', bronze: '#c48c58', silver: '#d1dce7', gold: '#edc56b', green: '#4fbe94' }
export function medalHint(language: string) {
  return language.startsWith('ar') ? 'اضغط لتدوير الميدالية' : language.startsWith('he') ? 'לחצו לסיבוב המדליה' : 'Tap to spin the medal'
}
