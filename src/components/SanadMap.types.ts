export type SanadMapMarker = { id: string; latitude: number; longitude: number }

export type SanadMapPoint = { latitude: number; longitude: number }

export type SanadMapRef = {
  /** Smoothly move the camera to a point, keeping (or setting) zoom. */
  recenter: (latitude: number, longitude: number, zoom?: number) => void
  /** Fit the camera to include every given point, capped at maxZoom. */
  fitToMarkers: (points: SanadMapPoint[], maxZoom?: number) => void
}
