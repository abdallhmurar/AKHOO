import { describe, expect, it, vi } from 'vitest'
import { contentText, localizeContent, OFFER_TEXT_FIELDS } from '../../shared/contentTranslations'
import { translateArabic, translationFields } from '../../supabase/functions/_shared/translation'

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
  it('restricts input fields and sizes before calling a provider', () => {
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
  it('never treats a failed or partial provider response as successful translation', async () => {
    await expect(translateArabic({ body: 'أهلاً' }, 'test', async () => new Response('', { status: 429 }))).rejects.toThrow('unavailable')
    await expect(translateArabic({ body: 'أهلاً' }, 'test', async () => Response.json({ data: { translations: [] } }))).rejects.toThrow('Incomplete')
  })
})
