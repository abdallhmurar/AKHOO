import type { Page } from '@playwright/test'

export function requireE2EAdmin() {
  return { email: process.env.E2E_ADMIN_EMAIL, password: process.env.E2E_ADMIN_PASSWORD }
}

export async function loginAsAdmin(page: Page, email: string, password: string) {
  await page.goto('')
  await page.locator('#email').fill(email)
  await page.locator('#password').fill(password)
  await page.locator('button[type="submit"]').click()
  await page.locator('nav').waitFor({ state: 'visible', timeout: 15_000 })
}
