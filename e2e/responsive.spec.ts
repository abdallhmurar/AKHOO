import { test, expect } from '@playwright/test'

test.use({ locale: 'en-US' })

const widths = [390, 430, 768, 1024, 1440]

test.describe('responsive Civic Signal auth layout', () => {
  for (const width of widths) {
    test(`login fits a ${width}px viewport`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.goto('/login')
      await expect(page.getByText('Welcome back')).toBeVisible()
      const dimensions = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth
      }))
      expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1)
    })
  }
})
