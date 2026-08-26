import { test, expect } from '@playwright/test'

// Client-only checks: invalid forms are never submitted to Supabase.
test.use({ locale: 'en-US' })

test.describe('SANAD authentication', () => {
  test('renders the real login screen', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('button', { name: 'Log In' })).toBeVisible()
    await expect(page.getByText('Welcome back.')).toBeVisible()
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Password', { exact: true })).toBeVisible()
  })

  test('validates an empty login without a backend mutation', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: 'Log In' }).click()
    await expect(page.getByText('Enter your email.')).toBeVisible()
    await expect(page).toHaveURL(/\/login$/)
  })

  test('navigates between login, signup, and password recovery', async ({ page }) => {
    await page.goto('/login')
    await page.getByText('Create one').click()
    await expect(page.getByText('Start your journey of helping and giving.')).toBeVisible()
    await page.goto('/login')
    await page.getByText('Forgot your password?').click()
    await expect(page.getByText('Forgot Password?', { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Send Reset Link' })).toBeVisible()
    await page.getByRole('button', { name: 'Back' }).click()
    await expect(page).toHaveURL(/\/login$/)
  })

  test('validates the signup form before submission', async ({ page }) => {
    await page.goto('/signup')
    await page.getByLabel('Full Name').fill('Jerusalem Test User')
    await page.getByLabel('Phone Number').fill('123')
    await page.getByLabel('Email').fill('test@example.com')
    await page.getByLabel('Password', { exact: true }).fill('short')
    await page.getByRole('button', { name: 'Create Account' }).click()
    await expect(page.getByText('Invalid phone number.')).toBeVisible()
    await expect(page.getByText('Password must be at least 6 characters.')).toBeVisible()
    await expect(page).toHaveURL(/\/signup$/)
  })
})
