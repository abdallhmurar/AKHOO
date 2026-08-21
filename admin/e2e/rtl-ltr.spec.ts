import { test, expect } from '@playwright/test'
import { requireE2EAdmin, loginAsAdmin } from './helpers'

// The Login page is reachable with no account, so the AR/HE/EN + RTL/LTR
// matrix is always tested against it. The authenticated dir/sidebar-mirror
// check additionally needs a real admin account and self-skips without one.
test.describe('language detection + RTL/LTR', () => {
  test('defaults to Arabic (RTL) with no stored preference and no matching browser locale', async ({ browser }) => {
    const context = await browser.newContext({ locale: 'fr-FR' })
    const page = await context.newPage()
    await page.goto('')
    await expect(page.getByText('تسجيل الدخول', { exact: true }).first()).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar')
    await context.close()
  })

  test('renders Hebrew (RTL) for a he-IL browser locale', async ({ browser }) => {
    const context = await browser.newContext({ locale: 'he-IL' })
    const page = await context.newPage()
    await page.goto('')
    await expect(page.getByText('התחברות', { exact: true }).first()).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
    await expect(page.locator('html')).toHaveAttribute('lang', 'he')
    await context.close()
  })

  test('renders English (LTR) for an en-US browser locale', async ({ browser }) => {
    const context = await browser.newContext({ locale: 'en-US' })
    const page = await context.newPage()
    await page.goto('')
    await expect(page.getByText('Sign in', { exact: true }).first()).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr')
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await context.close()
  })

  const { email, password } = requireE2EAdmin()
  test('authenticated dashboard mirrors the sidebar for RTL vs LTR', async ({ browser }) => {
    test.skip(!email, 'requires E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD - see admin/e2e/README.md')
    // Explicit locale, same as the unauthenticated tests above - without it
    // the starting language depends on the test runner's own default
    // browser locale (not this app's behavior), which isn't deterministic.
    const context = await browser.newContext({ locale: 'ar-SA' })
    const page = await context.newPage()
    await loginAsAdmin(page, email!, password!)
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
    const sidebarBoxRTL = await page.locator('aside').boundingBox()
    expect(sidebarBoxRTL?.x).toBeGreaterThan(800)

    await page.locator('header button:visible').first().click()
    await page.getByRole('menuitem', { name: 'English' }).click()
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr')
    const sidebarBoxLTR = await page.locator('aside').boundingBox()
    expect(sidebarBoxLTR?.x).toBeLessThan(50)
    await context.close()
  })
})
