import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

// Disposable regular (non-admin) account - safe to create/delete freely,
// mirrors the root project's e2e/README.md philosophy: sanad-e2e-* accounts,
// always cleaned up by email like 'sanad-e2e-%' against the linked project.
function loadEnv() {
  const env: Record<string, string> = {}
  for (const line of readFileSync('.env', 'utf8').split('\n')) {
    if (!line.includes('=')) continue
    const i = line.indexOf('=')
    env[line.slice(0, i).trim()] = line.slice(i + 1).trim()
  }
  return env
}

test('a logged-in non-admin user is denied access, never sees the shell', async ({ page }) => {
  const env = loadEnv()
  const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY)
  const email = `sanad-e2e-admindeny-${Date.now()}@example.com`
  const password = 'Test1234!'
  const { error: signUpError } = await supabase.auth.signUp({ email, password })
  expect(signUpError).toBeNull()

  // No service-role key is available client-side (by design - see
  // lib/supabase.ts), so this disposable account can't self-delete. It's
  // swept up afterward by the same `delete from auth.users where email like
  // 'sanad-e2e-%'` query used throughout this project, run manually against
  // the linked project.
  await page.goto('')
  await page.locator('#email').fill(email)
  await page.locator('#password').fill(password)
  await page.locator('button[type="submit"]').click()

  await expect(page.getByText(/access denied|الوصول مرفوض|הגישה נדחתה/i)).toBeVisible({ timeout: 10_000 })
  await expect(page.locator('nav')).toHaveCount(0)
  await expect(page.getByText(/registered users|المستخدمون المسجّلون|משתמשים רשומים/i)).toHaveCount(0)
})
