import { describe, expect, it } from 'vitest'
import { applicationEmail, normalizePhone, parsePartnerApplication } from '../../supabase/functions/_shared/partnerApplication'
import { normalizePartnerPhone, partnerDraftErrors } from '../features/home/partnerBetaModel'

const valid = { business: 'Sample business', category: 0, city: 'Jerusalem', phone: '+972 50-123-4567', offer: '', language: 'en', source: 'web' }

describe('partner application validation (server)', () => {
  it('accepts a complete application and normalizes it', () => {
    const parsed = parsePartnerApplication({ ...valid, business: '  Sample business  ', phone: '+٩٧٢ ٥٠ ١٢٣ ٤٥٦٧' })
    expect(parsed).toEqual({ ok: true, value: { business_name: 'Sample business', category: 0, city: 'Jerusalem', phone: '+972501234567', offer: '', language: 'en', source: 'web' } })
  })

  it('names the first field that is wrong', () => {
    expect(parsePartnerApplication(null)).toEqual({ ok: false, field: 'body' })
    expect(parsePartnerApplication({ ...valid, business: 'x' })).toEqual({ ok: false, field: 'business' })
    expect(parsePartnerApplication({ ...valid, category: 5 })).toEqual({ ok: false, field: 'category' })
    expect(parsePartnerApplication({ ...valid, category: '1' })).toEqual({ ok: false, field: 'category' })
    expect(parsePartnerApplication({ ...valid, city: ' ' })).toEqual({ ok: false, field: 'city' })
    expect(parsePartnerApplication({ ...valid, phone: '0000000000' })).toEqual({ ok: false, field: 'phone' })
    expect(parsePartnerApplication({ ...valid, offer: 'a'.repeat(281) })).toEqual({ ok: false, field: 'offer' })
  })

  it('falls back to Arabic and the web for unknown language or source, and strips control characters', () => {
    const parsed = parsePartnerApplication({ ...valid, language: 'fr', source: 'fax', business: 'Shop\u0000 name' })
    expect(parsed).toMatchObject({ ok: true, value: { language: 'ar', source: 'web', business_name: 'Shop name' } })
  })

  it('judges phone numbers exactly like the form does', () => {
    for (const phone of ['0501234567', '+972 (50) 123-4567', '+٩٧٢ ٥٠ ١٢٣ ٤٥٦٧', '123', '0000000000', 'call0501234567', '1234567890123456', '+972+501234567']) {
      const formAccepts = !partnerDraftErrors({ ...valid, phone }).includes('phone')
      expect(parsePartnerApplication({ ...valid, phone }).ok).toBe(formAccepts)
      expect(normalizePhone(phone)).toBe(normalizePartnerPhone(phone))
    }
  })
})

describe('partner application notification email', () => {
  it('is plain text with the details and no line breaks in the subject', () => {
    const mail = applicationEmail({ business_name: 'Shop\nBcc: x@example.com', category: 1, city: 'القدس', phone: '+972501234567', offer: 'خصم', language: 'ar', source: 'android' })
    expect(mail.subject).not.toMatch(/[\r\n]/)
    expect(mail.subject).toContain('طلب شراكة جديد')
    expect(mail.text).toContain('+972501234567')
    expect(mail.text).toContain('مطاعم وكافيهات')
    expect(mail.text).toContain('أندرويد')
  })
})
