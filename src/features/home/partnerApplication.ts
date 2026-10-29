import { supabase } from '../../lib/supabase'
import { normalizePartnerPhone, type PartnerDraft } from './partnerBetaModel'

export type PartnerSubmitResult = 'sent' | 'rate_limited' | 'invalid' | 'failed'

// Sends the partner form to the `submit-partner-application` edge function (validated and rate limited there; the
// team gets an email and the application appears in the admin panel). Never throws: the form shows a message for
// every outcome other than 'sent'.
export async function submitPartnerApplication(
  draft: PartnerDraft,
  language: 'ar' | 'en' | 'he',
  source: 'web' | 'ios' | 'android'
): Promise<PartnerSubmitResult> {
  try {
    const { error } = await supabase.functions.invoke('submit-partner-application', {
      body: {
        business: draft.business.trim(), category: draft.category, city: draft.city.trim(),
        phone: normalizePartnerPhone(draft.phone), offer: draft.offer.trim(), language, source
      }
    })
    if (!error) return 'sent'
    const response = (error as { context?: unknown }).context
    const body = response instanceof Response ? await response.json().catch(() => null) : null
    const code = body && typeof body === 'object' ? (body as { code?: unknown }).code : undefined
    return code === 'rate_limited' ? 'rate_limited' : code === 'invalid' ? 'invalid' : 'failed'
  } catch {
    return 'failed'
  }
}
