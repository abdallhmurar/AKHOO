import { useEffect, useImperativeHandle, useRef, useState } from 'react'
import { ActivityIndicator, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native'
import { Map as MaplibreMap, Marker, setWorkerUrl } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useTranslation } from 'react-i18next'
import { colors, radius } from '../lib/theme'
import { MAP_DEFAULT_ZOOM, MAP_FALLBACK_CENTER, MAP_FIT_BOUNDS_MAX_ZOOM, MAP_FIT_BOUNDS_PADDING, MAP_STYLE_URL } from '../lib/mapProvider'
import type { SanadMapMarker, SanadMapPoint, SanadMapRef } from './SanadMap.types'

// Metro's web bundler doesn't emit maplibre-gl's worker script at the path
// the library expects by default (confirmed via a 404 on
// _expo/static/js/web/maplibre-gl-worker.mjs) - without it, maplibre-gl
// can request the style/sprites/TileJSON fine but can never parse actual
// vector tile data, so the basemap silently stays blank forever with only
// the marker visible. Point it at a copy served from public/ instead - a
// relative URL (no leading slash) so it still resolves correctly whether
// the app is hosted at a domain root or a GitHub Pages subpath. Set once
// at module load, before any Map is constructed.
setWorkerUrl('maplibre-gl-worker.mjs')

function resolveCoords(latitude: number, longitude: number) {
  if (Number.isFinite(latitude) && Number.isFinite(longitude) && (latitude !== 0 || longitude !== 0)) {
    return { latitude, longitude }
  }
  return MAP_FALLBACK_CENTER
}

export function SanadMap({
  latitude,
  longitude,
  height = 160,
  zoom = MAP_DEFAULT_ZOOM,
  markers,
  selectedId,
  onMarkerPress,
  interactive = false,
  style,
  ref
}: {
  latitude: number
  longitude: number
  height?: number
  zoom?: number
  markers?: SanadMapMarker[]
  selectedId?: string | null
  onMarkerPress?: (id: string) => void
  interactive?: boolean
  style?: StyleProp<ViewStyle>
  ref?: React.Ref<SanadMapRef>
}) {
  const { t } = useTranslation()
  const resolved = resolveCoords(latitude, longitude)
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MaplibreMap | null>(null)
  const markerRef = useRef<Marker | null>(null)
  const requestMarkersRef = useRef<Map<string, Marker>>(new Map())
  const onMarkerPressRef = useRef(onMarkerPress)
  const mounted = useRef(false)
  const [styleLoaded, setStyleLoaded] = useState(false)
  onMarkerPressRef.current = onMarkerPress

  useEffect(() => {
    if (!containerRef.current) return
    const map = new MaplibreMap({
      container: containerRef.current,
      style: MAP_STYLE_URL,
      center: [resolved.longitude, resolved.latitude],
      zoom,
      interactive
    })
    mapRef.current = map
    markerRef.current = new Marker({ color: colors.forest }).setLngLat([resolved.longitude, resolved.latitude]).addTo(map)

    let revealed = false
    function reveal() {
      if (revealed) return
      revealed = true
      // The container's flex-computed size can still be settling when the
      // map is constructed (React Native Web layout timing) - a 0-size
      // container at construction leaves maplibre-gl with a broken
      // transform that a later resize() alone doesn't always fully correct,
      // so re-resize and re-anchor once we're about to reveal the map.
      map.resize()
      map.jumpTo({ center: [resolved.longitude, resolved.latitude], zoom })
      setStyleLoaded(true)
    }
    map.on('load', reveal)
    map.on('error', event => {
      if (__DEV__) console.warn('[SanadMap] MapLibre error:', event.error)
      reveal()
    })
    // 'load' has proven unreliable in some environments (fires late or not
    // at all even though the style/tiles genuinely rendered) - a timeout
    // safety net means the loading state can never get stuck indefinitely.
    const revealTimeout = setTimeout(reveal, 2500)

    const resizeObserver = new ResizeObserver(() => map.resize())
    resizeObserver.observe(containerRef.current)

    return () => {
      clearTimeout(revealTimeout)
      resizeObserver.disconnect()
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
    markerRef.current.setLngLat([resolved.longitude, resolved.latitude])
    if (!mounted.current) {
      mounted.current = true
      return
    }
    mapRef.current.easeTo({ center: [resolved.longitude, resolved.latitude], duration: 600 })
  }, [resolved.latitude, resolved.longitude])

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
      const isSelected = item.id === selectedId
      const existing = current.get(item.id)
      const existingIsSelected = existing?.getElement().dataset.selected === 'true'

      if (existing && existingIsSelected === isSelected) {
        existing.setLngLat([item.longitude, item.latitude])
        continue
      }
      // Marker color/scale can't be changed in place once created (maplibre-gl
      // bakes them into the marker's SVG at construction) - recreate it when
      // its selected state changes. Cheap at this pilot's marker counts.
      existing?.remove()
      const marker = new Marker({ color: isSelected ? colors.forest : colors.sand, scale: isSelected ? 1.3 : 1 })
        .setLngLat([item.longitude, item.latitude])
        .addTo(map)
      marker.getElement().dataset.selected = String(isSelected)
      marker.getElement().style.cursor = 'pointer'
      marker.getElement().addEventListener('click', event => {
        event.stopPropagation()
        onMarkerPressRef.current?.(item.id)
      })
      current.set(item.id, marker)
    }
  }, [markers, selectedId])

  useImperativeHandle(ref, () => ({
    recenter(lat, lng, targetZoom) {
      mapRef.current?.easeTo({ center: [lng, lat], zoom: targetZoom ?? mapRef.current.getZoom(), duration: 600 })
    },
    fitToMarkers(points: SanadMapPoint[]) {
      const map = mapRef.current
      if (!map || points.length === 0) return
      let west = points[0]!.longitude, east = points[0]!.longitude
      let south = points[0]!.latitude, north = points[0]!.latitude
      for (const point of points) {
        west = Math.min(west, point.longitude)
        east = Math.max(east, point.longitude)
        south = Math.min(south, point.latitude)
        north = Math.max(north, point.latitude)
      }
      map.fitBounds([west, south, east, north], { maxZoom: MAP_FIT_BOUNDS_MAX_ZOOM, padding: MAP_FIT_BOUNDS_PADDING, duration: 700 })
    }
  }), [])

  return (
    <View style={[styles.wrap, { height }, style]}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      {!styleLoaded ? (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator color={colors.forest} />
          <Text style={styles.loadingText}>{t('map.loading')}</Text>
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { borderRadius: radius.md, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, marginTop: 12, backgroundColor: colors.sageSoft },
  loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.sageSoft, alignItems: 'center', justifyContent: 'center', gap: 8 },
  loadingText: { color: colors.forest, fontSize: 12.5, fontWeight: '700' }
})
