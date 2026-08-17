import { useEffect, useRef } from 'react'
import { StyleSheet, View } from 'react-native'
import { Map, Marker } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { colors, radius } from '../lib/theme'
import { MAP_DEFAULT_ZOOM, MAP_STYLE_URL } from '../lib/mapProvider'

export function SanadMap({ latitude, longitude, height = 160 }: { latitude: number; longitude: number; height?: number }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<Map | null>(null)
  const markerRef = useRef<Marker | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const map = new Map({
      container: containerRef.current,
      style: MAP_STYLE_URL,
      center: [longitude, latitude],
      zoom: MAP_DEFAULT_ZOOM,
      interactive: false
    })
    mapRef.current = map
    markerRef.current = new Marker({ color: colors.forest }).setLngLat([longitude, latitude]).addTo(map)
    return () => {
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

  return (
    <View style={[styles.wrap, { height }]}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { borderRadius: radius.md, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, marginTop: 12, backgroundColor: colors.sageSoft }
})
