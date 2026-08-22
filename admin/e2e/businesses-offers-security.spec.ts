import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

// Always-on, no admin account required - proves the server-side authority
// (not the UI) is what blocks a non-admin, mirroring non-admin-denial.spec.ts's
// exact philosophy. Disposable sanad-e2e-* account only, never touches real
// data - every RPC call here is expected to fail with "Not authorized"
// before it would ever reach a real row.
function loadEnv() {
  const env: Record<string, string> = {}
  for (const line of readFileSync('.env', 'utf8').split('\n')) {
    if (!line.includes('=')) continue
    const i = line.indexOf('=')
    env[line.slice(0, i).trim()] = line.slice(i + 1).trim()
  }
  return env
}

test('a non-admin cannot call any Round 2 admin RPC or read the audit log', async () => {
  const env = loadEnv()
  const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY)
  const email = `sanad-e2e-r2security-${Date.now()}@example.com`
  const password = 'Test1234!'
  const { error: signUpError } = await supabase.auth.signUp({ email, password })
  expect(signUpError).toBeNull()

  const nilId = '00000000-0000-0000-0000-000000000000'

  const businessResult = await supabase.rpc('admin_upsert_business', { p_id: null, p_payload: { name: 'x', category: 'other' } })
  expect(businessResult.error?.message).toMatch(/not authorized/i)

  const activeResult = await supabase.rpc('admin_set_business_active', { p_id: nilId, p_active: false })
  expect(activeResult.error?.message).toMatch(/not authorized/i)

  const offerResult = await supabase.rpc('admin_upsert_offer', { p_id: null, p_payload: { business_id: nilId, title: 'x', discount_type: 'fixed', discount_value: 1 } })
  expect(offerResult.error?.message).toMatch(/not authorized/i)

  const offerStatusResult = await supabase.rpc('admin_set_offer_status', { p_id: nilId, p_status: 'approved' })
  expect(offerStatusResult.error?.message).toMatch(/not authorized/i)

  const reviewResult = await supabase.rpc('admin_set_review_hidden', { p_id: nilId, p_hidden: true })
  expect(reviewResult.error?.message).toMatch(/not authorized/i)

  const auditResult = await supabase.from('admin_audit_log').select('*').limit(1)
  expect(auditResult.error).toBeNull()
  expect(auditResult.data).toEqual([])
})
