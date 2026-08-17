import { useEffect, useRef } from 'react'
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native'
import { Map as MaplibreMap, Marker } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { colors, radius } from '../lib/theme'
import { MAP_DEFAULT_ZOOM, MAP_STYLE_URL } from '../lib/mapProvider'
import type { SanadMapMarker } from './SanadMap.types'

export function SanadMap({
  latitude,
  longitude,
  height = 160,
  zoom = MAP_DEFAULT_ZOOM,
  markers,
  onMarkerPress,
  interactive = false,
  style
}: {
  latitude: number
  longitude: number
  height?: number
  zoom?: number
  markers?: SanadMapMarker[]
  onMarkerPress?: (id: string) => void
  interactive?: boolean
  style?: StyleProp<ViewStyle>
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MaplibreMap | null>(null)
  const markerRef = useRef<Marker | null>(null)
  const requestMarkersRef = useRef<Map<string, Marker>>(new Map())
  const onMarkerPressRef = useRef(onMarkerPress)
  onMarkerPressRef.current = onMarkerPress

  useEffect(() => {
    if (!containerRef.current) return
    const map = new MaplibreMap({
      container: containerRef.current,
      style: MAP_STYLE_URL,
      center: [longitude, latitude],
      zoom,
      interactive
    })
    mapRef.current = map
    markerRef.current = new Marker({ color: colors.forest }).setLngLat([longitude, latitude]).addTo(map)
    return () => {
      requestMarkersRef.current.forEach(marker => marker.remove())
      requestMarkersRef.current.clear()
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return
    mapRef.current.setCenter([longitude, latitude])
    markerRef.current.setLngLat([longitude, latitude])
  }, [latitude, longitude])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const current = requestMarkersRef.current
    const nextIds = new Set((markers ?? []).map(m => m.id))

    current.forEach((marker, id) => {
      if (!nextIds.has(id)) {
        marker.remove()
        current.delete(id)
      }
    })

    for (const item of markers ?? []) {
      const existing = current.get(item.id)
      if (existing) {
        existing.setLngLat([item.longitude, item.latitude])
        continue
      }
      const marker = new Marker({ color: colors.sand }).setLngLat([item.longitude, item.latitude]).addTo(map)
      marker.getElement().style.cursor = 'pointer'
      marker.getElement().addEventListener('click', event => {
        event.stopPropagation()
        onMarkerPressRef.current?.(item.id)
      })
      current.set(item.id, marker)
    }
  }, [markers])

  return (
    <View style={[styles.wrap, { height }, style]}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { borderRadius: radius.md, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, marginTop: 12, backgroundColor: colors.sageSoft }
})
