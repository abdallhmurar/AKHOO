import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  resolve: {
    alias: {
      'react-native': fileURLToPath(new URL('./test/react-native.ts', import.meta.url))
    }
  },
  test: {
    include: ['src/**/*.test.ts'],
    exclude: ['node_modules/**', 'e2e/**', 'dist/**']
  }
})
