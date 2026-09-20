import { supabase } from './supabase'
import { throwIfError } from '../services/errors'

export type GeocodeResult = { latitude: number; longitude: number; label: string }

// Explicit searches go through a cached, globally throttled server proxy.
export async function searchAddress(query: string): Promise<GeocodeResult[]> {
  if (query.trim().length < 3) return []
  const { data, error } = await supabase.functions.invoke('geocode', { body: { query: query.trim() } })
  throwIfError(error, { domain: 'location', operation: 'search' })
  if (!Array.isArray(data)) return []
  return data.map((item: { lat: string; lon: string; display_name: string }) => ({ latitude: Number(item.lat), longitude: Number(item.lon), label: item.display_name }))
    .filter(item => Number.isFinite(item.latitude) && Number.isFinite(item.longitude))
}
export async function reverseGeocode(latitude: number, longitude: number): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke('geocode', { body: { latitude, longitude } })
    return error ? null : data?.display_name ?? null
  } catch { return null }
}
