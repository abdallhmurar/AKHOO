import { useEffect, useRef } from 'react'
import { Map as MaplibreMap, Marker } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { colors } from '@/lib/theme'
import { MAP_STYLE_URL } from '@/lib/mapProvider'

const FALLBACK_CENTER: [number, number] = [35.2137, 31.7683] // Jerusalem pilot market, matches mobile's MAP_FALLBACK_CENTER

// editable=true: click anywhere on the map to move the marker and report
// the new coordinates back via onChange - the same MapLibre instance used
// read-only in requests/RequestMap.tsx, extended with a click handler.
export function BusinessLocationMap({
  latitude,
  longitude,
  editable = false,
  onChange
}: {
  latitude: number | null
  longitude: number | null
  editable?: boolean
  onChange?: (lat: number, lng: number) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MaplibreMap | null>(null)
  const markerRef = useRef<Marker | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    if (!containerRef.current) return
    const center: [number, number] = latitude != null && longitude != null ? [longitude, latitude] : FALLBACK_CENTER
    const map = new MaplibreMap({ container: containerRef.current, style: MAP_STYLE_URL, center, zoom: 13 })
    mapRef.current = map

    if (latitude != null && longitude != null) {
      markerRef.current = new Marker({ color: colors.sand, draggable: editable }).setLngLat([longitude, latitude]).addTo(map)
      if (editable) {
        markerRef.current.on('dragend', () => {
          const pos = markerRef.current!.getLngLat()
          onChangeRef.current?.(pos.lat, pos.lng)
        })
      }
    }

    if (editable) {
      map.on('click', event => {
        const { lng, lat } = event.lngLat
        if (markerRef.current) {
          markerRef.current.setLngLat([lng, lat])
        } else {
          markerRef.current = new Marker({ color: colors.sand, draggable: true }).setLngLat([lng, lat]).addTo(map)
          markerRef.current.on('dragend', () => {
            const pos = markerRef.current!.getLngLat()
            onChangeRef.current?.(pos.lat, pos.lng)
          })
        }
        onChangeRef.current?.(lat, lng)
      })
    }

    return () => map.remove()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editable])

  return (
    <div>
      <div ref={containerRef} className="h-64 w-full overflow-hidden rounded-lg border border-border" />
    </div>
  )
}
