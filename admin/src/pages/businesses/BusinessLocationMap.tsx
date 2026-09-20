import { useEffect, useRef } from 'react'
import { Map as MaplibreMap, Marker } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { colors } from '@/lib/theme'
import { MAP_STYLE_URL } from '@/lib/mapProvider'

const FALLBACK_CENTER: [number, number] = [35.2137, 31.7683] // Jerusalem pilot market, matches mobile's MAP_FALLBACK_CENTER

// Round logo with a small tail whose tip sits on the coordinate (the marker is
// anchored at its bottom). If the image fails to load, the gold circle behind
// it stays visible instead of a broken-image icon.
function createLogoElement(logoUrl: string) {
  const wrap = document.createElement('div')
  wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;filter:drop-shadow(0 2px 3px rgba(0,0,0,.45))'

  const circle = document.createElement('div')
  circle.style.cssText = `position:relative;width:46px;height:46px;border-radius:9999px;overflow:hidden;background:${colors.sand};border:3px solid #fff`
  const img = document.createElement('img')
  img.src = logoUrl
  img.alt = ''
  img.draggable = false
  img.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover'
  img.onerror = () => { img.style.display = 'none' }
  circle.appendChild(img)

  const tail = document.createElement('div')
  tail.style.cssText = 'width:0;height:0;margin-top:-2px;border-left:7px solid transparent;border-right:7px solid transparent;border-top:9px solid #fff'

  wrap.append(circle, tail)
  return wrap
}

function createMarker(map: MaplibreMap, lngLat: [number, number], logoUrl: string | null, draggable: boolean) {
  const marker = logoUrl
    ? new Marker({ element: createLogoElement(logoUrl), anchor: 'bottom', draggable })
    : new Marker({ color: colors.sand, draggable })
  return marker.setLngLat(lngLat).addTo(map)
}

// editable=true: click anywhere on the map to move the marker and report
// the new coordinates back via onChange - the same MapLibre instance used
// read-only in requests/RequestMap.tsx, extended with a click handler.
// logoUrl: shown as the marker (falls back to the default gold pin when the
// business has no logo).
export function BusinessLocationMap({
  latitude,
  longitude,
  logoUrl = null,
  editable = false,
  onChange
}: {
  latitude: number | null
  longitude: number | null
  logoUrl?: string | null
  editable?: boolean
  onChange?: (lat: number, lng: number) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MaplibreMap | null>(null)
  const markerRef = useRef<Marker | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const logoUrlRef = useRef(logoUrl)
  logoUrlRef.current = logoUrl
  const appliedLogoRef = useRef(logoUrl)

  function placeMarker(map: MaplibreMap, lngLat: [number, number]) {
    const marker = createMarker(map, lngLat, logoUrlRef.current, editable)
    if (editable) {
      marker.on('dragend', () => {
        const pos = marker.getLngLat()
        onChangeRef.current?.(pos.lat, pos.lng)
      })
    }
    appliedLogoRef.current = logoUrlRef.current
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

  // In the edit form the logo can be uploaded/changed while the map is open;
  // swap the marker in place (same position) instead of rebuilding the map.
  useEffect(() => {
    const map = mapRef.current
    const marker = markerRef.current
    if (!map || !marker || appliedLogoRef.current === logoUrl) return
    const pos = marker.getLngLat()
    marker.remove()
    placeMarker(map, [pos.lng, pos.lat])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logoUrl])

  return (
    <div>
      <div ref={containerRef} className="h-64 w-full overflow-hidden rounded-lg border border-border" />
    </div>
  )
}
