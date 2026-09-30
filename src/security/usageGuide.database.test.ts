import { readFileSync } from 'node:fs'
import { PGlite } from '@electric-sql/pglite'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

let db: PGlite
const old = '00000000-0000-0000-0000-000000000001'
const fresh = '00000000-0000-0000-0000-000000000002'
const stranger = '00000000-0000-0000-0000-000000000003'
async function asUser(id: string, sql: string) {
  await db.exec('reset role')
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id])
  await db.exec('set role authenticated')
  return db.query(sql)
}
beforeAll(async () => {
  db = new PGlite()
  await db.exec(`create role anon; create role authenticated; create schema auth;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth,public to authenticated;
    insert into auth.users values('${old}');`)
  await db.exec(readFileSync(new URL('../../supabase/migrations/0039_account_usage_guide.sql', import.meta.url), 'utf8'))
  await db.exec(`insert into auth.users values('${fresh}'),('${stranger}')`)
}, 30_000)
afterAll(async () => { await db?.close() })
describe('account-scoped guide persistence', () => {
  it('auto-enrols only accounts created after the migration', async () => {
    expect((await asUser(old, 'select * from account_usage_guide')).rows).toHaveLength(0)
    expect((await asUser(fresh, 'select * from account_usage_guide')).rows).toHaveLength(1)
  })
  it('persists separate pages, resists stale reopen and skips globally', async () => {
    await asUser(fresh, "select save_usage_guide('home',2,'active')")
    await asUser(fresh, "select save_usage_guide('home',3,'done')")
    await asUser(fresh, "select save_usage_guide('perks',1,'active')")
    await asUser(fresh, "select save_usage_guide('home',0,'active')")
    const result = await asUser(fresh, 'select progress from account_usage_guide')
    expect(result.rows[0]).toMatchObject({ progress: { home: { step: 3, status: 'done' }, perks: { step: 1, status: 'active' } } })
    await asUser(fresh, "select save_usage_guide('perks',1,'skipped')")
    await asUser(fresh, "select save_usage_guide('activity',0,'active')")
    expect((await asUser(fresh, 'select enabled from account_usage_guide')).rows[0]).toEqual({ enabled: false })
  })
  it('isolates users, disallows direct writes and rejects invalid progress', async () => {
    expect((await asUser(stranger, `select * from account_usage_guide where user_id='${fresh}'`)).rows).toHaveLength(0)
    await expect(asUser(stranger, `update account_usage_guide set enabled=true where user_id='${fresh}'`)).rejects.toMatchObject({ code: '42501' })
    await expect(asUser(stranger, "select save_usage_guide('home',99,'active')")).rejects.toThrow('Invalid guide progress')
    await expect(asUser(stranger, "select save_usage_guide('bogus',0,'active')")).rejects.toThrow('Invalid guide progress')
    await expect(asUser('', "select restart_usage_guide()")).rejects.toThrow('Authentication required')
  })
  it('allows old and new accounts to explicitly restart', async () => {
    await asUser(old, 'select restart_usage_guide()')
    expect((await asUser(old, 'select enabled,progress from account_usage_guide')).rows[0]).toEqual({ enabled: true, progress: {} })
    await asUser(fresh, 'select restart_usage_guide()')
    expect((await asUser(fresh, 'select enabled,progress from account_usage_guide')).rows[0]).toEqual({ enabled: true, progress: {} })
  })
})
