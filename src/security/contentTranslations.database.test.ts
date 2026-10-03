import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { asUser, createTestDatabase } from '../../test/database'

const admin = '00000000-0000-0000-0000-000000000001'
const reader = '00000000-0000-0000-0000-000000000002'
const outsider = '00000000-0000-0000-0000-000000000003'
let db: PGlite
const user = (id: string, sql: string, params: unknown[] = []) => asUser(db, id, sql, params)
const source = { title: 'هدية', description: '', terms: '', offer_type_label: '' }
const translations = { ar: source, en: { ...source, title: 'Gift' }, he: { ...source, title: 'מתנה' } }

beforeAll(async () => {
  db = await createTestDatabase()
  for (const id of [admin, reader, outsider]) await db.query('insert into auth.users(id) values($1)', [id])
  await db.exec("begin; select set_config('sanad.privileged_write','on',true)")
  await db.query('update profiles set is_admin=true where id=$1', [admin])
  await db.exec('commit')
}, 60000)
afterAll(async () => { await db?.close() })

describe('translated publishing on the full migration chain', () => {
  it('publishes translated offers and invalidates translations after a legacy edit', async () => {
    const payload = { ...source, discount_type: 'free_benefit', translations }
    const offer = (await user(admin, 'select * from admin_upsert_offer(null,$1)', [JSON.stringify(payload)])).rows[0]!
    expect(offer.translations).toEqual(translations)
    await user(admin, "select admin_set_offer_status($1,'approved')", [offer.id])
    expect((await user(reader, 'select translations from public_offers where id=$1', [offer.id])).rows[0]?.translations).toEqual(translations)
    await expect(user(outsider, 'select admin_set_offer_translations($1,$2,$3)', [offer.id, JSON.stringify(source), JSON.stringify(translations)])).rejects.toThrow('Not authorized')
    await expect(user(admin, 'select admin_set_offer_translations($1,$2,$3)', [offer.id, JSON.stringify({ ...source, title: 'stale' }), JSON.stringify(translations)])).rejects.toThrow('Offer changed')
    const edited = (await user(admin, 'select * from admin_upsert_offer($1,$2)', [offer.id, JSON.stringify({ ...payload, title: 'عرض جديد' })])).rows[0]!
    expect(edited.title).toBe('عرض جديد')
    expect((await user(reader, 'select translations from public_offers where id=$1', [offer.id])).rows[0]?.translations).toEqual({})
  })
  it('returns translations with eligible announcements and preserves receipt/audience rules', async () => {
    const translated = { ar: { title: 'أهلاً', body: 'خبر جديد', details: 'تفاصيل' }, en: { title: 'Welcome', body: 'News', details: 'Details' }, he: { title: 'שלום', body: 'חדשות', details: 'פרטים' } }
    const row = (await user(admin, "select * from admin_create_broadcast_notification('أهلاً','خبر جديد','all','{}','تفاصيل',7,$1)", [JSON.stringify(translated)])).rows[0]!
    const visible = (await user(reader, 'select * from get_my_announcements()')).rows.find(r => r.id === row.id)
    expect(visible?.translations).toEqual(translated)
    await user(reader, 'select mark_announcement_popup_shown($1)', [row.id])
    await user(reader, 'select mark_announcements_read($1)', [[row.id]])
    expect((await user(reader, 'select * from get_my_announcements()')).rows.find(r => r.id === row.id)?.read_at).not.toBeNull()
    const restricted = (await user(admin, "select * from admin_create_broadcast_notification('test','test','volunteers')")).rows[0]!
    expect((await user(reader, 'select * from get_my_announcements()')).rows.some(r => r.id === restricted.id)).toBe(false)
  })
  it('stores translated support replies atomically and keeps them private to the conversation', async () => {
    const request = (await user(reader, "select * from support_send_message('سؤال')")).rows[0]!
    const translated = { ar: { body: 'أهلاً' }, en: { body: 'Welcome' }, he: { body: 'שלום' } }
    const reply = (await user(admin, "select * from admin_support_reply($1,'أهلاً',null,$2)", [request.conversation_id, JSON.stringify(translated)])).rows[0]!
    expect((await user(reader, 'select translations from support_messages where id=$1', [reply.id])).rows[0]?.translations).toEqual(translated)
    expect((await user(outsider, 'select * from support_messages where id=$1', [reply.id])).rows).toEqual([])
    await expect(user(outsider, "select admin_support_reply($1,'fake',null,$2)", [request.conversation_id, JSON.stringify(translated)])).rejects.toThrow('Not authorized')
    const legacy = (await user(admin, "select * from admin_support_reply($1,'original')", [request.conversation_id])).rows[0]!
    expect(legacy.translations).toEqual({})
  })
  it('uses each installation language and rejects changing someone else’s device', async () => {
    await user(reader, "select register_push_device('ExpoPushToken[reader]',true)")
    await user(reader, "select set_push_device_language('ExpoPushToken[reader]','he')")
    await user(outsider, "select set_push_device_language('ExpoPushToken[reader]','en')")
    await expect(user(reader, "select set_push_device_language('ExpoPushToken[reader]','invalid')")).rejects.toThrow('Invalid language')
    await expect(user(reader, 'select * from get_localized_push_recipients()')).rejects.toMatchObject({ code: '42501' })
    await db.exec('reset role; set role service_role')
    expect((await db.query('select token,language from get_localized_push_recipients()')).rows).toEqual([{ token: 'ExpoPushToken[reader]', language: 'he' }])
  })
})
