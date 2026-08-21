import { test, expect } from '@playwright/test'

// Every route lives under the RequireAdmin layout route (App.tsx) - an
// unauthenticated visit renders LoginPage in place rather than issuing a
// redirect, so protected content (AdminShell/pages) is asserted to never
// mount at all, not just that the URL changes.
// No leading slash - an absolute path would resolve against the server
// root (baseURL's origin), discarding the /admin/ base path segment
// entirely (confirmed: Vite's dev server 302s bare `/` to `/admin/` but
// hard-404s e.g. `/requests`). A bare relative segment resolves correctly
// against the baseURL's own directory instead.
const protectedPaths = ['requests', 'users', 'volunteers', 'points']

test.describe('protected routes', () => {
  for (const path of protectedPaths) {
    test(`unauthenticated visit to ${path} shows login, not the admin shell`, async ({ page }) => {
      await page.goto(path)
      await expect(page.locator('#email')).toBeVisible()
      await expect(page.locator('nav')).toHaveCount(0)
    })
  }
})
