import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { asUser, createTestDatabase } from '../../test/database'

const owner = '00000000-0000-0000-0000-000000000001'
const stranger = '00000000-0000-0000-0000-000000000002'
let db: PGlite
const user = (id: string, sql: string, params: unknown[] = []) => asUser(db, id, sql, params)
const pack = async () => { await db.exec('reset role'); return (await db.query<{ sound_pack: number }>("select sound_pack from push_devices where token='ExponentPushToken[a]'")).rows[0]!.sound_pack }

beforeAll(async () => {
  db = await createTestDatabase()
  for (const id of [owner, stranger]) await db.query('insert into auth.users(id) values($1)', [id])
  await user(owner, "select register_push_device('ExponentPushToken[a]', true)")
}, 60000)
afterAll(async () => { await db?.close() })

describe('push device sound pack', () => {
  it('starts at 0 so older builds keep the default sound', async () => {
    expect(await pack()).toBe(0)
  })
  it('is reported by the device that owns the token', async () => {
    await user(owner, "select set_push_device_sound_pack('ExponentPushToken[a]', 1::smallint)")
    expect(await pack()).toBe(1)
  })
  it('cannot be changed for somebody else\'s device', async () => {
    await user(stranger, "select set_push_device_sound_pack('ExponentPushToken[a]', 0::smallint)")
    expect(await pack()).toBe(1)
  })
  it('rejects nonsense values and anonymous callers', async () => {
    await expect(user(owner, "select set_push_device_sound_pack('ExponentPushToken[a]', 500::smallint)")).rejects.toThrow('Invalid sound pack')
    await expect(user(owner, "select set_push_device_sound_pack('ExponentPushToken[a]', (-1)::smallint)")).rejects.toThrow('Invalid sound pack')
    await db.exec('reset role')
    await db.exec("select set_config('request.jwt.claim.sub', '', false)")
    await db.exec('set role authenticated')
    await expect(db.query("select set_push_device_sound_pack('ExponentPushToken[a]', 1::smallint)")).rejects.toThrow('Not authorized')
    expect(await pack()).toBe(1)
  })
})
