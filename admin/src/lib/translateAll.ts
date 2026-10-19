import { supabase } from './supabase'
import { translateForPublish } from './contentTranslation'
import type { ContentTranslations } from '../../../shared/contentTranslations'

type Row = Record<string, string | null | ContentTranslations | undefined>

const BUSINESS_FIELDS = ['name', 'description', 'address', 'service_area'] as const
const OFFER_FIELDS = ['title', 'description', 'terms', 'offer_type_label'] as const

function sourceOf(row: Row, fields: readonly string[]): Record<string, string> {
  return Object.fromEntries(fields.map(field => [field, (row[field] as string | null | undefined) ?? '']))
}

// Fills in translations for content that was published before automatic
// translation existed, or whose translation went stale. Rows that are already
// fully translated are skipped without calling the provider.
export async function translateAllContent(): Promise<{ translated: number; skipped: number; failed: number }> {
  const [businesses, offers] = await Promise.all([
    supabase.from('partners').select('id,name,description,address,service_area,translations').eq('status', 'verified'),
    supabase.from('partner_offers').select('id,title,description,terms,offer_type_label,translations').eq('status', 'approved')
  ])
  if (businesses.error) throw businesses.error
  if (offers.error) throw offers.error

  const jobs = [
    ...(businesses.data ?? []).map(row => ({ kind: 'business' as const, rpc: 'admin_set_business_translations', row: row as Row, fields: BUSINESS_FIELDS })),
    ...(offers.data ?? []).map(row => ({ kind: 'offer' as const, rpc: 'admin_set_offer_translations', row: row as Row, fields: OFFER_FIELDS }))
  ]

  let translated = 0
  let skipped = 0
  let failed = 0
  // One at a time: a few dozen rows at most, and it keeps provider load low.
  for (const job of jobs) {
    const source = sourceOf(job.row, job.fields)
    const existing = job.row.translations as ContentTranslations | undefined
    try {
      const result = await translateForPublish(job.kind, source, existing)
      if (result === existing || Object.keys(result).length === 0) { skipped += 1; continue }
      const { error } = await supabase.rpc(job.rpc, { p_id: job.row.id, p_source: source, p_translations: result })
      if (error) throw error
      translated += 1
    } catch {
      failed += 1
    }
  }
  return { translated, skipped, failed }
}
