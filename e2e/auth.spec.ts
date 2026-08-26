import { test, expect } from '@playwright/test'

// Client-only checks: invalid forms are never submitted to Supabase.
test.use({ locale: 'en-US' })

test.describe('SANAD V2 authentication', () => {
  test('renders the rebuilt login experience', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByText('Welcome back', { exact: true })).toBeVisible()
    await expect(page.getByLabel('Email address')).toBeVisible()
    await expect(page.getByRole('textbox', { name: 'Password' })).toBeVisible()
  })

  test('validates an empty login without a backend mutation', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: 'Continue securely' }).click()
    await expect(page.getByText('Enter your email and password')).toBeVisible()
    await expect(page).toHaveURL(/\/login$/)
  })

  test('navigates between login, signup, and password recovery', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('link', { name: 'Create account' }).click()
    await expect(page.getByText('Create your SANAD identity')).toBeVisible()
    await page.getByRole('button', { name: 'Back' }).last().click()
    await page.getByRole('link', { name: 'Forgot password?' }).click()
    await expect(page.getByText('Reset your password')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Send reset link' })).toBeVisible()
  })

  test('validates the complete signup form before submission', async ({ page }) => {
    await page.goto('/signup')
    await page.getByLabel('Full name').fill('Jerusalem Test User')
    await page.getByLabel('Phone number').fill('123')
    await page.getByLabel('Email address').fill('test@example.com')
    await page.getByRole('textbox', { name: 'Password' }).fill('short')
    await page.getByRole('button', { name: 'Create account' }).click()
    await expect(page.getByText('Check every field. Password needs 8 characters and a number.')).toBeVisible()
    await expect(page).toHaveURL(/\/signup$/)
  })
})
