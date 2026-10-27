import { describe, expect, it } from 'vitest'
import { treeGrowth } from './impactTreeGrowth'

describe('impact tree progression', () => {
  it('keeps a visible seedling for a new helper and bounds invalid input', () => {
    const seedling = treeGrowth(0)
    expect(seedling.trunk).toBeGreaterThan(0)
    expect(seedling.crown).toBeGreaterThan(0)
    expect(seedling.left).toBe(0)
    expect(seedling.right).toBe(0)
    for (const count of [-10, NaN, Infinity]) expect(treeGrowth(count)).toEqual(seedling)
  })
  it('grows monotonically without resetting at a rank boundary', () => {
    let previous = treeGrowth(0)
    for (let count = 1; count <= 80; count++) {
      const current = treeGrowth(count)
      for (const key of Object.keys(current) as (keyof typeof current)[]) {
        expect(current[key]).toBeGreaterThanOrEqual(previous[key])
        expect(current[key]).toBeLessThanOrEqual(1)
      }
      previous = current
    }
    expect(treeGrowth(42).left).toBe(1)
    expect(treeGrowth(42).right).toBe(1)
    expect(treeGrowth(60)).toEqual(treeGrowth(100000))
  })
})
