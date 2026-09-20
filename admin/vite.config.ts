import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// maplibre-gl v6 loads its web worker as a separate file resolved next to
// the bundle (new URL('./maplibre-gl-worker.mjs', import.meta.url)), and that
// worker imports ./maplibre-gl-shared.mjs by relative path. The bundler
// never emits either file, so in a production build the worker request
// falls through to index.html and every map renders blank (background
// only, no tiles). Emitting both, unhashed and side by side, from the
// installed package keeps them version-matched with no committed copies;
// src/lib/mapProvider.ts points setWorkerUrl at them.
function maplibreWorkerAssets(): Plugin {
  const dist = path.resolve(__dirname, 'node_modules/maplibre-gl/dist')
  return {
    name: 'maplibre-worker-assets',
    generateBundle() {
      for (const file of ['maplibre-gl-worker.mjs', 'maplibre-gl-shared.mjs']) {
        this.emitFile({ type: 'asset', fileName: `maplibre/${file}`, source: readFileSync(path.join(dist, file)) })
      }
    }
  }
}

// Overridable per-build via VITE_BASE_PATH (same pattern as the mobile
// app's EXPO_WEB_BASE_PATH), so this stays deployable at its own domain
// root later without hardcoding today's GitHub Pages subpath.
export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? '/admin/',
  plugins: [react(), maplibreWorkerAssets()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 5173
  }
})
