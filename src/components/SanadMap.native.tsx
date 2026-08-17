import { StyleSheet, View } from 'react-native'
import { Camera, Map, Marker } from '@maplibre/maplibre-react-native'
import { colors, radius } from '../lib/theme'
import { MAP_DEFAULT_ZOOM, MAP_STYLE_URL } from '../lib/mapProvider'

export function SanadMap({ latitude, longitude, height = 160 }: { latitude: number; longitude: number; height?: number }) {
  const center: [number, number] = [longitude, latitude]

  return (
    <View style={[styles.wrap, { height }]}>
      <Map mapStyle={MAP_STYLE_URL} style={styles.map} dragPan={false} touchZoom={false} touchRotate={false} touchPitch={false} doubleTapZoom={false}>
        <Camera initialViewState={{ center, zoom: MAP_DEFAULT_ZOOM }} />
        <Marker lngLat={center}>
          <View style={styles.pin} />
        </Marker>
      </Map>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { borderRadius: radius.md, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, marginTop: 12 },
  map: { flex: 1, backgroundColor: colors.sageSoft },
  pin: { width: 16, height: 16, borderRadius: 8, backgroundColor: colors.forest, borderWidth: 3, borderColor: '#fff' }
})
