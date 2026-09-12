import { describe, expect, it } from 'vitest'
import { telHref, whatsappHref, directionsHref } from './contactLinks'

describe('telHref', () => {
  it('normalizes a local Israeli number', () => {
    expect(telHref('050-123-4567')).toBe('tel:+972501234567')
  })

  it('falls back to a digits-only strip for an unparseable value', () => {
    expect(telHref('not a phone')).toBe('tel:')
  })
})

describe('whatsappHref', () => {
  it('builds a wa.me link without the leading plus', () => {
    expect(whatsappHref('050-123-4567')).toBe('https://wa.me/972501234567')
  })
})

describe('directionsHref', () => {
  it('builds a Google Maps search URL from coordinates', () => {
    expect(directionsHref(31.7683, 35.2137)).toBe('https://www.google.com/maps/search/?api=1&query=31.7683,35.2137')
  })

  it('defaults to Google Maps when no app is given', () => {
    expect(directionsHref(31.7683, 35.2137, 'google')).toBe('https://www.google.com/maps/search/?api=1&query=31.7683,35.2137')
  })

  it('builds a Waze navigation URL when waze is selected', () => {
    expect(directionsHref(31.7683, 35.2137, 'waze')).toBe('https://waze.com/ul?ll=31.7683,35.2137&navigate=yes')
  })
})
