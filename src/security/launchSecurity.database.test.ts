import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { asUser, createTestDatabase } from '../../test/database'

const requester = '00000000-0000-0000-0000-000000000001'
const helper = '00000000-0000-0000-0000-000000000002'
const admin = '00000000-0000-0000-0000-000000000003'
const stranger = '00000000-0000-0000-0000-000000000004'
let db: PGlite
const user = (id: string, sql: string, params: unknown[] = []) => asUser(db, id, sql, params)
const createRequest = async () => (await user(requester,
  "insert into help_requests (requester_id,service_type,latitude,longitude) values ($1,'battery',31.77,35.21) returning id", [requester])).rows[0]!.id

beforeAll(async () => { db = await createTestDatabase() }, 60000)
afterAll(async () => { await db?.close() })
beforeEach(async () => {
  await db.exec("reset role; truncate auth.users cascade; truncate storage.objects; select set_config('request.jwt.claim.sub','',false)")
  for (const id of [requester, helper, admin, stranger]) await db.query('insert into auth.users(id) values($1)', [id])
  await db.exec("begin; select set_config('sanad.privileged_write','on',true)")
  await db.query('update profiles set is_admin = true where id = $1', [admin])
  await db.exec('commit')
  await user(helper, 'insert into volunteer_profiles(user_id,is_available,latitude,longitude) values($1,true,31.77,35.21)', [helper])
})

describe('launch authorization on the full migration chain', () => {
  it('rejects fabricated lifecycle/assignment and does not expose a strangers contact', async () => {
    for (const assignee of [requester, stranger]) {
      await expect(user(requester, `insert into help_requests(requester_id,service_type,latitude,longitude,status,volunteer_id)
        values($1,'battery',31.77,35.21,'awaiting_confirmation',$2)`, [requester, assignee])).rejects.toMatchObject({ code: '42501' })
    }
    expect((await user(requester, 'select * from profiles where id = $1', [stranger])).rows).toEqual([])
    await expect(user(requester, `insert into help_requests(requester_id,service_type,latitude,longitude,accepted_at)
      values($1,'battery',31.77,35.21,now())`, [requester])).rejects.toMatchObject({ code: '42501' })
  })
  it('keeps a new volunteer unverified and still allows authorized admin verification', async () => {
    await user(stranger, 'insert into volunteer_profiles(user_id,is_verified) values($1,true)', [stranger])
    expect((await user(stranger, 'select is_verified from volunteer_profiles')).rows[0]?.is_verified).toBe(false)
    await user(admin, 'select admin_set_volunteer_verified($1,true)', [stranger])
    expect((await user(stranger, 'select is_verified from volunteer_profiles')).rows[0]?.is_verified).toBe(true)
  })
  it('denies banned administrators, self-unban, and public bootstrap', async () => {
    await user(admin, 'select admin_set_user_banned($1,true)', [admin])
    expect((await user(admin, 'select is_admin() as allowed')).rows[0]?.allowed).toBe(false)
    await expect(user(admin, 'select admin_set_user_banned($1,false)', [admin])).rejects.toThrow('Not authorized')
    await expect(user(stranger, 'select admin_bootstrap_first_admin()')).rejects.toMatchObject({ code: '42501' })
  })
  it('completes a real two-user mission and awards points exactly once', async () => {
    const request = await createRequest()
    await user(helper, 'select accept_help_request($1)', [request])
    for (const status of ['on_the_way','arrived','awaiting_confirmation']) {
      await user(helper, 'select update_help_request_status($1,$2)', [request,status])
    }
    await expect(user(stranger, 'select confirm_help_request_completion($1,true)', [request])).rejects.toThrow('Request not found')
    await user(requester, 'select confirm_help_request_completion($1,true)', [request])
    await user(requester, 'select confirm_help_request_completion($1,true)', [request])
    expect((await user(helper, 'select sum(points)::integer as points from volunteer_point_transactions')).rows[0]?.points).toBe(10)
    expect((await user(helper, 'select is_available from volunteer_profiles')).rows[0]?.is_available).toBe(true)
  })
  it('makes chat objects private and readable only by sender/participants', async () => {
    const request = await createRequest()
    await user(helper, 'select accept_help_request($1)', [request])
    const path = `${requester}/${request}/photo.jpg`
    await user(requester, "insert into storage.objects(bucket_id,name,owner_id) values('mission-chat',$1,$2)", [path,requester])
    await user(requester, "insert into messages(request_id,sender_id,media_url,media_type) values($1,$2,$3,'image')", [request,requester,path])
    expect((await user(helper, "select name from storage.objects where bucket_id='mission-chat'")).rows).toHaveLength(1)
    expect((await user(stranger, "select name from storage.objects where bucket_id='mission-chat'")).rows).toHaveLength(0)
    await expect(user(stranger, 'select * from account_storage_objects($1)', [requester])).rejects.toMatchObject({ code: '42501' })
    await db.exec('reset role')
    expect((await db.query("select public from storage.buckets where id='mission-chat'")).rows[0]).toEqual({ public: false })
  })
  it('accepts participant reports, rejects forged resolutions, and gates admin moderation', async () => {
    const request = await createRequest()
    await user(helper, 'select accept_help_request($1)', [request])
    const message = (await user(helper, "insert into messages(request_id,sender_id,body) values($1,$2,'test message') returning id", [request,helper])).rows[0]!.id
    await expect(user(admin, 'select admin_hide_message($1)', [message])).rejects.toMatchObject({ code: '42501' })
    await expect(user(stranger, "insert into reports(reporter_id,target_type,target_id,reason) values($1,'request',$2,'test report')", [stranger,request])).rejects.toMatchObject({ code: '42501' })
    await expect(user(requester, "insert into reports(reporter_id,target_type,target_id,reason,status) values($1,'request',$2,'test report','resolved')", [requester,request])).rejects.toMatchObject({ code: '42501' })
    await user(requester, "insert into reports(reporter_id,target_type,target_id,reason) values($1,'request',$2,'test report')", [requester,request])
    expect((await user(admin, 'select * from messages')).rows).toHaveLength(1)
    await user(admin, 'select admin_hide_message($1)', [message])
    expect((await user(requester, 'select * from messages')).rows).toHaveLength(0)
    expect((await user(admin, "select * from admin_audit_log where action='message_hidden'")).rows).toHaveLength(1)
  })
  it('blocks messaging and future assignment in either direction', async () => {
    const request = await createRequest()
    await user(helper, 'select accept_help_request($1)', [request])
    await user(requester, 'insert into user_blocks(blocker_id,blocked_id) values($1,$2)', [requester,helper])
    await user(helper, "select register_push_device('ExpoPushToken[blocked_device]',true)")
    await db.exec('reset role; set role service_role')
    expect((await db.query('select * from get_request_push_recipients($1,$2)', [[helper],requester])).rows).toEqual([])
    await expect(user(helper, "insert into messages(request_id,sender_id,body) values($1,$2,'blocked')", [request,helper])).rejects.toMatchObject({ code: '42501' })
    await user(admin, 'select admin_cancel_help_request($1)', [request])
    const next = await createRequest()
    await expect(user(helper, 'select accept_help_request($1)', [next])).rejects.toMatchObject({ code: '42501' })
  })
  it('tracks per-device consent, logout and cross-account token ownership', async () => {
    const token = 'ExpoPushToken[device_one]'
    const otherToken = 'ExpoPushToken[device_two]'
    await user(requester, 'select register_push_device($1,true)', [token])
    await user(requester, 'select register_push_device($1,true)', [otherToken])
    await user(requester, 'select register_push_device($1,false)', [token])
    await db.exec('reset role; set role service_role')
    expect((await db.query('select * from get_push_recipients()')).rows).toEqual([{ user_id: requester, token: otherToken }])
    await user(helper, 'select register_push_device($1,true)', [token])
    await user(requester, 'select unregister_push_device($1)', [token])
    await user(requester, 'select unregister_push_device($1)', [otherToken])
    await db.exec('reset role; set role service_role')
    expect((await db.query('select * from get_push_recipients()')).rows).toEqual([{ user_id: helper, token }])
    await user(admin, 'select admin_set_user_banned($1,true)', [helper])
    await db.exec('reset role; set role service_role')
    expect((await db.query('select * from get_push_recipients()')).rows).toEqual([])
  })
  it('allows only one broadcast claim and keeps uncertain sends from automatic retries', async () => {
    const notification = (await user(admin, "select (admin_create_broadcast_notification('test','test','all')).id")).rows[0]!.id
    await db.exec('reset role; set role service_role')
    expect((await db.query('select claim_broadcast_send($1) as claimed',[notification])).rows[0]).toEqual({ claimed: true })
    expect((await db.query('select claim_broadcast_send($1) as claimed',[notification])).rows[0]).toEqual({ claimed: false })
  })
  it('enforces the geocoder limit globally and keeps cache controls private', async () => {
    await expect(user(requester, 'select claim_geocode_slot()')).rejects.toMatchObject({ code: '42501' })
    await db.exec('reset role; set role service_role')
    expect((await db.query('select claim_geocode_slot() as claimed')).rows[0]).toEqual({ claimed: true })
    expect((await db.query('select claim_geocode_slot() as claimed')).rows[0]).toEqual({ claimed: false })
    await db.query("select save_geocode_cache('test', '[1,2]'::jsonb)")
    expect((await db.query("select lookup_geocode_cache('test') as cached")).rows[0]).toEqual({ cached: [1,2] })
  })
  it('keeps diagnostics categorical, rate limited, and readable only by administrators', async () => {
    await user(requester, "select record_client_error('unknown','auth','email@example.com')")
    for (let i=0;i<7;i++) await user(requester, "select record_client_error('storage','messages','upload-media')")
    expect((await user(requester, 'select * from client_error_events')).rows).toHaveLength(0)
    const events = (await user(admin, 'select * from client_error_events')).rows
    expect(events).toHaveLength(5)
    expect(events.every(event => event.operation === 'upload-media')).toBe(true)
  })
})
