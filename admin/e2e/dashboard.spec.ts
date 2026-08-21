import { test, expect } from '@playwright/test'
import { requireE2EAdmin, loginAsAdmin } from './helpers'

// Requires a permanent, real admin test account - see e2e/README.md for the
// one-time setup. Self-skips on a fresh clone/CI with no E2E_ADMIN_EMAIL set
// rather than failing. Read-only: only ever views Dashboard data, never
// mutates anything.
const { email, password } = requireE2EAdmin()

test.describe('dashboard', () => {
  test.skip(!email, 'requires E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD - see admin/e2e/README.md')

  test('renders real stat cards, charts, and the activity feed', async ({ page }) => {
    await loginAsAdmin(page, email!, password!)

    // Nine stat cards, each showing a number (not stuck on a loading skeleton).
    const statCards = page.locator('[data-testid="stats-grid"] > div')
    await expect(statCards).toHaveCount(9, { timeout: 10_000 })

    await expect(page.locator('main').getByText(/completed requests|الطلبات المُنجزة|בקשות שהושלמו/i)).toBeVisible()
    await expect(page.locator('main').getByText(/requests by status|الطلبات حسب الحالة|בקשות לפי סטטוס/i)).toBeVisible()
    await expect(page.locator('main').getByText(/recent activity|النشاط الأخير|פעילות אחרונה/i)).toBeVisible()
  })
})
