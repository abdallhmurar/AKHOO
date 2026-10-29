import { ACTIVITY_LEVEL_THRESHOLDS, getVolunteerActivityLevel } from '../lib/activityLevel'

export function levelCardProgress(completedCount: number) {
  const count = Number.isFinite(completedCount) ? Math.max(0, Math.floor(completedCount)) : 0
  const nextTarget = Object.values(ACTIVITY_LEVEL_THRESHOLDS).find(mark => mark > count)
  const target = nextTarget ?? ACTIVITY_LEVEL_THRESHOLDS.green
  return {
    count,
    target,
    level: getVolunteerActivityLevel(count),
    nextLevel: nextTarget ? getVolunteerActivityLevel(nextTarget) : null,
    remaining: Math.max(0, target - count),
    fraction: Math.min(count / target, 1),
  }
}
