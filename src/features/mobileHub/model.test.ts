import { describe, expect, it } from 'vitest'
import type { PartnerOffer } from '../../types'
import type { ActivityEntry } from '../../repositories/activityRepository'
import { offersWithinBalance, periodStart, visibleActivity } from './model'

describe('mobile hub filters', () => {
  it('includes free and exact-balance offers without treating an unavailable balance as zero', () => {
    const offers = [0, 200, 320, 321].map(points => ({ id: String(points), points_required: points }) as PartnerOffer)
    expect(offersWithinBalance(offers, 320, true).map(offer => offer.id)).toEqual(['0', '200', '320'])
    expect(offersWithinBalance(offers, 0, true).map(offer => offer.id)).toEqual(['0'])
    expect(offersWithinBalance(offers, null, true)).toEqual(offers)
    expect(offersWithinBalance(offers, 0, false)).toEqual(offers)
    expect(offers).toHaveLength(4)
  })

  it('uses the local calendar month across year and leap-day boundaries', () => {
    for (const now of [new Date(2027, 0, 1, 0, 1), new Date(2028, 1, 29, 23, 59)]) {
      const start = new Date(periodStart('month', now)!)
      expect([start.getFullYear(), start.getMonth(), start.getDate(), start.getHours()]).toEqual([now.getFullYear(), now.getMonth(), 1, 0])
    }
    expect(periodStart('all')).toBeNull()
  })

  it('filters before selecting the latest three and keeps the full filtered history accessible', () => {
    const entries = ['points', 'received', 'given', 'given', 'points', 'given', 'given'].map((type, id) => ({ id: String(id), type }) as ActivityEntry)
    expect(visibleActivity(entries, 'given', false).map(entry => entry.id)).toEqual(['2', '3', '5'])
    expect(visibleActivity(entries, 'given', true)).toHaveLength(4)
    expect(visibleActivity(entries, 'points', true).map(entry => entry.id)).toEqual(['0', '4'])
    expect(visibleActivity(entries, 'all', true)).toEqual(entries)
    expect(visibleActivity([], 'all', true)).toEqual([])
  })
})
