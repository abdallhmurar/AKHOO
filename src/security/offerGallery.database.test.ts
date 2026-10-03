import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { asUser, createTestDatabase } from '../../test/database'

const admin = '00000000-0000-0000-0000-000000000001'
const reader = '00000000-0000-0000-0000-000000000002'
const first = 'https://example.com/cover.png'
const second = 'https://example.com/detail.png'
const base = { title: 'Gallery offer', discount_type: 'free_benefit', points_required: 50 }
let db: PGlite
const upsert = async (payload: Record<string, unknown>, id: unknown = null, actor = admin) =>
  (await asUser(db, actor, 'select * from admin_upsert_offer($1,$2::jsonb)', [id, JSON.stringify({ ...base, ...payload })])).rows[0]!

beforeAll(async () => {
  db = await createTestDatabase()
  await db.query('insert into auth.users(id) values($1),($2)', [admin, reader])
  await db.exec("begin; select set_config('sanad.privileged_write','on',true)")
  await db.query('update profiles set is_admin=true where id=$1', [admin])
  await db.exec('commit')
}, 60000)
afterAll(async () => { await db?.close() })

describe('offer galleries and custom display types', () => {
  it('saves ordered photos and type, publishes them, and keeps the legacy cover synchronized', async () => {
    const offer = await upsert({ image_urls: [first, second], offer_type_label: '  ملصق أخوو  ' })
    expect(offer).toMatchObject({ image_url: first, image_urls: [first, second], offer_type_label: 'ملصق أخوو', points_required: 50, discount_type: 'free_benefit' })
    expect((await asUser(db, reader, 'select * from public_offers where id=$1', [offer.id])).rows).toHaveLength(0)
    await asUser(db, admin, "select admin_set_offer_status($1,'approved')", [offer.id])
    expect((await asUser(db, reader, 'select * from public_offers where id=$1', [offer.id])).rows[0]).toMatchObject({ image_urls: [first, second], offer_type_label: 'ملصق أخوو' })
    expect(await upsert({ image_urls: [second, first], offer_type_label: 'هدية' }, offer.id)).toMatchObject({ image_url: second, image_urls: [second, first], offer_type_label: 'هدية' })
    expect(await upsert({ image_urls: [], offer_type_label: '' }, offer.id)).toMatchObject({ image_url: null, image_urls: [], offer_type_label: null })
  })

  it('supports old callers without dropping their image or an unchanged gallery', async () => {
    const legacy = await upsert({ image_url: first })
    expect(legacy).toMatchObject({ image_url: first, image_urls: [first] })
    await upsert({ image_urls: [first, second], offer_type_label: 'Gift' }, legacy.id)
    expect(await upsert({ image_url: first }, legacy.id)).toMatchObject({ image_urls: [first, second], offer_type_label: 'Gift' })
    expect(await upsert({ image_url: second }, legacy.id)).toMatchObject({ image_url: second, image_urls: [second] })
  })

  it('rejects oversized or malformed galleries and labels without bypassing pricing or admin checks', async () => {
    for (const images of [null, 'bad', [123], ['javascript:alert(1)'], ['https://example.com/a b'], Array(7).fill(first)]) {
      await expect(upsert({ image_urls: images })).rejects.toThrow()
    }
    await expect(upsert({ offer_type_label: 'x'.repeat(81) })).rejects.toThrow('too long')
    await expect(upsert({ discount_type: 'percentage', discount_value: 150, offer_type_label: 'Gift' })).rejects.toThrow('Percentage discount')
    await expect(upsert({ image_urls: [first] }, null, reader)).rejects.toThrow('Not authorized')
    expect(await upsert({ image_urls: Array(6).fill(first), offer_type_label: 'x'.repeat(80) })).toMatchObject({ image_urls: Array(6).fill(first) })
  })
})
