import { test, expect } from '@playwright/test'

// Checks the auth screen (the one screen reachable with no login) doesn't
// overflow horizontally at any of the required breakpoints. A stretched
// mobile layout or a broken max-width on desktop reliably shows up as
// scrollWidth exceeding the viewport width.
const widths = [390, 430, 768, 1024, 1440, 1920]

test.describe('responsive layout - no horizontal overflow', () => {
  for (const width of widths) {
    test(`auth screen fits within ${width}px wide viewport`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.goto('/')
      await expect(page.getByPlaceholder('you@example.com')).toBeVisible()
      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth
      }))
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1)
    })
  }
})
