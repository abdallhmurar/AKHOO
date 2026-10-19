import { describe, expect, it, vi } from 'vitest'
import { BUSINESS_TEXT_FIELDS, contentText, localizeContent, OFFER_TEXT_FIELDS } from '../../shared/contentTranslations'
import { translateArabic, translateText, translationFields, userTextRequest } from '../../supabase/functions/_shared/translation'

describe('localized published content', () => {
  const translations = { ar: { title: 'هدية' }, en: { title: 'Gift' }, he: { title: 'מתנה' } }
  it('switches language without changing the original and rejects stale translations', () => {
    const offer = { title: 'هدية', description: null, terms: null, offer_type_label: null, translations }
    expect(localizeContent(offer, 'he-IL', OFFER_TEXT_FIELDS).title).toBe('מתנה')
    expect(localizeContent(offer, 'en', OFFER_TEXT_FIELDS).title).toBe('Gift')
    expect(offer.title).toBe('هدية')
    expect(contentText('عرض جديد', translations, 'title', 'en')).toBe('عرض جديد')
    expect(contentText('هدية', undefined, 'title', 'en')).toBe('هدية')
    expect(contentText('هدية', translations, 'title', 'ar')).toBe('هدية')
    expect(contentText('هدية', translations, 'title', 'fr')).toBe('هدية')
  })
  it('localizes business name, description, address and service area and ignores stale text', () => {
    const business = {
      name: 'المحامي موطي أورنج', description: 'محامي سير', address: null, service_area: 'القدس',
      translations: {
        ar: { name: 'المحامي موطي أورنج', description: 'محامي سير', address: '', service_area: 'القدس' },
        he: { name: 'עו"ד מוטי אורנג\'', description: 'עורך דין תעבורה', address: '', service_area: 'ירושלים' },
        en: { name: 'Attorney Moti Orange', description: 'Traffic lawyer', address: '', service_area: 'Jerusalem' }
      }
    }
    expect(localizeContent(business, 'he', BUSINESS_TEXT_FIELDS)).toMatchObject({ name: 'עו"ד מוטי אורנג\'', service_area: 'ירושלים', address: null })
    expect(localizeContent(business, 'en-US', BUSINESS_TEXT_FIELDS).name).toBe('Attorney Moti Orange')
    expect(localizeContent(business, 'ar', BUSINESS_TEXT_FIELDS).name).toBe('المحامي موطي أورنج')
    expect(localizeContent({ ...business, name: 'اسم جديد' }, 'he', BUSINESS_TEXT_FIELDS).name).toBe('اسم جديد')
    expect(localizeContent({ ...business, translations: undefined }, 'he', BUSINESS_TEXT_FIELDS).name).toBe('المحامي موطي أورنج')
    const once = localizeContent(business, 'he', BUSINESS_TEXT_FIELDS)
    expect(localizeContent(once, 'he', BUSINESS_TEXT_FIELDS).name).toBe(once.name)
  })
  it('restricts input fields and sizes before calling a provider', () => {
    expect(translationFields({ kind: 'business', fields: { name: 'مطعم', phone: '0501234567' } })).toEqual({ name: 'مطعم', description: '', address: '', service_area: '' })
    expect(translationFields({ kind: 'offer', fields: { title: 'هدية', user_id: 'private' } })).toEqual({ title: 'هدية', description: '', terms: '', offer_type_label: '' })
    expect(() => translationFields({ kind: 'unknown', fields: {} })).toThrow()
    expect(() => translationFields({ kind: 'support', fields: { body: 3 } })).toThrow()
    expect(() => translationFields({ kind: 'support', fields: { body: 'a'.repeat(20001) } })).toThrow()
  })
  it('translates both target languages as plain text and preserves empty fields', async () => {
    const request = vi.fn(async (_url: string | URL | Request, options?: RequestInit) => {
      const input = JSON.parse(String(options?.body))
      expect(input).toMatchObject({ q: ['هدية'], source: 'ar', format: 'text' })
      return Response.json({ data: { translations: [{ translatedText: input.target === 'en' ? 'Gift' : 'מתנה' }] } })
    })
    expect(await translateArabic({ title: 'هدية', body: '' }, 'test-key', request)).toEqual({ ar: { title: 'هدية', body: '' }, en: { title: 'Gift', body: '' }, he: { title: 'מתנה', body: '' } })
    expect(request).toHaveBeenCalledTimes(2)
  })
  it('validates user text translation requests and detects the source language', async () => {
    expect(userTextRequest({ text: 'مرحبا', target: 'he', extra: 'ignored' })).toEqual({ text: 'مرحبا', target: 'he' })
    expect(() => userTextRequest({ text: '   ', target: 'en' })).toThrow()
    expect(() => userTextRequest({ text: 'a'.repeat(1501), target: 'en' })).toThrow()
    expect(() => userTextRequest({ text: 'hi', target: 'fr' })).toThrow()
    const request = vi.fn(async (_url: string | URL | Request, options?: RequestInit) => {
      expect(JSON.parse(String(options?.body))).toEqual({ q: ['hello'], target: 'ar', format: 'text' })
      return Response.json({ data: { translations: [{ translatedText: 'مرحبا', detectedSourceLanguage: 'iw' }] } })
    })
    expect(await translateText('hello', 'ar', 'key', request)).toEqual({ text: 'مرحبا', detected: 'he' })
    await expect(translateText('hello', 'ar', 'key', async () => Response.json({ data: { translations: [] } }))).rejects.toThrow('Incomplete')
  })
  it('never treats a failed or partial provider response as successful translation', async () => {
    await expect(translateArabic({ body: 'أهلاً' }, 'test', async () => new Response('', { status: 429 }))).rejects.toThrow('unavailable')
    await expect(translateArabic({ body: 'أهلاً' }, 'test', async () => Response.json({ data: { translations: [] } }))).rejects.toThrow('Incomplete')
  })
})
