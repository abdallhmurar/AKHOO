import type { ContentTranslations } from '../../../shared/contentTranslations.ts'

const fieldsByKind = {
  offer: ['title', 'description', 'terms', 'offer_type_label'],
  announcement: ['title', 'body', 'details'],
  support: ['body']
} as const

export function translationFields(input: unknown): Record<string, string> {
  if (!input || typeof input !== 'object') throw new Error('Invalid translation request')
  const { kind, fields } = input as { kind?: string; fields?: unknown }
  if (!kind || !Object.hasOwn(fieldsByKind, kind) || !fields || typeof fields !== 'object' || Array.isArray(fields)) throw new Error('Invalid translation request')
  const allowed = fieldsByKind[kind as keyof typeof fieldsByKind]
  const source = fields as Record<string, unknown>
  const result: Record<string, string> = {}
  for (const field of allowed) {
    const value = source[field] ?? ''
    if (typeof value !== 'string' || value.length > 20000) throw new Error('Invalid translation text')
    result[field] = value
  }
  if (Object.values(result).join('').length > 30000) throw new Error('Translation text is too long')
  return result
}

// Plain-text mode keeps markup inert. Credentials never leave this server.
export async function translateArabic(fields: Record<string, string>, apiKey: string, request: typeof fetch = fetch): Promise<ContentTranslations> {
  const entries = Object.entries(fields).filter(([, value]) => value.trim())
  if (!entries.length) return { ar: fields, en: { ...fields }, he: { ...fields } }
  const translations = await Promise.all(['en', 'he'].map(async target => {
    const response = await request('https://translation.googleapis.com/language/translate/v2', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': apiKey },
      body: JSON.stringify({ q: entries.map(([, text]) => text), source: 'ar', target, format: 'text' }),
      signal: AbortSignal.timeout(25000)
    })
    if (!response.ok) throw new Error('Translation provider unavailable')
    const data = await response.json()
    const values: unknown = data?.data?.translations
    if (!Array.isArray(values) || values.length !== entries.length) throw new Error('Incomplete translation')
    const result = { ...fields }
    entries.forEach(([key], index) => {
      const text = values[index]?.translatedText
      if (typeof text !== 'string' || !text.trim() || text.length > 60000) throw new Error('Incomplete translation')
      result[key] = text
    })
    return [target, result] as const
  }))
  return { ar: fields, ...Object.fromEntries(translations) }
}
