import { test, expect } from '@playwright/test'

// The language picker itself only lives on the authenticated Account
// screen, so these tests drive language selection the way the app's own
// detectDeviceLanguage() does - via the browser/OS locale - rather than
// requiring a real login. This still exercises the real code path (src/lib/
// i18n.ts) and covers the AR/HE/EN + RTL/LTR matrix without touching
// Supabase.

test.describe('language detection + RTL/LTR', () => {
  test('defaults to Arabic (RTL) with no stored preference and no matching browser locale', async ({ browser }) => {
    const context = await browser.newContext({ locale: 'fr-FR' })
    const page = await context.newPage()
    await page.goto('/')
    await expect(page.getByText('تسجيل الدخول', { exact: true }).first()).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar')
    await context.close()
  })

  test('renders Hebrew (RTL) for a he-IL browser locale', async ({ browser }) => {
    const context = await browser.newContext({ locale: 'he-IL' })
    const page = await context.newPage()
    await page.goto('/')
    await expect(page.getByText('התחברות', { exact: true }).first()).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
    await expect(page.locator('html')).toHaveAttribute('lang', 'he')
    await context.close()
  })

  test('renders English (LTR) for an en-US browser locale', async ({ browser }) => {
    const context = await browser.newContext({ locale: 'en-US' })
    const page = await context.newPage()
    await page.goto('/')
    await expect(page.getByText('Log In', { exact: true }).first()).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr')
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await context.close()
  })
})
