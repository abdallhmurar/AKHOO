-- SANAD v0.2 features migration.
-- Run this once in the Supabase SQL Editor, after supabase/schema.sql.
-- Safe to re-run (idempotent).

-- ── New columns ─────────────────────────────────────────────────────────

alter table public.help_requests
  add column if not exists photo_url text;

alter table public.volunteer_profiles
  add column if not exists services text[] not null default '{}',
  add column if not exists is_verified boolean not null default false,
  add column if not exists push_token text;

alter table public.volunteer_profiles drop constraint if exists volunteer_services_valid;
alter table public.volunteer_profiles add constraint volunteer_services_valid check (
  services <@ array['battery','tire','fuel','locked_car','other']::text[]
);

alter table public.profiles
  add column if not exists is_admin boolean not null default false,
  add column if not exists is_banned boolean not null default false;

-- ── Requests: banned users cannot open new requests ────────────────────
--
-- Same rule as below: never raw-query public.profiles from a policy on
-- another table when that table's own policies are (transitively) queried
-- back from a profiles policy - public.profiles' "profiles read relevant"
-- policy already queries help_requests, so a raw profiles subquery here
-- would form a two-table mutual RLS reference and Postgres rejects it as
-- recursive. Route through a SECURITY DEFINER function instead.

create or replace function public.is_banned()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((select p.is_banned from public.profiles p where p.id = auth.uid()), false)
$$;

grant execute on function public.is_banned() to authenticated;

drop policy if exists "request insert self" on public.help_requests;
create policy "request insert self" on public.help_requests for insert to authenticated with check (
  auth.uid() = requester_id
  and not public.is_banned()
);

-- ── Admin read access (moderation) ─────────────────────────────────────
--
-- IMPORTANT: a policy on public.profiles must never query public.profiles
-- directly (even transitively) - Postgres re-evaluates that table's SELECT
-- policies for the subquery, which re-enters the same policy forever
-- ("infinite recursion detected in policy for relation profiles"). Route the
-- admin check through this SECURITY DEFINER function instead: it runs as
-- the (RLS-bypassing) function owner, so its internal lookup does not
-- re-trigger RLS.

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = auth.uid()), false)
$$;

grant execute on function public.is_admin() to authenticated;

drop policy if exists "profiles read admin" on public.profiles;
create policy "profiles read admin" on public.profiles for select to authenticated using (
  public.is_admin()
);

drop policy if exists "volunteer read admin" on public.volunteer_profiles;
create policy "volunteer read admin" on public.volunteer_profiles for select to authenticated using (
  public.is_admin()
);

drop policy if exists "request read admin" on public.help_requests;
create policy "request read admin" on public.help_requests for select to authenticated using (
  public.is_admin()
);

-- ── Admin RPCs (security definer, self-check is_admin) ─────────────────

create or replace function public.admin_cancel_help_request(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  update public.help_requests
  set status = 'cancelled'
  where id = p_request_id
    and status not in ('completed', 'cancelled');
end;
$$;

grant execute on function public.admin_cancel_help_request(uuid) to authenticated;

create or replace function public.admin_set_user_banned(p_user_id uuid, p_banned boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  update public.profiles set is_banned = p_banned where id = p_user_id;
end;
$$;

grant execute on function public.admin_set_user_banned(uuid, boolean) to authenticated;

create or replace function public.admin_set_volunteer_verified(p_user_id uuid, p_verified boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  update public.volunteer_profiles set is_verified = p_verified where user_id = p_user_id;
end;
$$;

grant execute on function public.admin_set_volunteer_verified(uuid, boolean) to authenticated;

-- ── Storage bucket for request photos ───────────────────────────────────
-- Path convention: <requester_id>/<filename>. Public read (photos are not
-- sensitive like GPS/phone), write restricted to the owning folder.

insert into storage.buckets (id, name, public)
values ('request-photos', 'request-photos', true)
on conflict (id) do nothing;

drop policy if exists "request photos public read" on storage.objects;
create policy "request photos public read" on storage.objects for select to public using (
  bucket_id = 'request-photos'
);

drop policy if exists "request photos owner insert" on storage.objects;
create policy "request photos owner insert" on storage.objects for insert to authenticated with check (
  bucket_id = 'request-photos'
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- To make yourself an admin, run manually after signing up:
-- update public.profiles set is_admin = true where id = '<your-user-uuid>';
