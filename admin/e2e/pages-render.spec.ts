import { test, expect } from '@playwright/test'
import { requireE2EAdmin, loginAsAdmin } from './helpers'

// Requires a real admin test account - see e2e/README.md. Read-only: visits
// each list page and asserts it renders (translated headers, a table, no
// console errors) without ever mutating a real row.
const { email, password } = requireE2EAdmin()

test.describe('list pages render', () => {
  test.skip(!email, 'requires E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD - see admin/e2e/README.md')

  // No leading slash - see protected-routes.spec.ts's comment for why.
  const pages = [
    { path: 'requests', heading: /requests|الطلبات|בקשות/i },
    { path: 'users', heading: /users|المستخدمون|משתמשים/i },
    { path: 'points', heading: /points|النقاط|נקודות/i }
  ]

  for (const { path, heading } of pages) {
    test(`${path} renders its table with no console errors`, async ({ page }) => {
      const errors: string[] = []
      page.on('console', msg => {
        if (msg.type() === 'error') errors.push(msg.text())
      })

      await loginAsAdmin(page, email!, password!)
      await page.goto(path)
      await expect(page.getByRole('heading', { name: heading })).toBeVisible({ timeout: 10_000 })
      await expect(page.locator('table')).toBeVisible()
      expect(errors).toEqual([])
    })
  }
})
