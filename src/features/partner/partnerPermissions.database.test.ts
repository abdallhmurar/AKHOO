/// <reference types="node" />
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { PGlite } from '@electric-sql/pglite'

const ids = {
  admin: '00000000-0000-0000-0000-000000000001',
  owner: '00000000-0000-0000-0000-000000000002',
  staff: '00000000-0000-0000-0000-000000000003',
  ordinary: '00000000-0000-0000-0000-000000000004',
  business: '00000000-0000-0000-0000-000000000011',
  other: '00000000-0000-0000-0000-000000000012'
}
const migration = (name: string) => readFileSync(new URL(`../../../supabase/migrations/${name}.sql`, import.meta.url), 'utf8')
let db: PGlite

async function asUser(id: string, sql: string, params: unknown[] = []) {
  await db.exec('reset role')
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [id])
  await db.exec('set role authenticated')
  return db.query<Record<string, unknown>>(sql, params)
}
const grant = (user = ids.owner, business = ids.business, role = 'owner', active = true) => asUser(ids.admin,
  'select * from public.admin_set_partner_access($1, $2, $3, $4)', [user, business, role, active])

beforeAll(async () => {
  db = new PGlite()
  // Minimal Supabase identity and existing-table fixtures; actual shared
  // authorization helpers and the complete new migration execute in PostgreSQL.
  await db.exec(`
    create role anon; create role authenticated;
    create schema auth;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
    $$;
    grant usage on schema auth, public to anon, authenticated;
    create table public.profiles (id uuid primary key references auth.users, full_name text, is_admin boolean default false, is_banned boolean default false);
    create table public.partners (id uuid primary key, name text not null);
    alter table public.partners enable row level security;
    grant select on public.partners to authenticated;
    create table public.admin_audit_log (
      id uuid primary key default gen_random_uuid(), admin_id uuid references auth.users,
      action text constraint admin_audit_log_action_check check (action in ('user_banned')),
      target_type text, target_id uuid, target_label text, metadata jsonb, created_at timestamptz default now()
    );
  `)
  for (const [file, name] of [['0002_v0_2_features', 'is_admin'], ['0003_fix_help_requests_recursion', 'is_banned'], ['0008_commercial_foundation', 'set_updated_at']]) {
    const match = migration(file!).match(new RegExp(`create or replace function public\\.${name}\\(\\)[\\s\\S]*?\\$\\$;`, 'i'))
    if (!match) throw new Error(`Missing existing helper ${name}`)
    await db.exec(match[0])
  }
  await db.exec('create policy admin_business_read on public.partners for select to authenticated using (public.is_admin())')
  for (const [name, id] of Object.entries(ids).filter(([name]) => !['business', 'other'].includes(name))) {
    await db.query('insert into auth.users values ($1)', [id])
    await db.query('insert into public.profiles (id, full_name, is_admin) values ($1, $2, $3)', [id, name, name === 'admin'])
  }
  await db.query('insert into public.partners values ($1, $2), ($3, $4)', [ids.business, 'Linked business', ids.other, 'Other business'])
  await db.exec(migration('0026_partner_user_permissions'))
}, 30000)

beforeEach(async () => {
  await db.exec('reset role; truncate public.partner_users, public.admin_audit_log; update public.profiles set is_banned = false')
})
afterAll(async () => { await db?.close() })

describe('Partner permission migration and RLS', () => {
  it('grants, changes business/role, revokes and reactivates one persistent relationship with audit history', async () => {
    const first = (await grant()).rows[0]
    expect(first).toMatchObject({ user_id: ids.owner, partner_id: ids.business, role: 'owner', is_active: true, created_by: ids.admin })
    await grant() // A retry must not duplicate rows or audit events.
    expect((await grant(ids.owner, ids.other, 'staff')).rows[0]).toMatchObject({ id: first?.id, partner_id: ids.other, role: 'staff' })
    await asUser(ids.admin, 'select public.admin_revoke_partner_access($1)', [ids.owner])
    await asUser(ids.admin, 'select public.admin_revoke_partner_access($1)', [ids.owner])
    expect((await asUser(ids.owner, 'select * from public.get_my_partner_context()')).rows).toEqual([])
    expect((await asUser(ids.admin, 'select * from public.partner_users')).rows[0]).toMatchObject({ id: first?.id, is_active: false })
    await grant(ids.owner, ids.other, 'staff')
    await db.exec('reset role')
    const audit = await db.query<{ action: string; target_id: string }>('select action, target_id from public.admin_audit_log order by created_at')
    expect(audit.rows.map(row => row.action)).toEqual(['partner_access_granted', 'partner_access_updated', 'partner_access_revoked', 'partner_access_granted'])
    expect(audit.rows.every(row => row.target_id === ids.owner)).toBe(true)
  })

  it('limits both roles to their own active relationship and linked business context', async () => {
    await grant()
    await grant(ids.staff, ids.other, 'staff')
    for (const [user, business] of [[ids.owner, ids.business], [ids.staff, ids.other]]) {
      expect((await asUser(user!, 'select * from public.partner_users')).rows).toHaveLength(1)
      expect((await asUser(user!, 'select * from public.get_my_partner_context()')).rows[0]).toMatchObject({ user_id: user, partner_id: business })
      expect((await asUser(user!, 'select public.has_partner_access($1) as allowed', [business])).rows[0]?.allowed).toBe(true)
      expect((await asUser(user!, 'select public.has_partner_access($1) as allowed', [business === ids.business ? ids.other : ids.business])).rows[0]?.allowed).toBe(false)
      // Context RPC does not broaden existing businesses RLS.
      expect((await asUser(user!, 'select * from public.partners')).rows).toEqual([])
    }
    expect((await asUser(ids.ordinary, 'select * from public.partner_users')).rows).toEqual([])
    expect((await asUser(ids.ordinary, 'select * from public.get_my_partner_context()')).rows).toEqual([])
    expect((await asUser(ids.admin, 'select * from public.partner_users')).rows).toHaveLength(2)
  })

  it('rejects non-admin RPCs and direct client mutations, including self-escalation', async () => {
    await grant()
    await expect(asUser(ids.owner, 'select public.admin_set_partner_access($1,$2,$3,true)', [ids.ordinary, ids.other, 'owner'])).rejects.toMatchObject({ code: '42501' })
    await expect(asUser(ids.owner, 'select public.admin_revoke_partner_access($1)', [ids.owner])).rejects.toMatchObject({ code: '42501' })
    for (const user of [ids.owner, ids.admin]) {
      await expect(asUser(user, 'update public.partner_users set role = \'owner\'')).rejects.toMatchObject({ code: '42501' })
      await expect(asUser(user, 'delete from public.partner_users')).rejects.toMatchObject({ code: '42501' })
      await expect(asUser(user, 'insert into public.partner_users (user_id,partner_id,role) values ($1,$2,$3)', [ids.ordinary, ids.business, 'owner'])).rejects.toMatchObject({ code: '42501' })
    }
  })

  it('hides disabled/banned access and rejects banned admins', async () => {
    await grant(ids.owner, ids.business, 'owner', false)
    expect((await asUser(ids.owner, 'select * from public.partner_users')).rows).toEqual([])
    await grant()
    await db.exec('reset role')
    await db.query('update public.profiles set is_banned = true where id in ($1,$2)', [ids.owner, ids.admin])
    expect((await asUser(ids.owner, 'select * from public.get_my_partner_context()')).rows).toEqual([])
    expect((await asUser(ids.owner, 'select * from public.partner_users')).rows).toEqual([])
    await expect(grant()).rejects.toMatchObject({ code: '42501' })
  })

  it('validates role, user, business and required active state without audit side effects', async () => {
    await expect(grant(ids.owner, ids.business, 'admin')).rejects.toMatchObject({ code: '22023' })
    await expect(grant(ids.owner, ids.ordinary)).rejects.toMatchObject({ code: '23503' })
    await expect(grant(ids.business)).rejects.toMatchObject({ code: '23503' })
    await expect(asUser(ids.admin, 'select public.admin_set_partner_access($1,$2,$3,null)', [ids.owner, ids.business, 'owner'])).rejects.toMatchObject({ code: '22023' })
    expect((await asUser(ids.admin, 'select * from public.partner_users')).rows).toEqual([])
  })

  it('denies anonymous table reads and function execution', async () => {
    await db.exec('reset role; set role anon')
    for (const sql of ['select * from public.partner_users', 'select * from public.get_my_partner_context()', `select public.has_partner_access('${ids.business}')`, `select public.admin_revoke_partner_access('${ids.owner}')`, `select public.admin_set_partner_access('${ids.owner}','${ids.business}','owner',true)`]) {
      await expect(db.query(sql)).rejects.toMatchObject({ code: '42501' })
    }
  })
})
