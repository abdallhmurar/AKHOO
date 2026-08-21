import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Overridable per-build via VITE_BASE_PATH (same pattern as the mobile
// app's EXPO_WEB_BASE_PATH), so this stays deployable at its own domain
// root later without hardcoding today's GitHub Pages subpath.
export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? '/admin/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 5173
  }
})
