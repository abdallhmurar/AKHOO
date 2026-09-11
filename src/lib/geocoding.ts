// Free, keyless geocoding via OpenStreetMap's Nominatim - the natural
// complement to the OpenFreeMap tiles this app already renders with, and
// works identically on native and web (unlike expo-location's geocoding
// APIs, which expo-location itself doesn't support on web).
const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org'
const HEADERS = { Accept: 'application/json' }

export type GeocodeResult = { latitude: number; longitude: number; label: string }

export async function searchAddress(query: string, signal?: AbortSignal): Promise<GeocodeResult[]> {
  const trimmed = query.trim()
  if (trimmed.length < 3) return []
  const url = `${NOMINATIM_BASE}/search?format=json&limit=5&q=${encodeURIComponent(trimmed)}`
  const response = await fetch(url, { headers: HEADERS, signal })
  if (!response.ok) return []
  const data = (await response.json()) as { lat: string; lon: string; display_name: string }[]
  return data.map(item => ({ latitude: parseFloat(item.lat), longitude: parseFloat(item.lon), label: item.display_name }))
}

export async function reverseGeocode(latitude: number, longitude: number): Promise<string | null> {
  const url = `${NOMINATIM_BASE}/reverse?format=json&lat=${latitude}&lon=${longitude}`
  try {
    const response = await fetch(url, { headers: HEADERS })
    if (!response.ok) return null
    const data = (await response.json()) as { display_name?: string }
    return data.display_name ?? null
  } catch {
    return null
  }
}
