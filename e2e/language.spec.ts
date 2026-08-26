import { test, expect } from '@playwright/test'

test.describe('first launch and language direction', () => {
  test('starts in Arabic RTL', async ({ browser }) => {
    const context = await browser.newContext({ locale: 'ar-SA' })
    const page = await context.newPage()
    await page.goto('/language')
    await expect(page.getByText('اختر لغتك')).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar')
    await context.close()
  })

  test('renders Hebrew in RTL', async ({ browser }) => {
    const context = await browser.newContext({ locale: 'he-IL' })
    const page = await context.newPage()
    await page.goto('/language')
    await expect(page.getByText('בחירת שפה')).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
    await expect(page.locator('html')).toHaveAttribute('lang', 'he')
    await context.close()
  })

  test('renders English in LTR and completes first launch', async ({ browser }) => {
    const context = await browser.newContext({ locale: 'en-US' })
    const page = await context.newPage()
    await page.goto('/')
    await expect(page.getByText('Choose your language')).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr')
    await page.getByRole('radio').filter({ hasText: 'English' }).click()
    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(page.getByText('Nearby support, when you need it')).toBeVisible()
    await expect(page).toHaveURL(/\/welcome$/)
    await context.close()
  })
})
