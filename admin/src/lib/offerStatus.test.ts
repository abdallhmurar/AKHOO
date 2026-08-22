import { describe, it, expect } from 'vitest'
import { effectiveOfferStatus } from './offerStatus'

describe('effectiveOfferStatus', () => {
  it('reports approved offers as expired once valid_until has passed', () => {
    const yesterday = new Date(Date.now() - 86_400_000).toISOString()
    expect(effectiveOfferStatus('approved', yesterday)).toBe('expired')
  })

  it('keeps approved offers approved while still within their window', () => {
    const tomorrow = new Date(Date.now() + 86_400_000).toISOString()
    expect(effectiveOfferStatus('approved', tomorrow)).toBe('approved')
  })

  it('keeps approved offers approved when valid_until is null (unbounded)', () => {
    expect(effectiveOfferStatus('approved', null)).toBe('approved')
  })

  it('never reports a non-approved status as expired, regardless of date', () => {
    const yesterday = new Date(Date.now() - 86_400_000).toISOString()
    expect(effectiveOfferStatus('draft', yesterday)).toBe('draft')
    expect(effectiveOfferStatus('rejected', yesterday)).toBe('rejected')
    expect(effectiveOfferStatus('paused', yesterday)).toBe('paused')
  })
})
