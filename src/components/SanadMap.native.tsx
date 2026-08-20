import { useEffect, useImperativeHandle, useRef, useState } from 'react'
import { ActivityIndicator, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native'
import { Camera, Map, Marker } from '@maplibre/maplibre-react-native'
import type { CameraRef } from '@maplibre/maplibre-react-native'
import { useTranslation } from 'react-i18next'
import { colors, radius } from '../lib/theme'
import { MAP_DEFAULT_ZOOM, MAP_FALLBACK_CENTER, MAP_FIT_BOUNDS_MAX_ZOOM, estimateZoomForSpan, MAP_STYLE_URL } from '../lib/mapProvider'
import type { SanadMapMarker, SanadMapPoint, SanadMapRef } from './SanadMap.types'

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
  const center: [number, number] = [resolved.longitude, resolved.latitude]
  const cameraRef = useRef<CameraRef>(null)
  const [styleLoaded, setStyleLoaded] = useState(false)
  const mounted = useRef(false)

  // Safety net: don't let the loading overlay get stuck indefinitely if the
  // native load/fail callbacks are ever late or skipped for some reason.
  useEffect(() => {
    const timeout = setTimeout(() => setStyleLoaded(true), 2500)
    return () => clearTimeout(timeout)
  }, [])

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      return
    }
    cameraRef.current?.easeTo({ center, zoom, duration: 600 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolved.latitude, resolved.longitude])

  useImperativeHandle(ref, () => ({
    recenter(lat, lng, targetZoom) {
      cameraRef.current?.easeTo({ center: [lng, lat], zoom: targetZoom ?? zoom, duration: 600 })
    },
    fitToMarkers(points: SanadMapPoint[]) {
      if (points.length === 0) return
      let west = points[0]!.longitude, east = points[0]!.longitude
      let south = points[0]!.latitude, north = points[0]!.latitude
      for (const point of points) {
        west = Math.min(west, point.longitude)
        east = Math.max(east, point.longitude)
        south = Math.min(south, point.latitude)
        north = Math.max(north, point.latitude)
      }
      const fitZoom = estimateZoomForSpan(north - south, east - west, MAP_FIT_BOUNDS_MAX_ZOOM)
      cameraRef.current?.easeTo({ center: [(west + east) / 2, (south + north) / 2], zoom: fitZoom, duration: 700 })
    }
  }), [])

  return (
    <View style={[styles.wrap, { height }, style]}>
      <Map
        mapStyle={MAP_STYLE_URL}
        style={styles.map}
        dragPan={interactive}
        touchZoom={interactive}
        touchRotate={interactive}
        touchPitch={interactive}
        doubleTapZoom={interactive}
        onDidFinishLoadingMap={() => setStyleLoaded(true)}
        onDidFailLoadingMap={() => setStyleLoaded(true)}
      >
        <Camera ref={cameraRef} initialViewState={{ center, zoom }} />
        <Marker lngLat={center}>
          <View style={styles.pin} />
        </Marker>
        {markers?.map(marker => (
          <Marker key={marker.id} id={marker.id} lngLat={[marker.longitude, marker.latitude]} onPress={() => onMarkerPress?.(marker.id)}>
            <View style={[styles.requestPin, marker.id === selectedId && styles.requestPinSelected]} />
          </Marker>
        ))}
      </Map>
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
  wrap: { borderRadius: radius.md, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, marginTop: 12 },
  map: { flex: 1, backgroundColor: colors.sageSoft },
  pin: { width: 16, height: 16, borderRadius: 8, backgroundColor: colors.forest, borderWidth: 3, borderColor: '#fff' },
  requestPin: { width: 18, height: 18, borderRadius: 9, backgroundColor: colors.sand, borderWidth: 3, borderColor: '#fff' },
  requestPinSelected: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.forest, borderWidth: 4 },
  loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.sageSoft, alignItems: 'center', justifyContent: 'center', gap: 8 },
  loadingText: { color: colors.forest, fontSize: 12.5, fontWeight: '700' }
})
