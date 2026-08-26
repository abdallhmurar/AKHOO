import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const migrationUrl = new URL('../supabase/migrations/0017_sanad_v2_civic_platform.sql', import.meta.url)
const sql = readFileSync(fileURLToPath(migrationUrl), 'utf8')

const requiredTables = [
  'categories', 'scenarios', 'missions', 'mission_events', 'mission_messages',
  'request_media', 'helper_skills', 'helper_languages', 'devices', 'notifications',
  'ratings', 'reports', 'blocks', 'rewards', 'redemptions'
]

const requiredFunctions = [
  'create_civic_request', 'save_helper_setup', 'accept_mission', 'advance_mission',
  'confirm_mission_completion', 'cancel_mission', 'send_mission_message',
  'get_mission_helper_location', 'submit_mission_rating', 'submit_safety_report',
  'dispute_mission', 'block_user', 'redeem_reward', 'redeem_offer',
  'request_sanad_plus_membership'
]

const failures = []

for (const table of requiredTables) {
  if (!new RegExp(`create table if not exists public\\.${table}\\b`, 'i').test(sql)) {
    failures.push(`missing table: ${table}`)
  }
  if (!new RegExp(`alter table public\\.${table} enable row level security`, 'i').test(sql)) {
    failures.push(`RLS not enabled: ${table}`)
  }
}

for (const fn of requiredFunctions) {
  if (!new RegExp(`create or replace function public\\.${fn}\\b`, 'i').test(sql)) {
    failures.push(`missing RPC: ${fn}`)
  }
  if (!new RegExp(`revoke all on function public\\.${fn}\\(`, 'i').test(sql)) {
    failures.push(`RPC is not explicitly revoked from public: ${fn}`)
  }
  if (!new RegExp(`grant execute on function public\\.${fn}\\(`, 'i').test(sql)) {
    failures.push(`RPC is not granted to authenticated: ${fn}`)
  }
}

const invariants = [
  ['non-destructive table strategy', !/\bdrop\s+table\b|\btruncate\b/i.test(sql)],
  ['private request-media bucket', /'request-media'\s*,\s*'request-media'\s*,\s*false/i.test(sql)],
  ['request media file-size limit', /file_size_limit\s*=\s*excluded\.file_size_limit/i.test(sql)],
  ['request media MIME allowlist', /allowed_mime_types\s*=\s*excluded\.allowed_mime_types/i.test(sql)],
  ['realtime missions', /array\['missions','mission_events','mission_messages','notifications'\]/i.test(sql)],
  ['mutual block filtering', /b\.blocker_id\s*=\s*auth\.uid\(\).*b\.blocked_user_id\s*=\s*auth\.uid\(\)/is.test(sql)],
  ['Arabic taxonomy seed', sql.includes('التنقل')],
  ['Hebrew taxonomy seed', sql.includes('ניידות')],
  ['Jerusalem/Israel market support', /p_market not in \('IL','JO','jerusalem'\)/i.test(sql)]
]

for (const [label, passed] of invariants) {
  if (!passed) failures.push(`failed invariant: ${label}`)
}

const dollarQuotes = sql.match(/\$\$/g)?.length ?? 0
if (dollarQuotes % 2 !== 0) failures.push('unbalanced SQL dollar quotes')

if (failures.length) {
  console.error(`SANAD V2 migration verification failed:\n- ${failures.join('\n- ')}`)
  process.exit(1)
}

console.log(`SANAD V2 migration verified: ${requiredTables.length} RLS tables, ${requiredFunctions.length} secured RPCs, private media, realtime, and multilingual seed data.`)
