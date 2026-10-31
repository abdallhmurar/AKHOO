import { readFileSync } from 'node:fs'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { asUser, createTestDatabase } from '../../test/database'

const owner = '00000000-0000-0000-0000-000000000001'
const helper = '00000000-0000-0000-0000-000000000002'
const admin = '00000000-0000-0000-0000-000000000003'
const outsider = '00000000-0000-0000-0000-000000000004'
const otherHelper = '00000000-0000-0000-0000-000000000005'
const path = `${owner}/1730000000.jpg`
const legacy = `https://zmpwdufahjmlxfwzafvr.supabase.co/storage/v1/object/public/request-photos/${path}`
let db: PGlite
const user = (id: string, sql: string, params: unknown[] = []) => asUser(db, id, sql, params)
const read = async (id: string) => (await user(id, "select name from storage.objects where bucket_id='request-photos' and name=$1", [path])).rows
const request = async (id = owner, photo = legacy) => (await user(id,
  "insert into help_requests(requester_id, service_type, latitude, longitude, photo_url) values($1, 'battery', 31.77, 35.21, $2) returning id", [id, photo])).rows[0]!.id

beforeAll(async () => { db = await createTestDatabase() }, 60000)
afterAll(async () => { await db?.close() })
beforeEach(async () => {
  await db.exec("reset role; truncate auth.users cascade; truncate storage.objects; select set_config('request.jwt.claim.sub','',false); update storage.buckets set public=true where id='request-photos'")
  for (const id of [owner, helper, admin, outsider, otherHelper]) await db.query('insert into auth.users(id) values($1)', [id])
  await db.exec("begin; select set_config('sanad.privileged_write','on',true)")
  await db.query('update profiles set is_admin=true where id=$1', [admin])
  await db.exec('commit')
  for (const id of [helper, otherHelper]) await user(id, 'insert into volunteer_profiles(user_id,is_available,latitude,longitude) values($1,true,31.77,35.21)', [id])
  await user(owner, "insert into storage.objects(bucket_id,name,owner_id) values('request-photos',$1,$2)", [path, owner])
})

describe('request photo access on the complete PostgreSQL migration chain', () => {
  it('allows the uploader, eligible nearby helpers and admin, but denies strangers and anonymous users', async () => {
    await request()
    for (const id of [owner, helper, admin]) expect(await read(id)).toHaveLength(1)
    expect(await read(outsider)).toEqual([])
    await db.exec("reset role; grant select on storage.objects to anon; select set_config('request.jwt.claim.sub','',false); set role anon")
    expect((await db.query("select name from storage.objects where bucket_id='request-photos'")).rows).toEqual([])
  })

  it('does not reveal unreferenced uploads to helpers or administrators', async () => {
    expect(await read(owner)).toHaveLength(1)
    expect(await read(helper)).toEqual([])
    expect(await read(admin)).toEqual([])
  })

  it('uses request eligibility: far, unavailable, stale and busy helpers cannot read open-request photos', async () => {
    const id = await request()
    await user(helper, 'update volunteer_profiles set latitude=32.8 where user_id=$1', [helper])
    expect(await read(helper)).toEqual([])
    await user(helper, 'update volunteer_profiles set latitude=31.77,is_available=false where user_id=$1', [helper])
    expect(await read(helper)).toEqual([])
    await user(helper, 'update volunteer_profiles set is_available=true where user_id=$1', [helper])
    await db.exec('reset role; alter table volunteer_profiles disable trigger user')
    await db.query("update volunteer_profiles set updated_at=now()-interval '21 minutes' where user_id=$1", [helper])
    await db.exec('alter table volunteer_profiles enable trigger user')
    expect(await read(helper)).toEqual([])
    await user(helper, 'update volunteer_profiles set is_available=true where user_id=$1', [helper])
    await user(helper, 'select accept_help_request($1)', [id])
    const another = await request(outsider, `${outsider}/other.jpg`)
    await user(outsider, "insert into storage.objects(bucket_id,name) values('request-photos',$1)", [`${outsider}/other.jpg`])
    expect((await user(helper, 'select id from help_requests where id=$1', [another])).rows).toEqual([])
    expect((await user(helper, "select name from storage.objects where name=$1", [`${outsider}/other.jpg`])).rows).toEqual([])
  })

  it('keeps the assigned helper authorized after acceptance/completion and removes other nearby helpers', async () => {
    const id = await request()
    expect(await read(otherHelper)).toHaveLength(1)
    await user(helper, 'select accept_help_request($1)', [id])
    expect(await read(helper)).toHaveLength(1)
    expect(await read(otherHelper)).toEqual([])
    for (const status of ['on_the_way', 'arrived', 'awaiting_confirmation']) await user(helper, 'select update_help_request_status($1,$2)', [id, status])
    await user(owner, 'select confirm_help_request_completion($1,true)', [id])
    for (const id of [owner, helper, admin]) expect(await read(id)).toHaveLength(1)
    expect(await read(otherHelper)).toEqual([])
  })

  it('supports raw paths and rejects re-linking somebody else’s upload to a visible request', async () => {
    const id = await request(owner, path)
    expect(await read(helper)).toHaveLength(1)
    await user(admin, 'select admin_cancel_help_request($1)', [id])
    await request(outsider, legacy)
    expect(await read(outsider)).toEqual([])
    expect(await read(helper)).toEqual([])
    expect(await read(admin)).toHaveLength(1) // original cancelled request remains visible to admin
  })

  it('rejects banned users and writing another user’s folder', async () => {
    await request()
    for (const id of [owner, helper, admin]) {
      await user(admin, 'select admin_set_user_banned($1,true)', [id])
      expect(await read(id)).toEqual([])
      await expect(user(id, "insert into storage.objects(bucket_id,name) values('request-photos',$1)", [`${id}/new.jpg`])).rejects.toMatchObject({ code: '42501' })
    }
    await expect(user(outsider, "insert into storage.objects(bucket_id,name) values('request-photos',$1)", [`${owner}/forged.jpg`])).rejects.toMatchObject({ code: '42501' })
  })

  it('leaves the live URL format and public flag unchanged during phase 1; gates the private cutover', async () => {
    await request()
    await db.exec('reset role')
    expect((await db.query("select public from storage.buckets where id='request-photos'")).rows[0]).toEqual({ public: true })
    expect((await db.query('select photo_url from help_requests')).rows[0]).toEqual({ photo_url: legacy })
    const cutover = readFileSync(new URL('../../supabase/operations/request-photo-private-cutover.sql', import.meta.url), 'utf8')
    await expect(db.exec(cutover)).rejects.toThrow('Client rollout must be confirmed')
    await db.exec("rollback; set akhoo.request_photo_clients_ready = 'yes'")
    await db.exec(cutover)
    expect((await db.query("select public from storage.buckets where id='request-photos'")).rows[0]).toEqual({ public: false })
    expect(await read(helper)).toHaveLength(1)
    expect(await read(outsider)).toEqual([])
  })
})
