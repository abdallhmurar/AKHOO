import { useEffect, useRef } from 'react'
import { Map as MaplibreMap } from 'maplibre-gl'
import type { Marker } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { MAP_STYLE_URL } from '@/lib/mapProvider'
import { createBusinessMarker } from '@/lib/mapMarkers'

const FALLBACK_CENTER: [number, number] = [35.2137, 31.7683] // Jerusalem pilot market, matches mobile's MAP_FALLBACK_CENTER

// editable=true: click anywhere on the map to move the marker and report
// the new coordinates back via onChange - the same MapLibre instance used
// read-only in requests/RequestMap.tsx, extended with a click handler.
// logoUrl/name: the marker shows the business's logo, or its first letter
// when there is none (see lib/mapMarkers.ts).
export function BusinessLocationMap({
  latitude,
  longitude,
  logoUrl = null,
  name = '',
  editable = false,
  onChange
}: {
  latitude: number | null
  longitude: number | null
  logoUrl?: string | null
  name?: string
  editable?: boolean
  onChange?: (lat: number, lng: number) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MaplibreMap | null>(null)
  const markerRef = useRef<Marker | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const businessRef = useRef({ logoUrl, name })
  businessRef.current = { logoUrl, name }
  const appliedRef = useRef({ logoUrl, name })

  function placeMarker(map: MaplibreMap, lngLat: [number, number]) {
    const marker = createBusinessMarker(map, lngLat, businessRef.current, editable)
    if (editable) {
      marker.on('dragend', () => {
        const pos = marker.getLngLat()
        onChangeRef.current?.(pos.lat, pos.lng)
      })
    }
    appliedRef.current = businessRef.current
    markerRef.current = marker
  }

  useEffect(() => {
    if (!containerRef.current) return
    const center: [number, number] = latitude != null && longitude != null ? [longitude, latitude] : FALLBACK_CENTER
    const map = new MaplibreMap({ container: containerRef.current, style: MAP_STYLE_URL, center, zoom: 13 })
    mapRef.current = map

    if (latitude != null && longitude != null) placeMarker(map, [longitude, latitude])

    if (editable) {
      map.on('click', event => {
        const { lng, lat } = event.lngLat
        if (markerRef.current) markerRef.current.setLngLat([lng, lat])
        else placeMarker(map, [lng, lat])
        onChangeRef.current?.(lat, lng)
      })
    }

    return () => map.remove()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editable])

  // In the edit form the logo (or the name, which drives the fallback
  // letter) can change while the map is open; swap the marker in place at
  // the same position instead of rebuilding the map.
  useEffect(() => {
    const map = mapRef.current
    const marker = markerRef.current
    if (!map || !marker) return
    if (appliedRef.current.logoUrl === logoUrl && appliedRef.current.name.trim()[0] === name.trim()[0]) return
    const pos = marker.getLngLat()
    marker.remove()
    placeMarker(map, [pos.lng, pos.lat])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logoUrl, name])

  return (
    <div>
      <div ref={containerRef} className="h-64 w-full overflow-hidden rounded-lg border border-border" />
    </div>
  )
}
