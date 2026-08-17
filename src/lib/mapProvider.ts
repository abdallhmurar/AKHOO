// Single source of truth for the map tile/style provider. Swapping to a
// different free provider (or self-hosted tiles) later means editing only
// this file - SanadMap.native.tsx / SanadMap.web.tsx never hardcode a URL.
export const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty'
export const MAP_DEFAULT_ZOOM = 15
