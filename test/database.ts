import { readFileSync, readdirSync } from 'node:fs'
import { PGlite } from '@electric-sql/pglite'

export async function createTestDatabase() {
  const db = new PGlite()
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create schema storage; create schema extensions;
    create table auth.users (id uuid primary key, raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
    $$;
    create table storage.buckets (id text primary key, name text, public boolean default false,
      file_size_limit bigint, allowed_mime_types text[]);
    create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text references storage.buckets,
      name text, owner_id text, unique(bucket_id, name));
    alter table storage.objects enable row level security;
    create function storage.foldername(text) returns text[] language sql as $$ select string_to_array($1, '/') $$;
    create publication supabase_realtime;
    grant usage on schema auth, storage, public to anon, authenticated, service_role;
    grant all on all tables in schema storage to authenticated, service_role;
    alter default privileges in schema public grant all on tables to authenticated, service_role;
    alter default privileges in schema public grant usage on sequences to authenticated, service_role;
  `)
  const dir = new URL('../supabase/migrations/', import.meta.url)
  for (const file of readdirSync(dir).filter(f => f.endsWith('.sql')).sort()) {
    // pgcrypto/pg_net are hosted extensions, unavailable in WASM. Core UUID
    // generation is real; webhook secrets are absent so no network is invoked.
    const sql = readFileSync(new URL(file, dir), 'utf8').replace(/^create extension[^;]+;/gm, '')
    try { await db.exec(sql) } catch (error) { await db.close(); throw new Error(`Migration ${file} failed`, { cause: error }) }
  }
  return db
}

export async function asUser(db: PGlite, id: string, sql: string, params: unknown[] = []) {
  await db.exec('reset role')
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [id])
  await db.exec('set role authenticated')
  return db.query<Record<string, unknown>>(sql, params)
}
