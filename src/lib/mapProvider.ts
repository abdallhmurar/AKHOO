// Single source of truth for the map tile/style provider. Swapping to a
// different free provider (or self-hosted tiles) later means editing only
// this file - SanadMap.native.tsx / SanadMap.web.tsx never hardcode a URL.
export const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty'
export const MAP_DEFAULT_ZOOM = 15

// The one place a "no real coordinate available" map falls back to -
// matches the seeded Jerusalem pilot_zones row (supabase/migrations/
// 0009_jerusalem_pilot.sql). SanadMap uses this defensively if it's ever
// given a non-finite lat/lng (e.g. (0,0) "null island") instead of
// rendering a broken world-zoomed-out camera.
export const MAP_FALLBACK_CENTER = { latitude: 31.7683, longitude: 35.2137 }
export const MAP_FALLBACK_ZOOM = 13

// Used when fitting the camera to multiple markers (e.g. volunteer + nearby
// requests) - caps how far it will zoom in even for two very close points,
// and how far out for widely spread ones.
export const MAP_FIT_BOUNDS_MAX_ZOOM = 15
export const MAP_FIT_BOUNDS_PADDING = 60

// Native's imperative CameraRef.fitBounds() doesn't expose a maxZoom option
// (unlike web's maplibre-gl fitBounds), so SanadMap.native.tsx estimates a
// zoom level from the bounding box span itself instead and drives the
// camera with easeTo - an approximation, not pixel-perfect framing, but
// good enough for this purpose and keeps native/web behavior consistent
// since both are governed by the same formula.
export function estimateZoomForSpan(latSpan: number, lngSpan: number, maxZoom: number) {
  const span = Math.max(latSpan, lngSpan, 0.0005)
  const zoom = Math.log2(360 / span) - 1
  return Math.max(3, Math.min(zoom, maxZoom))
}
