import { test, expect } from '@playwright/test'
import { requireE2EAdmin, loginAsAdmin } from './helpers'

// Requires a real admin test account - see e2e/README.md. Read-only: visits
// each Round 2 page and asserts it renders (translated headers, no console
// errors) without ever creating/mutating a real business, offer, or review.
const { email, password } = requireE2EAdmin()

test.describe('businesses / offers / reviews / map pages render', () => {
  test.skip(!email, 'requires E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD - see admin/e2e/README.md')

  const pages = [
    { path: 'businesses', heading: /businesses|الأعمال التجارية|עסקים/i },
    { path: 'offers', heading: /offers|العروض|מבצעים/i },
    { path: 'reviews', heading: /reviews|التقييمات|ביקורות/i },
    { path: 'map', heading: /operations map|خريطة العمليات|מפת פעילות/i }
  ]

  for (const { path, heading } of pages) {
    test(`${path} renders with no console errors`, async ({ page }) => {
      const errors: string[] = []
      page.on('console', msg => {
        if (msg.type() === 'error') errors.push(msg.text())
      })

      await loginAsAdmin(page, email!, password!)
      await page.goto(path)
      await expect(page.getByRole('heading', { name: heading })).toBeVisible({ timeout: 10_000 })
      expect(errors).toEqual([])
    })
  }

  test('businesses "add" form renders every section with no console errors', async ({ page }) => {
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })

    await loginAsAdmin(page, email!, password!)
    await page.goto('businesses/new')
    await expect(page.locator('#name')).toBeVisible({ timeout: 10_000 })
    await expect(page.locator('.maplibregl-canvas')).toBeVisible()
    expect(errors).toEqual([])
  })

  test('offers "add" form renders the live preview with no console errors', async ({ page }) => {
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })

    await loginAsAdmin(page, email!, password!)
    await page.goto('offers/new')
    await expect(page.locator('#title')).toBeVisible({ timeout: 10_000 })
    expect(errors).toEqual([])
  })
})
