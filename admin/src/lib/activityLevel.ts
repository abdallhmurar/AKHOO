// Deliberate duplicate of ../../../src/lib/activityLevel.ts. Cross-project
// imports aren't possible between two separately-deployed npm packages
// (mobile Expo app vs this admin), so the presentation constants below are
// copied - but the *number* they're derived from is never duplicated: it
// always comes from the server (get_volunteer_completed_count / the bulk
// admin_volunteer_completed_counts RPC in
// supabase/migrations/0014_admin_audit_log.sql), never stored or
// self-reported. If these thresholds/colors ever change, update both files.

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
