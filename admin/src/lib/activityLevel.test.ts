import { describe, it, expect } from 'vitest'
import { getVolunteerActivityLevel } from './activityLevel'

describe('getVolunteerActivityLevel', () => {
  it.each([
    [0, 'none'],
    [4, 'none'],
    [5, 'bronze'],
    [14, 'bronze'],
    [15, 'silver'],
    [29, 'silver'],
    [30, 'gold'],
    [59, 'gold'],
    [60, 'green'],
    [1000, 'green']
  ] as const)('%i completed assists -> %s', (count, expected) => {
    expect(getVolunteerActivityLevel(count)).toBe(expected)
  })
})
