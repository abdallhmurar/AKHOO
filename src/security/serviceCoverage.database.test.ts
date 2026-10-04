import { afterAll, beforeAll, expect, it } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { asUser, createTestDatabase } from '../../test/database'

let db: PGlite
beforeAll(async () => { db = await createTestDatabase() }, 60000)
afterAll(async () => { await db?.close() })

it('ends the city pilot and permits requests across the expanded service region', async () => {
  expect((await db.query("select * from pilot_zones where market='IL' and active")).rows).toHaveLength(0)
  const locations = [
    [32.794, 34.990], // Haifa
    [32.085, 34.782], // Tel Aviv
    [31.904, 35.204], // Ramallah
    [32.222, 35.262], // Nablus
    [31.502, 34.466], // Gaza
    [31.252, 34.791], // Beersheba
    [29.558, 34.952], // Eilat
  ]
  for (const [index, [latitude, longitude]] of locations.entries()) {
    const id = `00000000-0000-0000-0000-${String(index + 100).padStart(12, '0')}`
    await db.exec('reset role')
    await db.query('insert into auth.users(id) values($1)', [id])
    const result = await asUser(db, id, "insert into help_requests(requester_id,service_type,latitude,longitude) values($1,'battery',$2,$3) returning id", [id, latitude, longitude])
    expect(result.rows).toHaveLength(1)
  }
})
