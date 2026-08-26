import { assistanceCategories as localCategories, assistanceScenarios as localScenarios } from '../domain/v2'
import { filterNearbyRequests } from '../lib/nearbyRequests'
import { supabase } from '../lib/supabase'
import { isMissingDatabaseObject, normalizeAppError, throwIfError } from '../services/errors'
import type { HelpRequest, ServiceType } from '../types'
import type { AssistanceCategory, AssistanceScenario, CivicRequestDraft } from './domainTypes'

function fallbackCategoryRows(): AssistanceCategory[] {
  return localCategories.map((category, index) => ({
    id: category.id,
    slug: category.id.replaceAll('_', '-'),
    name_ar: category.label.ar,
    name_he: category.label.he,
    name_en: category.label.en,
    description_ar: category.description.ar,
    description_he: category.description.he,
    description_en: category.description.en,
    icon: category.icon,
    color: null,
    sort_order: index,
    is_active: true
  }))
}

function fallbackScenarioRows(categories: AssistanceCategory[]): AssistanceScenario[] {
  const idBySlug = new Map(categories.map(category => [category.slug.replaceAll('-', '_'), category.id]))
  return localScenarios.map((scenario, index) => ({
    id: scenario.id,
    category_id: idBySlug.get(scenario.categoryId) ?? scenario.categoryId,
    slug: scenario.id,
    name_ar: scenario.label.ar,
    name_he: scenario.label.he,
    name_en: scenario.label.en,
    description_ar: scenario.description.ar,
    description_he: scenario.description.he,
    description_en: scenario.description.en,
    emergency_level: scenario.requiresEmergencyScreening ? 'screen' : 'none',
    requires_details: true,
    allows_media: true,
    sort_order: index,
    is_active: true
  }))
}

export const requestRepository = {
  async listCategories(): Promise<AssistanceCategory[]> {
    const { data, error } = await supabase.from('categories').select('*').eq('is_active', true).order('sort_order')
    if (error) {
      if (isMissingDatabaseObject(error)) return fallbackCategoryRows()
      throw normalizeAppError(error, { domain: 'requests', operation: 'list-categories' })
    }
    return (data ?? []) as AssistanceCategory[]
  },

  async listScenarios(categoryId?: string): Promise<AssistanceScenario[]> {
    let query = supabase.from('scenarios').select('*').eq('is_active', true).order('sort_order')
    if (categoryId) query = query.eq('category_id', categoryId)
    const { data, error } = await query
    if (error) {
      if (isMissingDatabaseObject(error)) {
        const categories = fallbackCategoryRows()
        const rows = fallbackScenarioRows(categories)
        return categoryId ? rows.filter(row => row.category_id === categoryId) : rows
      }
      throw normalizeAppError(error, { domain: 'requests', operation: 'list-scenarios' })
    }
    return (data ?? []) as AssistanceScenario[]
  },

  async create(input: CivicRequestDraft): Promise<HelpRequest> {
    const payload = {
      p_category_id: input.categoryId,
      p_scenario_id: input.scenarioId,
      p_details: input.details,
      p_urgency: input.urgency,
      p_latitude: input.latitude,
      p_longitude: input.longitude,
      p_location_accuracy: input.locationAccuracy ?? null,
      p_location_label: input.locationLabel ?? null,
      p_media_paths: input.mediaPaths ?? []
    }
    const { data, error } = await supabase.rpc('create_civic_request', payload)
    if (!error && data) {
      const value = Array.isArray(data) ? data[0] : data
      return value as HelpRequest
    }
    if (error && !isMissingDatabaseObject(error)) throw normalizeAppError(error, { domain: 'requests', operation: 'create' })

    const legacyPayload = {
      requester_id: input.requesterId,
      service_type: (input.legacyServiceType ?? 'other') as ServiceType,
      note: input.details,
      latitude: input.latitude,
      longitude: input.longitude
    }
    const fallback = await supabase.from('help_requests').insert(legacyPayload).select('*').single()
    throwIfError(fallback.error, { domain: 'requests', operation: 'create-legacy' })
    return fallback.data as HelpRequest
  },

  async listForRequester(userId: string, limit = 50): Promise<HelpRequest[]> {
    const { data, error } = await supabase.from('help_requests').select('*').eq('requester_id', userId).order('created_at', { ascending: false }).limit(limit)
    throwIfError(error, { domain: 'requests', operation: 'list-requester' })
    return (data ?? []) as HelpRequest[]
  },

  async get(requestId: string): Promise<HelpRequest | null> {
    const { data, error } = await supabase.from('help_requests').select('*').eq('id', requestId).maybeSingle()
    throwIfError(error, { domain: 'requests', operation: 'get' })
    return data as HelpRequest | null
  },

  async listForHelper(userId: string, limit = 50): Promise<HelpRequest[]> {
    const { data, error } = await supabase.from('help_requests').select('*').eq('volunteer_id', userId).order('created_at', { ascending: false }).limit(limit)
    throwIfError(error, { domain: 'requests', operation: 'list-helper' })
    return (data ?? []) as HelpRequest[]
  },

  async listNearby(userId: string, at: { latitude: number; longitude: number }, radiusKm = 20) {
    const { data, error } = await supabase.from('help_requests').select('*').eq('status', 'open').order('created_at', { ascending: false }).limit(100)
    throwIfError(error, { domain: 'requests', operation: 'list-nearby' })
    return filterNearbyRequests((data ?? []) as HelpRequest[], userId, at, radiusKm)
  },

  async cancel(requestId: string) {
    const { error } = await supabase.rpc('cancel_help_request', { p_request_id: requestId })
    throwIfError(error, { domain: 'requests', operation: 'cancel' })
  }
}
