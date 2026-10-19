import { supabase } from '../lib/supabase'
import { contentLanguage } from '../../shared/contentTranslations'

export type UserTextTranslation = { status: 'translated'; text: string } | { status: 'same' } | { status: 'limited' | 'unavailable' }

// Only successful results are remembered, for this app session; they are never persisted.
const MAX_CACHED = 100
const cache = new Map<string, UserTextTranslation>()

// Text written by other users is sent to the translation service only when the reader taps
// "Translate" on that specific text.
export async function translateUserText(text: string, language: string | undefined): Promise<UserTextTranslation> {
  const target = contentLanguage(language)
  const key = `${target}\n${text}`
  const cached = cache.get(key)
  if (cached) return cached
  try {
    const { data, error } = await supabase.functions.invoke('translate-user-text', { body: { text, target } })
    if (error) return { status: (error as { context?: { status?: number } }).context?.status === 429 ? 'limited' : 'unavailable' }
    let result: UserTextTranslation
    if (data?.status === 'translated' && typeof data.text === 'string' && data.text.trim()) result = { status: 'translated', text: data.text }
    else if (data?.status === 'same') result = { status: 'same' }
    else return { status: data?.status === 'limited' ? 'limited' : 'unavailable' }
    if (cache.size >= MAX_CACHED) cache.delete(cache.keys().next().value!)
    cache.set(key, result)
    return result
  } catch {
    return { status: 'unavailable' }
  }
}

export function clearUserTextTranslationCache() {
  cache.clear()
}
