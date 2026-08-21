import { defineConfig, devices } from '@playwright/test'
import { existsSync, readFileSync } from 'node:fs'

// Loads admin/.env.e2e (gitignored) if present - see e2e/README.md for the
// one-time manual setup this depends on. Absent on a fresh clone/CI: the
// gated specs self-skip via test.skip(!process.env.E2E_ADMIN_EMAIL, ...).
if (existsSync('.env.e2e')) {
  for (const line of readFileSync('.env.e2e', 'utf8').split('\n')) {
    if (!line.includes('=') || line.trim().startsWith('#')) continue
    const i = line.indexOf('=')
    const key = line.slice(0, i).trim()
    const value = line.slice(i + 1).trim()
    if (key) process.env[key] ??= value
  }
}

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5174/admin/',
    trace: 'retain-on-failure'
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npx vite --port 5174',
    url: 'http://localhost:5174/admin/',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000
  }
})
