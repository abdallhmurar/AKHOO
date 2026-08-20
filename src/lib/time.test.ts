import { describe, expect, it } from 'vitest'
import { formatElapsed } from './time'

const t = ((key: string, options?: Record<string, unknown>) => {
  if (!options) return key
  return `${key}:${options.count ?? options.hours ?? ''}${options.minutes !== undefined ? '/' + options.minutes : ''}`
}) as any

describe('formatElapsed', () => {
  it('reports "less than a minute" for anything under 60s', () => {
    expect(formatElapsed(30_000, t)).toBe('activeRequest.elapsed.lessThanMinute')
  })

  it('reports whole minutes under an hour', () => {
    expect(formatElapsed(5 * 60_000, t)).toBe('activeRequest.elapsed.minutes:5')
  })

  it('reports whole hours with no remainder minutes', () => {
    expect(formatElapsed(2 * 3_600_000, t)).toBe('activeRequest.elapsed.hours:2')
  })

  it('reports hours and minutes when there is a remainder', () => {
    expect(formatElapsed(2 * 3_600_000 + 15 * 60_000, t)).toBe('activeRequest.elapsed.hoursAndMinutes:2/15')
  })

  it('never returns a negative duration for a negative input (clock skew guard)', () => {
    expect(formatElapsed(-5000, t)).toBe('activeRequest.elapsed.lessThanMinute')
  })
})
