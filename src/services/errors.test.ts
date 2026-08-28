import { describe, expect, it } from 'vitest'
import { isMissingDatabaseObject } from './errors'

describe('isMissingDatabaseObject', () => {
  it('recognizes a missing table (42P01)', () => {
    expect(isMissingDatabaseObject({ code: '42P01', message: 'relation "missions" does not exist' })).toBe(true)
  })

  it('recognizes a missing column (42703)', () => {
    expect(isMissingDatabaseObject({ code: '42703' })).toBe(true)
  })

  // PostgREST's actual code for "this RPC function does not exist" - every
  // V2-first repository method (missionRepository.accept/advance/cancel/
  // confirmCompletion, etc.) calls a not-yet-migrated RPC first and relies
  // on this check to fall back to the real legacy RPC. Missing this code
  // meant the fallback never triggered and every mission action failed
  // with a raw, untranslated error against the real (unmigrated) database -
  // confirmed live: accept and cancel both errored with no fallback.
  it('recognizes a missing RPC function (PGRST202)', () => {
    expect(isMissingDatabaseObject({ code: 'PGRST202', message: 'Could not find the function public.cancel_mission(p_mission_id, p_reason) in the schema cache' })).toBe(true)
  })

  it('recognizes the raw Postgres undefined_function code (42883)', () => {
    expect(isMissingDatabaseObject({ code: '42883', message: 'function cancel_mission(uuid, text) does not exist' })).toBe(true)
  })

  it('recognizes missing-relationship and missing-table PostgREST codes', () => {
    expect(isMissingDatabaseObject({ code: 'PGRST200' })).toBe(true)
    expect(isMissingDatabaseObject({ code: 'PGRST204' })).toBe(true)
    expect(isMissingDatabaseObject({ code: 'PGRST205' })).toBe(true)
  })

  it('returns false for an unrelated error', () => {
    expect(isMissingDatabaseObject({ code: '23505', message: 'duplicate key value violates unique constraint' })).toBe(false)
  })

  it('returns false for null/undefined', () => {
    expect(isMissingDatabaseObject(null)).toBe(false)
    expect(isMissingDatabaseObject(undefined)).toBe(false)
  })
})
