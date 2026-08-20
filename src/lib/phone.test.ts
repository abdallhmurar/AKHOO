import { describe, expect, it } from 'vitest'
import { normalizePhone } from './phone'

describe('normalizePhone', () => {
  it('normalizes a valid Israeli mobile number to E.164', () => {
    expect(normalizePhone('050-1234567')).toBe('+972501234567')
  })

  it('accepts a number already in E.164 form', () => {
    expect(normalizePhone('+972501234567')).toBe('+972501234567')
  })

  it('normalizes a valid Jordanian number when explicitly given that default country', () => {
    expect(normalizePhone('0791234567', 'JO')).toBe('+962791234567')
  })

  it('rejects an obviously too-short number', () => {
    expect(normalizePhone('123')).toBeNull()
  })

  it('rejects non-numeric garbage', () => {
    expect(normalizePhone('not a phone number')).toBeNull()
  })

  it('rejects an empty string', () => {
    expect(normalizePhone('')).toBeNull()
  })
})
