// Visual stages only. Rewards and rank thresholds remain in activityLevel.ts.
export function safeHelpCount(count: number) {
  return Number.isFinite(count) ? Math.max(0, count) : 0
}
export function growthBetween(count: number, start: number, end: number) {
  const x = Math.min(1, Math.max(0, (safeHelpCount(count) - start) / (end - start)))
  return x * x * (3 - 2 * x)
}
export function treeGrowth(count: number) {
  return {
    trunk: .16 + .84 * growthBetween(count, 0, 34),
    crown: .12 + .88 * growthBetween(count, 0, 42),
    left: growthBetween(count, 8, 32),
    right: growthBetween(count, 18, 42),
    fullness: .25 + .75 * growthBetween(count, 0, 60),
    sprouts: growthBetween(count, 30, 60),
  }
}
