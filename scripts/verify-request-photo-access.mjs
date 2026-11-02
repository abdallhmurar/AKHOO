// Opt-in hosted Storage smoke test. Creates only two temporary auth accounts and
// one synthetic image. No help request, push registration, email or user photo.
// Run after migration 0054, with a Management API token file supplied by the operator.
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { randomUUID, randomBytes, createHash } from 'node:crypto'
import { Buffer } from 'node:buffer'
import { createClient } from '@supabase/supabase-js'

const args = new Set(process.argv.slice(2))
if (!args.has('--allow-test-accounts')) throw new Error('Requires --allow-test-accounts; see the script header')
const project = process.env.SUPABASE_PROJECT_REF
const tokenFile = process.env.SUPABASE_ACCESS_TOKEN_FILE
if (!project || !/^[a-z]{20}$/.test(project) || !tokenFile) throw new Error('Set SUPABASE_PROJECT_REF and SUPABASE_ACCESS_TOKEN_FILE')
const base = `https://${project}.supabase.co`
const token = (await readFile(tokenFile, 'utf8')).trim()
const runId = randomUUID()
const created = []
let path
let admin
let storageClean = false
const result = { stage: args.has('--expect-private') ? 'private' : 'public-compatible', checks: {}, cleanup: false }
const fixture = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jV7sAAAAASUVORK5CYII=', 'base64')
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const requireOk = (condition, message) => { if (!condition) throw new Error(message) }
const client = key => createClient(base, key, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(30_000) }) }
})
async function management(route, options = {}) {
  const response = await fetch(`https://api.supabase.com/v1/projects/${project}/${route}`, {
    ...options, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(30_000)
  })
  requireOk(response.ok, `Management ${route.split('?')[0]} HTTP ${response.status}`)
  return response.json()
}
const denied = value => !!value.error && [400, 401, 403, 404].includes(Number(value.error.statusCode ?? value.error.status)) && !value.data?.signedUrl

try {
  const state = await management('database/query', { method: 'POST', body: JSON.stringify({ read_only: true,
    query: "select public, exists(select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='request photos authorized read') as policy_ready from storage.buckets where id='request-photos'" }) })
  requireOk(state[0]?.policy_ready, 'Migration 0054 is not applied')
  requireOk(state[0]?.public === !args.has('--expect-private'), 'Bucket visibility differs from the requested test stage')
  const keys = await management('api-keys')
  const service = keys.find(key => key.name === 'service_role')?.api_key
  const anon = keys.find(key => key.name === 'anon')?.api_key
  requireOk(service && anon, 'Existing server/public API keys unavailable; no keys created')
  admin = client(service)
  for (let index = 0; index < 2; index++) {
    const email = `photo-check-${runId}-${index}@example.invalid`
    const password = randomBytes(32).toString('base64url')
    const account = await admin.auth.admin.createUser({ email, password, email_confirm: true,
      user_metadata: { full_name: 'AKHOO temporary photo check', photo_check: runId } })
    requireOk(!account.error && account.data?.user?.id, `Synthetic account ${index + 1} creation failed`)
    const user = { id: account.data.user.id, api: client(anon) }
    created.push(user)
    const session = await user.api.auth.signInWithPassword({ email, password })
    requireOk(!session.error && session.data.session, `Synthetic account ${index + 1} sign-in failed`)
  }
  const [owner, outsider] = created
  path = `${owner.id}/qa-${runId}.png`
  const upload = await owner.api.storage.from('request-photos').upload(path, fixture, { contentType: 'image/png', cacheControl: '0', upsert: false })
  requireOk(!upload.error, 'Synthetic image upload failed')
  result.checks.ownerUpload = true
  const signed = await owner.api.storage.from('request-photos').createSignedUrl(path, 300)
  requireOk(!signed.error && signed.data?.signedUrl, 'Owner could not sign their image')
  const image = await fetch(signed.data.signedUrl, { signal: AbortSignal.timeout(20_000) })
  requireOk(image.ok && hash(Buffer.from(await image.arrayBuffer())) === hash(fixture), 'Signed image bytes differ')
  result.checks.ownerSignedDownload = true
  result.checks.outsiderSigningDenied = denied(await outsider.api.storage.from('request-photos').createSignedUrl(path, 300))
  result.checks.anonymousSigningDenied = denied(await client(anon).storage.from('request-photos').createSignedUrl(path, 300))
  requireOk(result.checks.outsiderSigningDenied && result.checks.anonymousSigningDenied, 'Unauthorized signing was not denied')
  const listing = await outsider.api.storage.from('request-photos').list(owner.id)
  requireOk(!listing.error && listing.data?.length === 0, 'Unrelated account could list the test image')
  result.checks.outsiderListingDenied = true
  const publicUrl = owner.api.storage.from('request-photos').getPublicUrl(path).data.publicUrl
  const publicResponse = await fetch(publicUrl, { signal: AbortSignal.timeout(20_000) })
  requireOk(args.has('--expect-private') ? [400, 401, 403, 404].includes(publicResponse.status) : publicResponse.ok, 'Public URL behavior differs from the rollout stage')
  await publicResponse.body?.cancel()
  result.checks.publicUrlMatchesStage = true
  if (args.has('--browsers')) {
    const { chromium, webkit } = await import('playwright')
    for (const [name, engine] of [['chromium', chromium], ['webkit', webkit]]) {
      const browser = await engine.launch({ headless: true })
      try {
        const page = await browser.newPage()
        await page.setContent('<img id="photo" alt="Synthetic test image">')
        await page.locator('#photo').evaluate((element, url) => { element.src = url }, signed.data.signedUrl)
        await page.waitForFunction(() => { const photo = document.querySelector('#photo'); return photo.complete && photo.naturalWidth === 1 }, undefined, { timeout: 15_000 })
        result.checks[`${name}ImageDecode`] = true
      } finally { await browser.close() }
    }
  }
} catch (error) {
  // Only our labels are logged. Never print an SDK error, signed URL or session.
  result.failure = error instanceof Error && !/https?:|token|eyJ/i.test(error.message) ? error.message.split('\n')[0] : 'Hosted photo check failed; inspect securely'
  process.exitCode = 1
} finally {
  if (admin && path) {
    try {
      const removed = await admin.storage.from('request-photos').remove([path])
      storageClean = !removed.error
    } catch { storageClean = false }
  } else storageClean = true
  let usersClean = true
  // Delete only IDs returned from this run's successful createUser calls.
  // Storage must be removed first: Supabase refuses deletion of an owner of files.
  for (const user of created) {
    try {
      const deleted = await admin.auth.admin.deleteUser(user.id)
      if (deleted.error) usersClean = false
    } catch { usersClean = false }
  }
  result.cleanup = storageClean && usersClean
  if (!result.cleanup) {
    // An ignored recovery manifest contains synthetic IDs only, never credentials.
    await mkdir('credentials', { recursive: true })
    await writeFile(`credentials/photo-check-recovery-${runId}.json`, JSON.stringify({ project, path, userIds: created.map(user => user.id) }))
    process.exitCode = 1
  }
  await mkdir('test-results', { recursive: true })
  await writeFile('test-results/request-photo-hosted.json', JSON.stringify(result, null, 2))
  console.log(JSON.stringify(result))
}
