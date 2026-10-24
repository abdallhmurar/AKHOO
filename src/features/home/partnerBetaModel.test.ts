import { describe, expect, it } from 'vitest'
import { emptyPartnerDraft, normalizePartnerPhone, partnerDraftErrors, partnerHomeLayout } from './partnerBetaModel'
import { partnerBetaCopy } from './partnerBetaCopy'

describe('partner beta form', () => {
  const valid = { business: 'Sample business', category: 0, city: 'Jerusalem', phone: '+972 50-123-4567', offer: '' }
  it('accepts local, international and Arabic/Indic phone digits', () => {
    for (const phone of ['0501234567', '+972 (50) 123-4567', '+٩٧٢ ٥٠ ١٢٣ ٤٥٦٧', '+۹۷۲ ۵۰ ۱۲۳ ۴۵۶۷']) {
      expect(partnerDraftErrors({ ...valid, phone })).toEqual([])
    }
    expect(normalizePartnerPhone('+٩٧٢ ٥٠ ١٢٣ ٤٥٦٧')).toBe('+972501234567')
  })
  it('rejects missing details, malformed numbers and out-of-range categories', () => {
    expect(partnerDraftErrors(emptyPartnerDraft)).toEqual(['business', 'category', 'city', 'phone'])
    for (const phone of ['123', '0000000000', 'call0501234567', '1234567890123456', '+972+501234567']) {
      expect(partnerDraftErrors({ ...valid, phone })).toContain('phone')
    }
    expect(partnerDraftErrors({ ...valid, category: 5 })).toContain('category')
    expect(partnerDraftErrors({ ...valid, business: '  ', city: ' ' })).toEqual(['business', 'city'])
  })
  it('keeps all approved FAQs and preview disclosures available in three languages', () => {
    for (const copy of Object.values(partnerBetaCopy)) {
      expect(copy.faq).toHaveLength(4)
      expect(copy.categories).toHaveLength(5)
      expect(copy.notice.length).toBeGreaterThan(20)
      expect(Object.keys(copy).sort()).toEqual(Object.keys(partnerBetaCopy.ar).sort())
    }
  })
})

describe('home fits after safe areas and tab bar', () => {
  for (const height of [300, 380, 440, 500, 600, 740, 1000]) {
    for (const mission of [false, true]) {
      it(`fits ${height}px with mission=${mission}`, () => {
        const layout = partnerHomeLayout(height, mission, 1)
        const total = layout.banner + layout.rewards + layout.resume + layout.card * 2 + layout.gap * (mission ? 4 : 3)
        expect(total).toBeLessThanOrEqual(height)
        expect(layout.card).toBeGreaterThanOrEqual(44)
      })
    }
  }
  it('switches to compact actions for larger text', () => {
    expect(partnerHomeLayout(600, true, 1.4).compact).toBe(true)
    expect(partnerHomeLayout(600, true, 2).minimal).toBe(true)
  })
})
