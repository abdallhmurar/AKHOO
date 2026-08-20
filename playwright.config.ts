import { defineConfig, devices } from '@playwright/test'

// Committed, CI-safe web E2E suite (see e2e/README.md for what this does and
// does NOT cover - anything that mutates real Supabase data is deliberately
// left out of the committed suite; those are exercised via throwaway
// disposable-account scripts against the linked project instead, never
// baked into a suite that runs unattended against production data).
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:8090',
    trace: 'retain-on-failure'
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npx expo start --web --port 8090',
    url: 'http://localhost:8090',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  }
})
