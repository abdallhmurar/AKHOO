import { supabase } from '../lib/supabase'
import { isMissingDatabaseObject, normalizeAppError, throwIfError } from '../services/errors'
import type { ServiceType, VolunteerProfile } from '../types'
import type { HelperSkill, SupportedLanguage } from './domainTypes'

export type HelperSetup = {
  skills: { categoryId: string; scenarioId?: string | null }[]
  languages: SupportedLanguage[]
}

export const helperRepository = {
  async getProfile(userId: string): Promise<VolunteerProfile | null> {
    const { data, error } = await supabase.from('volunteer_profiles').select('*').eq('user_id', userId).maybeSingle()
    throwIfError(error, { domain: 'helpers', operation: 'get-profile' })
    return data as VolunteerProfile | null
  },

  async skills(userId: string): Promise<HelperSkill[]> {
    const { data, error } = await supabase.from('helper_skills').select('*').eq('helper_id', userId)
    if (error && isMissingDatabaseObject(error)) return []
    throwIfError(error, { domain: 'helpers', operation: 'skills' })
    return (data ?? []) as HelperSkill[]
  },

  async languages(userId: string): Promise<SupportedLanguage[]> {
    const { data, error } = await supabase.from('helper_languages').select('language').eq('helper_id', userId)
    if (error && isMissingDatabaseObject(error)) return []
    throwIfError(error, { domain: 'helpers', operation: 'languages' })
    return (data ?? []).map(row => row.language as SupportedLanguage)
  },

  async saveSetup(userId: string, setup: HelperSetup) {
    const { error } = await supabase.rpc('save_helper_setup', {
      p_skills: setup.skills.map(item => ({ category_id: item.categoryId, scenario_id: item.scenarioId ?? null })),
      p_languages: setup.languages
    })
    if (!error) return
    if (!isMissingDatabaseObject(error)) throw normalizeAppError(error, { domain: 'helpers', operation: 'save-setup' })

    // V1 compatibility: keep the established volunteer profile alive while
    // the additive V2 migration is being rolled out.
    const legacyServices: ServiceType[] = ['other']
    const legacy = await supabase.from('volunteer_profiles').upsert({ user_id: userId, services: legacyServices })
    throwIfError(legacy.error, { domain: 'helpers', operation: 'save-setup-legacy' })
  },

  async setAvailability(userId: string, available: boolean, location?: { latitude: number; longitude: number }, pushToken?: string | null) {
    const payload: Record<string, unknown> = {
      user_id: userId,
      is_available: available,
      updated_at: new Date().toISOString()
    }
    if (location) {
      payload.latitude = location.latitude
      payload.longitude = location.longitude
    }
    if (pushToken) payload.push_token = pushToken
    const { error } = await supabase.from('volunteer_profiles').upsert(payload)
    throwIfError(error, { domain: 'helpers', operation: 'set-availability' })
  },

  async heartbeat(userId: string, location?: { latitude: number; longitude: number }) {
    const changes: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (location) Object.assign(changes, location)
    const { error } = await supabase.from('volunteer_profiles').update(changes).eq('user_id', userId)
    throwIfError(error, { domain: 'helpers', operation: 'heartbeat', silent: true })
  }
}
