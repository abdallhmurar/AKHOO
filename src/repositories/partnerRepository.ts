import { supabase } from '../lib/supabase'
import { AppError, throwIfError } from '../services/errors'
import type { PartnerAccess } from '../types'

export const partnerRepository = {
  async activeAccess(userId: string, signal?: AbortSignal): Promise<PartnerAccess | null> {
    // The server derives the user from auth.uid(); userId is only a guard
    // against an in-flight response arriving after the local session changes.
    let query = supabase.rpc('get_my_partner_context')
    if (signal) query = query.abortSignal(signal)
    const { data, error } = await query.maybeSingle()
    throwIfError(error, { domain: 'partner', operation: 'active-access', silent: true })
    const access = data as PartnerAccess | null
    if (access && access.user_id !== userId) {
      throw new AppError('Session changed', { code: 'auth' })
    }
    return access?.is_active ? access : null
  }
}
