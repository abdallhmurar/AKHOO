import { test, expect } from '@playwright/test'
import { requireE2EAdmin, loginAsAdmin } from './helpers'

// Desktop/tablet-first per the given scope - phone widths are deliberately
// not tested here (see the plan's "Explicitly OUT of Round 1 scope").
const widths = [1024, 1280, 1440, 1920]

test.describe('responsive layout - no horizontal overflow', () => {
  for (const width of widths) {
    test(`login screen fits within ${width}px wide viewport`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.goto('')
      await expect(page.locator('#email')).toBeVisible()
      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth
      }))
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1)
    })
  }

  const { email, password } = requireE2EAdmin()
  for (const width of widths) {
    test(`dashboard fits within ${width}px wide viewport`, async ({ page }) => {
      test.skip(!email, 'requires E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD - see admin/e2e/README.md')
      await page.setViewportSize({ width, height: 900 })
      await loginAsAdmin(page, email!, password!)
      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth
      }))
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1)
    })
  }
})
