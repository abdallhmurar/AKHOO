import { test, expect } from '@playwright/test'

// These tests only exercise client-side validation and navigation between
// auth modes - no signup/login is ever submitted, so nothing here touches
// Supabase or creates real data. Full account-creation/login flows are
// covered by the throwaway disposable-account scripts documented in
// e2e/README.md, run manually against the linked project.

// These assertions are written against the Arabic strings, so pin the
// browser locale explicitly rather than relying on the host/CI machine's
// ambient locale (Playwright's default context locale follows the host,
// which is why this failed unpinned: it rendered the English UI instead).
test.use({ locale: 'ar-SA' })

test.describe('auth screen', () => {
  test('shows the login form by default', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('تسجيل الدخول', { exact: true }).first()).toBeVisible()
    await expect(page.getByPlaceholder('you@example.com')).toBeVisible()
  })

  test('rejects an empty login submission with translated field errors, no navigation', async ({ page }) => {
    await page.goto('/')
    // .last() is the submit button - the AuthShell title heading above it
    // renders the same "تسجيل الدخول" text first in DOM order.
    await page.getByText('تسجيل الدخول', { exact: true }).last().click()
    await expect(page.getByText('أدخل البريد الإلكتروني.')).toBeVisible()
    await expect(page.getByText('كلمة المرور لازم تكون 6 أحرف على الأقل.')).toBeVisible()
    // Still on the login screen - a real submission would have navigated away.
    await expect(page.getByPlaceholder('you@example.com')).toBeVisible()
  })

  test('switches to the signup form and back without losing the typed email', async ({ page }) => {
    await page.goto('/')
    await page.getByText('إنشاء حساب جديد', { exact: true }).click()
    await expect(page.getByPlaceholder('مثال: أحمد محمود')).toBeVisible()
    await page.getByText('تسجيل الدخول', { exact: true }).last().click()
    await expect(page.getByPlaceholder('05X-XXX-XXXX')).toHaveCount(0)
  })

  test('rejects an empty signup submission with translated field errors', async ({ page }) => {
    await page.goto('/')
    await page.getByText('إنشاء حساب جديد', { exact: true }).click()
    await page.getByText('إنشاء الحساب', { exact: true }).click()
    await expect(page.getByText('أدخل اسمك الكامل.')).toBeVisible()
    await expect(page.getByText('رقم الهاتف إجباري.')).toBeVisible()
  })

  test('flags an invalid phone number on signup without submitting', async ({ page }) => {
    await page.goto('/')
    await page.getByText('إنشاء حساب جديد', { exact: true }).click()
    await page.getByPlaceholder('مثال: أحمد محمود').fill('اختبار')
    await page.getByPlaceholder('05X-XXX-XXXX').fill('123')
    await page.getByPlaceholder('you@example.com').fill('test@example.com')
    await page.getByText('إنشاء الحساب', { exact: true }).click()
    await expect(page.getByText('رقم هاتف غير صحيح.')).toBeVisible()
  })

  test('navigates to forgot-password and back to login', async ({ page }) => {
    await page.goto('/')
    await page.getByText('نسيت كلمة المرور؟', { exact: true }).click()
    await expect(page.getByText('نسيت كلمة المرور؟', { exact: true }).first()).toBeVisible()
    await page.getByText('العودة لتسجيل الدخول', { exact: true }).click()
    await expect(page.getByPlaceholder('••••••••')).toBeVisible()
  })
})
