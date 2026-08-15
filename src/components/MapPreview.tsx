import { StyleSheet, View } from 'react-native'
import { WebView } from 'react-native-webview'
import { colors } from '../lib/theme'

const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
const LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'

function buildHtml(latitude: number, longitude: number) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="${LEAFLET_CSS}" />
  <style>html, body, #map { height: 100%; margin: 0; padding: 0; }</style>
</head>
<body>
  <div id="map"></div>
  <script src="${LEAFLET_JS}"></script>
  <script>
    var map = L.map('map', { zoomControl: false, attributionControl: false }).setView([${latitude}, ${longitude}], 15)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map)
    L.marker([${latitude}, ${longitude}]).addTo(map)
  </script>
</body>
</html>`
}

export function MapPreview({ latitude, longitude, height = 160 }: { latitude: number; longitude: number; height?: number }) {
  return (
    <View style={[styles.wrap, { height }]}>
      <WebView
        originWhitelist={['*']}
        source={{ html: buildHtml(latitude, longitude) }}
        style={styles.web}
        scrollEnabled={false}
        javaScriptEnabled
      />
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, marginTop: 12 },
  web: { flex: 1, backgroundColor: colors.blueSoft }
})
