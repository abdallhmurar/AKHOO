import { useEffect, useRef } from 'react'
import { Map as MaplibreMap, Marker } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { colors } from '@/lib/theme'
import { MAP_STYLE_URL } from '@/lib/mapProvider'

export function RequestMap({ latitude, longitude }: { latitude: number; longitude: number }) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const map = new MaplibreMap({
      container: containerRef.current,
      style: MAP_STYLE_URL,
      center: [longitude, latitude],
      zoom: 14
    })
    new Marker({ color: colors.sand }).setLngLat([longitude, latitude]).addTo(map)
    return () => map.remove()
  }, [latitude, longitude])

  return <div ref={containerRef} className="h-72 w-full overflow-hidden rounded-lg border border-border" />
}
