import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { asUser, createTestDatabase } from '../../test/database'

const admin = '00000000-0000-0000-0000-000000000001'
const requester = '00000000-0000-0000-0000-000000000002'
const helper = '00000000-0000-0000-0000-000000000003'
const other = '00000000-0000-0000-0000-000000000004'
let db: PGlite
const user = (id: string, sql: string, params: unknown[] = []) => asUser(db, id, sql, params)
const owner = async (sql: string, params: unknown[] = []) => { await db.exec('reset role'); return db.query<Record<string, any>>(sql, params) }

// pg_net is a hosted extension, so the tests give emit_notification a stand-in that records what would be posted.
const events = async () => (await owner("select body from net.calls where body ? 'event' order by id")).rows.map(row => row.body as Record<string, any>)
const clear = () => owner('truncate net.calls')

// profiles.is_banned and volunteer_profiles.is_verified ignore ordinary updates; only the privileged path changes them.
const privileged = async (sql: string, params: unknown[] = []) => { await db.exec('reset role'); await db.exec("begin; select set_config('sanad.privileged_write','on',true)"); await db.query(sql, params); await db.exec('commit') }

// One active request per requester: close whatever the previous test left open.
async function newRequest(by = requester) {
  await owner("update help_requests set status='cancelled' where requester_id=$1 and status not in ('completed','cancelled')", [by])
  return (await user(by, "insert into help_requests (requester_id,service_type,latitude,longitude) values ($1,'battery',31.77,35.21) returning id", [by])).rows[0]!.id as string
}

beforeAll(async () => {
  db = await createTestDatabase()
  for (const id of [admin, requester, helper, other]) await db.query('insert into auth.users(id) values($1)', [id])
  await db.exec("begin; select set_config('sanad.privileged_write','on',true)")
  await db.query('update profiles set is_admin=true where id=$1', [admin])
  await db.exec('commit')
  await db.exec(`
    create schema net;
    create table net.calls (id bigserial primary key, url text, body jsonb);
    create function net.http_post(url text, headers jsonb default '{}', body jsonb default '{}') returns bigint language sql as $$
      insert into net.calls(url, body) values (url, body) returning id $$;
    insert into private.app_settings(key, value) values ('notify_webhook_secret', 'test-secret') on conflict (key) do update set value = excluded.value;
  `)
  await user(helper, 'insert into volunteer_profiles(user_id,is_available,latitude,longitude) values($1,true,31.77,35.21)', [helper])
}, 60000)
afterAll(async () => { await db?.close() })

describe('request lifecycle events', () => {
  it('emits one event per transition, with the request id and a stamp to de-duplicate on', async () => {
    const request = await newRequest()
    await clear()
    await user(helper, 'select accept_help_request($1)', [request])
    await user(helper, "select update_help_request_status($1,'on_the_way')", [request])
    await user(helper, "select update_help_request_status($1,'arrived')", [request])
    await user(helper, "select update_help_request_status($1,'awaiting_confirmation')", [request])
    await user(requester, 'select confirm_help_request_completion($1,true)', [request])
    const sent = await events()
    expect(sent.map(e => e.event)).toEqual(['request_accepted', 'helper_on_the_way', 'helper_arrived', 'completion_requested', 'request_completed'])
    for (const e of sent) expect(e).toMatchObject({ request_id: request, stamp: expect.any(String) })
    expect(new Set(sent.map(e => e.stamp)).size).toBe(sent.length)
  })

  it('tells the volunteer when the requester says the help is not complete', async () => {
    const request = await newRequest()
    await user(helper, 'select accept_help_request($1)', [request])
    await user(helper, "select update_help_request_status($1,'on_the_way')", [request])
    await user(helper, "select update_help_request_status($1,'arrived')", [request])
    await user(helper, "select update_help_request_status($1,'awaiting_confirmation')", [request])
    await clear()
    await user(requester, 'select confirm_help_request_completion($1,false)', [request])
    expect((await events()).map(e => e.event)).toEqual(['completion_rejected'])
    await user(helper, 'select release_help_request($1)', [request])
  })

  it('emits helper_released with the volunteer who let go, and the request is open again', async () => {
    const request = await newRequest()
    await user(helper, 'select accept_help_request($1)', [request])
    await clear()
    await user(helper, "select release_help_request($1,'cannot_reach')", [request])
    expect(await events()).toEqual([expect.objectContaining({ event: 'helper_released', request_id: request, volunteer_id: helper })])
    expect((await owner('select status, volunteer_id from help_requests where id=$1', [request])).rows[0]).toMatchObject({ status: 'open', volunteer_id: null })
  })

  it('emits mission_cancelled when an admin cancels a mission that has a volunteer, and nothing when a request is cancelled before anyone accepted', async () => {
    const taken = await newRequest()
    await user(helper, 'select accept_help_request($1)', [taken])
    await clear()
    await owner("update help_requests set status='cancelled' where id=$1", [taken])
    expect(await events()).toEqual([expect.objectContaining({ event: 'mission_cancelled', request_id: taken, volunteer_id: helper })])

    const open = await newRequest()
    await clear()
    await user(requester, 'select cancel_help_request($1)', [open])
    expect(await events()).toEqual([])
  })

  it('stays silent for edits that change neither status, volunteer nor confirmation', async () => {
    const request = await newRequest()
    await clear()
    await owner("update help_requests set note='x' where id=$1", [request])
    expect(await events()).toEqual([])
  })
})

describe('moderation, support, reports and devices', () => {
  it('emits ban and unban only when the flag changes', async () => {
    await clear()
    await privileged('update profiles set is_banned=true where id=$1', [other])
    await privileged('update profiles set is_banned=true where id=$1', [other])
    await privileged('update profiles set is_banned=false where id=$1', [other])
    expect((await events()).map(e => [e.event, e.user_id])).toEqual([['account_banned', other], ['account_unbanned', other]])
  })

  it('emits volunteer_verified when a volunteer becomes verified, not when it is switched off', async () => {
    await clear()
    await user(admin, 'select admin_set_volunteer_verified($1,true)', [helper])
    await user(admin, 'select admin_set_volunteer_verified($1,false)', [helper])
    expect((await events()).map(e => e.event)).toEqual(['volunteer_verified'])
  })

  it('emits an alert for admins when a user writes to support and a resolved notice when the conversation is resolved', async () => {
    const conversation = (await user(requester, "select * from support_send_message('مرحبا')")).rows[0]!.conversation_id as string
    expect((await events()).map(e => e.event)).toContain('support_user_message')
    await clear()
    await owner("update support_conversations set status='resolved' where id=$1", [conversation])
    expect(await events()).toEqual([expect.objectContaining({ event: 'support_resolved', conversation_id: conversation })])
    await clear()
    await user(admin, "select * from admin_support_reply($1,'جاوبنا')", [conversation])
    expect((await events()).map(e => e.event)).not.toContain('support_user_message')
  })

  it('emits when a report is filed and when it is closed', async () => {
    const report = (await owner("insert into reports(reporter_id,target_type,target_id,reason) values($1,'user',$2,'other') returning id", [requester, other])).rows[0]!.id as string
    expect((await events()).map(e => e.event)).toContain('report_created')
    await clear()
    await owner("update reports set status='reviewing' where id=$1", [report])
    expect(await events()).toEqual([])
    await owner("update reports set status='resolved' where id=$1", [report])
    expect(await events()).toEqual([expect.objectContaining({ event: 'report_reviewed', report_id: report })])
  })

  it('warns about a new device only when the account already had one', async () => {
    await clear()
    await owner("insert into push_devices(token,user_id) values('ExponentPushToken[first]',$1)", [other])
    expect(await events()).toEqual([])
    await owner("insert into push_devices(token,user_id) values('ExponentPushToken[second]',$1)", [other])
    expect(await events()).toEqual([expect.objectContaining({ event: 'new_device', user_id: other })])
  })
})

describe('offers', () => {
  it('emits offer_pending when an offer is submitted and offer_reviewed when it is approved or rejected', async () => {
    const offer = (await user(admin, "select * from admin_upsert_offer(null,$1::jsonb)", [JSON.stringify({ title: 'Offer', discount_type: 'free_benefit', points_required: 10 })])).rows[0]!.id as string
    await clear()
    await owner("update partner_offers set status='pending_review' where id=$1", [offer])
    expect(await events()).toEqual([expect.objectContaining({ event: 'offer_pending', offer_id: offer })])
    await clear()
    await user(admin, "select admin_set_offer_status($1,'approved')", [offer])
    expect(await events()).toEqual([expect.objectContaining({ event: 'offer_reviewed', offer_id: offer, decision: 'approved' })])
    await clear()
    await owner("update partner_offers set status='rejected' where id=$1", [offer])
    expect(await events()).toEqual([expect.objectContaining({ event: 'offer_reviewed', decision: 'rejected' })])
  })
})

describe('notification preferences', () => {
  it('returns the defaults to a user who never set anything', async () => {
    expect((await user(other, 'select get_my_notification_preferences() as p')).rows[0]!.p).toEqual({ requests: true, mission: true, rewards: true, reminders: false, offers: false, announcements: true })
  })
  it('stores only the categories that were sent and returns the merged result', async () => {
    const saved = (await user(other, `select set_my_notification_preferences('{"reminders": true, "rewards": false}') as p`)).rows[0]!.p
    expect(saved).toEqual({ requests: true, mission: true, rewards: false, reminders: true, offers: false, announcements: true })
    expect((await user(other, 'select get_my_notification_preferences() as p')).rows[0]!.p).toEqual(saved)
    expect((await user(requester, 'select get_my_notification_preferences() as p')).rows[0]!.p).toMatchObject({ rewards: true, reminders: false })
  })
  it('rejects unknown categories, non-boolean values and anonymous callers', async () => {
    await expect(user(other, `select set_my_notification_preferences('{"support": false}')`)).rejects.toThrow('Unknown notification category')
    await expect(user(other, `select set_my_notification_preferences('{"offers": "yes"}')`)).rejects.toThrow('must be true or false')
    await expect(user(other, `select set_my_notification_preferences('[]')`)).rejects.toThrow('must be an object')
    await db.exec('reset role')
    await db.exec("select set_config('request.jwt.claim.sub', '', false)")
    await db.exec('set role authenticated')
    await expect(db.query(`select set_my_notification_preferences('{"offers": true}')`)).rejects.toThrow()
  })
  it('is not readable or writable directly by clients', async () => {
    await expect(user(other, 'select * from notification_preferences')).rejects.toThrow()
    await expect(user(other, 'select * from notification_log')).rejects.toThrow()
    await expect(user(other, 'select emit_notification($1)', ['tick'])).rejects.toThrow()
  })
})

describe('emit_notification', () => {
  it('never breaks the action that triggered it, even when the post fails or there is no secret', async () => {
    const request = await newRequest()
    await owner('drop function net.http_post(text, jsonb, jsonb)')
    await user(helper, 'select accept_help_request($1)', [request])
    expect((await owner('select status from help_requests where id=$1', [request])).rows[0]!.status).toBe('accepted')
    await owner(`create function net.http_post(url text, headers jsonb default '{}', body jsonb default '{}') returns bigint language sql as $$ insert into net.calls(url, body) values (url, body) returning id $$`)
    await owner("delete from private.app_settings where key = 'notify_webhook_secret'")
    await clear()
    await user(helper, "select update_help_request_status($1,'on_the_way')", [request])
    expect(await events()).toEqual([])
  })
})
