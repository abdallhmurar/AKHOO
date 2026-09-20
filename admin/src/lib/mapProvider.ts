import { setWorkerUrl } from 'maplibre-gl'

// Mirrors ../../../src/lib/mapProvider.ts's single source of truth for the
// map tile/style provider.
export const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty'

// Every map component imports this module, so this runs before any map is
// created. Production only: the files it points at are emitted by the
// maplibre-worker-assets plugin in vite.config.ts (see the comment there
// for why the default lookup fails in a built bundle).
if (import.meta.env.PROD) setWorkerUrl(`${import.meta.env.BASE_URL}maplibre/maplibre-gl-worker.mjs`)
