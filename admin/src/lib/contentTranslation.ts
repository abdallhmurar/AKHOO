import { toast } from 'sonner'
import i18next from 'i18next'
import { supabase } from './supabase'
import type { ContentTranslations } from '../../../shared/contentTranslations'

export async function translateForPublish(kind: 'offer' | 'announcement' | 'support', fields: Record<string, string | null | undefined>, existing?: ContentTranslations): Promise<ContentTranslations> {
  const source = Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, value ?? '']))
  if (!Object.values(source).some(value => value.trim())) return {}
  if (existing && ['en', 'he'].every(language => Object.entries(source).every(([key, value]) => existing.ar?.[key] === value && (!value.trim() || typeof existing[language as 'en' | 'he']?.[key] === 'string' && !!existing[language as 'en' | 'he']?.[key]?.trim())))) return existing
  const { data, error } = await supabase.functions.invoke('translate-content', { body: { kind, fields: source } })
  if (error) throw new Error(i18next.t('contentTranslation.failed'))
  if (data?.status === 'not_configured') {
    toast.warning(i18next.t('contentTranslation.notConfigured'), { duration: 9000 })
    return {}
  }
  if (data?.status !== 'translated' || !data.translations?.en || !data.translations?.he) throw new Error(i18next.t('contentTranslation.failed'))
  return data.translations as ContentTranslations
}
