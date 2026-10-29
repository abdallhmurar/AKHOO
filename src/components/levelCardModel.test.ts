import { describe, expect, it } from 'vitest'
import { levelCardProgress } from './levelCardModel'

describe('level card progress', () => {
  it.each([
    [0, 'none', 5, 5], [4, 'none', 5, 1],
    [5, 'bronze', 15, 10], [14, 'bronze', 15, 1],
    [15, 'silver', 30, 15], [29, 'silver', 30, 1],
    [30, 'gold', 60, 30], [42, 'gold', 60, 18], [59, 'gold', 60, 1],
    [60, 'green', 60, 0], [75, 'green', 60, 0],
  ])('shows the correct next target for %s completed assists', (count, level, target, remaining) => {
    const progress = levelCardProgress(count as number)
    expect(progress).toMatchObject({ count, level, target, remaining })
    expect(progress.fraction).toBe(Math.min((count as number) / (target as number), 1))
    expect(progress.nextLevel === null).toBe((count as number) >= 60)
  })

  it('never produces negative counts or invalid SVG geometry from invalid data', () => {
    for (const input of [-1, NaN, Infinity]) expect(levelCardProgress(input)).toMatchObject({ count: 0, fraction: 0, target: 5 })
    expect(levelCardProgress(42.9)).toMatchObject({ count: 42, remaining: 18 })
  })
})
