// Single source of truth for volunteer Activity Star thresholds - never
// duplicate these numbers in a component. The level is always derived from
// a real confirmed-completed-mission count (see
// get_volunteer_completed_count in supabase/migrations/
// 0013_volunteer_activity_and_release.sql), never stored or self-reported.

export type ActivityLevel = 'none' | 'bronze' | 'silver' | 'gold' | 'green'

export function getVolunteerActivityLevel(completedCount: number): ActivityLevel {
  if (completedCount >= 60) return 'green'
  if (completedCount >= 30) return 'gold'
  if (completedCount >= 15) return 'silver'
  if (completedCount >= 5) return 'bronze'
  return 'none'
}

export const ACTIVITY_LEVEL_THRESHOLDS: Record<Exclude<ActivityLevel, 'none'>, number> = {
  bronze: 5,
  silver: 15,
  gold: 30,
  green: 60
}

export const ACTIVITY_LEVEL_COLORS: Record<ActivityLevel, string> = {
  none: 'transparent',
  bronze: '#B08D57',
  silver: '#9AA3AB',
  gold: '#D4B06A',
  green: '#315E48'
}

export const ACTIVITY_LEVEL_LABEL_KEYS: Record<ActivityLevel, string> = {
  none: '',
  bronze: 'activityLevel.bronze',
  silver: 'activityLevel.silver',
  gold: 'activityLevel.gold',
  green: 'activityLevel.green'
}
