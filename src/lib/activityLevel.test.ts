import { describe, expect, it } from 'vitest'
import { getVolunteerActivityLevel } from './activityLevel'

describe('getVolunteerActivityLevel', () => {
  it('returns none for 0 completed assists', () => {
    expect(getVolunteerActivityLevel(0)).toBe('none')
  })

  it('returns none up through 4 (the day before bronze)', () => {
    expect(getVolunteerActivityLevel(4)).toBe('none')
  })

  it('returns bronze starting at 5', () => {
    expect(getVolunteerActivityLevel(5)).toBe('bronze')
  })

  it('stays bronze up through 14', () => {
    expect(getVolunteerActivityLevel(14)).toBe('bronze')
  })

  it('returns silver starting at 15', () => {
    expect(getVolunteerActivityLevel(15)).toBe('silver')
  })

  it('stays silver up through 29', () => {
    expect(getVolunteerActivityLevel(29)).toBe('silver')
  })

  it('returns gold starting at 30', () => {
    expect(getVolunteerActivityLevel(30)).toBe('gold')
  })

  it('stays gold up through 59', () => {
    expect(getVolunteerActivityLevel(59)).toBe('gold')
  })

  it('returns green starting at 60', () => {
    expect(getVolunteerActivityLevel(60)).toBe('green')
  })

  it('stays green for very large counts', () => {
    expect(getVolunteerActivityLevel(500)).toBe('green')
  })
})
