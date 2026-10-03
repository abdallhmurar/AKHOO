export type ContentTranslations = Partial<Record<'ar' | 'he' | 'en', Record<string, string>>>

export function contentLanguage(language: string | undefined): 'ar' | 'he' | 'en' {
  const base = language?.split(/[-_]/)[0]
  return base === 'en' || base === 'he' ? base : 'ar'
}

// A translation is valid only for the exact source text it was made from.
// Older clients can still edit originals without ever showing stale translations.
export function contentText(source: string | null | undefined, translations: ContentTranslations | undefined, field: string, language: string | undefined): string {
  const original = source ?? ''
  const locale = contentLanguage(language)
  if (locale === 'ar' || translations?.ar?.[field] !== original) return original
  const translated = translations?.[locale]?.[field]
  return typeof translated === 'string' && translated.trim() ? translated : original
}

export function localizeContent<T extends { translations?: ContentTranslations }>(record: T, language: string | undefined, fields: readonly (keyof T & string)[]): T {
  const localized = { ...record }
  for (const field of fields) {
    const source = record[field]
    if (typeof source === 'string') localized[field] = contentText(source, record.translations, field, language) as T[typeof field]
  }
  return localized
}

export const OFFER_TEXT_FIELDS = ['title', 'description', 'terms', 'offer_type_label'] as const
export const ANNOUNCEMENT_TEXT_FIELDS = ['title', 'body', 'details'] as const
