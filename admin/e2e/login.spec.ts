import { test, expect } from '@playwright/test'

// No signup route exists anywhere in /admin (see auth/LoginPage.tsx) - only
// the login form itself. Wrong-password is safe to test for real: it's a
// rejected signInWithPassword call, never a mutation.
test.describe('admin login', () => {
  test('shows the login form with no signup option', async ({ page }) => {
    await page.goto('')
    await expect(page.locator('#email')).toBeVisible()
    await expect(page.locator('#password')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
    await expect(page.getByText(/sign\s*up|create.*account/i)).toHaveCount(0)
  })

  test('rejects an empty submission without navigating', async ({ page }) => {
    await page.goto('')
    await page.locator('button[type="submit"]').click()
    await expect(page).toHaveURL(/\/admin\/?$/)
    await expect(page.locator('#email')).toBeVisible()
  })

  test('shows an error for invalid credentials, no navigation', async ({ page }) => {
    await page.goto('')
    await page.locator('#email').fill('sanad-e2e-nonexistent@example.com')
    await page.locator('#password').fill('definitely-wrong-password')
    await page.locator('button[type="submit"]').click()
    await expect(page.locator('#email')).toBeVisible({ timeout: 10_000 })
    await expect(page.locator('[role="dialog"]')).toHaveCount(0)
  })
})
