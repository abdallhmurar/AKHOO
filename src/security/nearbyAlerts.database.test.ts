import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { asUser, createTestDatabase } from '../../test/database'
import { nearbyVolunteers } from '../../supabase/functions/_shared/nearby'
import { allowedUsers } from '../../supabase/functions/_shared/notifications'

const requester = '00000000-0000-0000-0000-000000000001'
const near = '00000000-0000-0000-0000-000000000002'
const stale = '00000000-0000-0000-0000-000000000003'
const far = '00000000-0000-0000-0000-000000000004'
let db: PGlite
let request: { id: string; requester_id: string; latitude: number; longitude: number }
const user = (id: string, sql: string, params: unknown[] = []) => asUser(db, id, sql, params)
const owner = async (sql: string, params: unknown[] = []) => { await db.exec('reset role'); return db.query<Record<string, unknown>>(sql, params) }

// Execute the edge function's actual filters against PostgreSQL. The adapter
// only translates query-builder operations; it does not choose eligible users.
const edgeDb = {
  from(table: string) {
    expect(table).toBe('volunteer_profiles')
    const filters: string[] = []
    const values: unknown[] = []
    const add = (column: string, op: string, value: unknown) => {
      expect(['is_available', 'updated_at']).toContain(column)
      values.push(value)
      filters.push(`${column} ${op} $${values.length}`)
      return builder
    }
    const builder = {
      select: (_columns: string) => builder,
      eq: (column: string, value: unknown) => add(column, '=', value),
      gt: (column: string, value: unknown) => add(column, '>', value),
      order: (column: string) => { expect(column).toBe('user_id'); return builder },
      async range(from: number, to: number) {
        const result = await owner(`select user_id, latitude, longitude from volunteer_profiles where ${filters.join(' and ')} order by user_id limit $${values.length + 1} offset $${values.length + 2}`, [...values, to - from + 1, from])
        return { data: result.rows, error: null }
      }
    }
    return builder
  }
}

beforeAll(async () => { db = await createTestDatabase() }, 60000)
afterAll(async () => { await db?.close() })
beforeEach(async () => {
  await db.exec("reset role; truncate auth.users cascade; select set_config('request.jwt.claim.sub','',false)")
  for (const id of [requester, near, stale, far]) await db.query('insert into auth.users(id) values($1)', [id])
  // Equivalent to enrollment from Home/Account; no helper screen or heartbeat.
  for (const id of [near, stale, far]) {
    await user(id, 'insert into volunteer_profiles(user_id,is_available,latitude,longitude,updated_at) values($1,true,$2,35.21,now()-$3::interval)', [id, id === far ? 32.5 : 31.77, id === stale ? '25 hours' : '2 hours'])
    await user(id, 'select register_push_device($1,true)', [`ExpoPushToken[device-${id}]`])
  }
  request = (await user(requester, "insert into help_requests(requester_id,service_type,latitude,longitude) values($1,'battery',31.77,35.21) returning id,requester_id,latitude,longitude", [requester])).rows[0] as typeof request
})

describe('nearby alert enrollment with the full database rules', () => {
  it('can notify an enrolled user whose UI has been closed for two hours, but not stale or distant locations', async () => {
    const audience = await nearbyVolunteers(edgeDb, request)
    expect(audience.nearby).toEqual([near])
    const devices = await owner('select * from get_request_push_recipients($1::uuid[],$2::uuid)', [audience.nearby, requester])
    expect(devices.rows.map(row => row.user_id)).toEqual([near])
    // The next authorized background fix restores a previously stale account.
    await user(stale, 'update volunteer_profiles set latitude=31.77,longitude=35.21,updated_at=now() where user_id=$1', [stale])
    expect((await nearbyVolunteers(edgeDb, request)).nearby.sort()).toEqual([near, stale])
  })

  it('keeps busy accounts unavailable even when foreground enrollment asks for availability', async () => {
    await user(near, "insert into help_requests(requester_id,service_type,latitude,longitude) values($1,'battery',31.77,35.21)", [near])
    await user(near, 'update volunteer_profiles set is_available=true,latitude=31.77,updated_at=now() where user_id=$1', [near])
    expect((await nearbyVolunteers(edgeDb, request)).nearby).toEqual([])
  })

  it('respects request opt-out and does not expose the recipients location to other users', async () => {
    await user(near, 'select set_my_notification_preferences($1::jsonb)', [{ requests: false }])
    const audience = await nearbyVolunteers(edgeDb, request)
    const prefs = await owner('select user_id,requests from notification_preferences')
    expect(allowedUsers('requests', audience.nearby, prefs.rows as { user_id: string; requests: boolean }[])).toEqual([])
    expect((await user(requester, 'select latitude,longitude from volunteer_profiles where user_id=$1', [near])).rows).toEqual([])
  })
})
