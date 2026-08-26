import { test, expect } from '@playwright/test'

// Real SANAD: language auto-detects from the device locale and applies
// directly to the login screen - there is no mandatory first-launch
// language picker and no "welcome" splash (both were ccodex additions).
// Language stays changeable later from Account.
test.describe('language auto-detection and direction', () => {
  test('detects Arabic and renders RTL on the login screen', async ({ browser }) => {
    const context = await browser.newContext({ locale: 'ar-SA' })
    const page = await context.newPage()
    await page.goto('/login')
    await expect(page.getByText('أهلاً فيك من جديد.')).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar')
    await context.close()
  })

  test('detects Hebrew and renders RTL on the login screen', async ({ browser }) => {
    const context = await browser.newContext({ locale: 'he-IL' })
    const page = await context.newPage()
    await page.goto('/login')
    await expect(page.getByText('ברוך שובך.')).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
    await expect(page.locator('html')).toHaveAttribute('lang', 'he')
    await context.close()
  })

  test('detects English and renders LTR from the root redirect', async ({ browser }) => {
    const context = await browser.newContext({ locale: 'en-US' })
    const page = await context.newPage()
    await page.goto('/')
    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByText('Welcome back.')).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr')
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await context.close()
  })
})
