#!/usr/bin/env node
// Safe, read-only load test against the real (production) Supabase backend
// and Vercel-hosted admin panel / main app web. No writes, no fake
// accounts, no data left behind - only anon-readable endpoints.
//
// Usage:
//   node scripts/load-test.mjs [concurrency] [waves]
// Defaults: 50 concurrent virtual users, 3 waves.
//
// This hits real production infrastructure. Keep concurrency reasonable -
// the auto-mode classifier blocks runs it judges likely to disrupt real
// traffic (see the "Interfere With Workloads" guard). Start modest, and
// only raise it with the user's explicit go-ahead.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))

function readEnvVar(name) {
  for (const file of ['.env.local', '.env']) {
    const p = path.join(ROOT, file)
    if (!fs.existsSync(p)) continue
    const match = fs.readFileSync(p, 'utf8').match(new RegExp(`^${name}=(.*)$`, 'm'))
    if (match) return match[1].trim().replace(/^["']|["']$/g, '')
  }
  return undefined
}

const URL = readEnvVar('EXPO_PUBLIC_SUPABASE_URL')
const KEY = readEnvVar('EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY')
if (!URL || !KEY) {
  console.error('Could not read EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY from .env or .env.local')
  process.exit(1)
}

const CONCURRENCY = Number(process.argv[2]) || 50
const WAVES = Number(process.argv[3]) || 3
const WAVE_GAP_MS = 2000

const targets = {
  'supabase: public_offers': () => fetch(`${URL}/rest/v1/public_offers?select=id,title&limit=20`, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } }),
  'supabase: partners': () => fetch(`${URL}/rest/v1/partners?select=id,name&limit=20`, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } }),
  'supabase: content_banners': () => fetch(`${URL}/rest/v1/content_banners?select=id&limit=20`, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } }),
  'admin panel (Vercel)': () => fetch('https://akhoo-admin.vercel.app/'),
  'main app web (Vercel)': () => fetch('https://akhoo.vercel.app/')
}

async function timedFetch(name, fn) {
  const start = performance.now()
  try {
    const res = await fn()
    const ms = performance.now() - start
    await res.arrayBuffer().catch(() => {})
    return { name, ms, status: res.status, ok: res.ok }
  } catch (error) {
    const ms = performance.now() - start
    return { name, ms, status: 0, ok: false, error: String(error?.message ?? error) }
  }
}

function stats(samples) {
  const ms = samples.map(s => s.ms).sort((a, b) => a - b)
  const pick = p => ms[Math.min(ms.length - 1, Math.floor(p * ms.length))]
  const errors = samples.filter(s => !s.ok)
  const statusCounts = {}
  for (const s of samples) statusCounts[s.status] = (statusCounts[s.status] ?? 0) + 1
  return {
    count: samples.length,
    min: ms[0]?.toFixed(0),
    avg: (ms.reduce((a, b) => a + b, 0) / ms.length).toFixed(0),
    p50: pick(0.5)?.toFixed(0),
    p95: pick(0.95)?.toFixed(0),
    max: ms[ms.length - 1]?.toFixed(0),
    errorRate: ((errors.length / samples.length) * 100).toFixed(1) + '%',
    statusCounts
  }
}

const results = {}
for (const name of Object.keys(targets)) results[name] = []

console.log(`Load test: ${CONCURRENCY} concurrent virtual users x ${WAVES} waves, against ${Object.keys(targets).length} targets`)
const overallStart = performance.now()

for (let wave = 1; wave <= WAVES; wave++) {
  console.log(`\n-- wave ${wave}/${WAVES} --`)
  const waveStart = performance.now()
  const calls = []
  for (let u = 0; u < CONCURRENCY; u++) {
    for (const [name, fn] of Object.entries(targets)) {
      calls.push(timedFetch(name, fn).then(r => { results[name].push(r); return r }))
    }
  }
  await Promise.allSettled(calls)
  console.log(`wave ${wave} done in ${(performance.now() - waveStart).toFixed(0)}ms (${calls.length} requests)`)
  if (wave < WAVES) await new Promise(r => setTimeout(r, WAVE_GAP_MS))
}

console.log(`\n=== TOTAL: ${(performance.now() - overallStart).toFixed(0)}ms ===\n`)
console.log('target'.padEnd(26), 'n'.padStart(5), 'min'.padStart(7), 'avg'.padStart(7), 'p50'.padStart(7), 'p95'.padStart(7), 'max'.padStart(7), 'errRate'.padStart(9), '  statuses')
for (const [name, samples] of Object.entries(results)) {
  const s = stats(samples)
  console.log(
    name.padEnd(26), String(s.count).padStart(5), (s.min + 'ms').padStart(7), (s.avg + 'ms').padStart(7),
    (s.p50 + 'ms').padStart(7), (s.p95 + 'ms').padStart(7), (s.max + 'ms').padStart(7), s.errorRate.padStart(9),
    '  ' + JSON.stringify(s.statusCounts)
  )
}

const anyErrors = Object.values(results).flat().filter(r => !r.ok)
if (anyErrors.length) {
  console.log(`\n${anyErrors.length} failed requests, sample:`)
  for (const e of anyErrors.slice(0, 5)) console.log(' -', e.name, e.status, e.error ?? '')
} else {
  console.log('\nNo failed requests.')
}
