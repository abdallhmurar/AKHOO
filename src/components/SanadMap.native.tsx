import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native'
import { Camera, Map, Marker } from '@maplibre/maplibre-react-native'
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
  const center: [number, number] = [longitude, latitude]

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
      >
        <Camera initialViewState={{ center, zoom }} />
        <Marker lngLat={center}>
          <View style={styles.pin} />
        </Marker>
        {markers?.map(marker => (
          <Marker key={marker.id} id={marker.id} lngLat={[marker.longitude, marker.latitude]} onPress={() => onMarkerPress?.(marker.id)}>
            <View style={styles.requestPin} />
          </Marker>
        ))}
      </Map>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { borderRadius: radius.md, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, marginTop: 12 },
  map: { flex: 1, backgroundColor: colors.sageSoft },
  pin: { width: 16, height: 16, borderRadius: 8, backgroundColor: colors.forest, borderWidth: 3, borderColor: '#fff' },
  requestPin: { width: 18, height: 18, borderRadius: 9, backgroundColor: colors.sand, borderWidth: 3, borderColor: '#fff' }
})
