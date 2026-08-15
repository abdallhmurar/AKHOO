-- Fixes an "infinite recursion detected in policy" error introduced by
-- 0002_v0_2_features.sql: "request insert self" raw-queried public.profiles
-- for the banned check, and public.profiles' own "profiles read relevant"
-- policy queries help_requests back - a two-table mutual RLS reference,
-- which Postgres rejects outright. Route the banned check through a
-- SECURITY DEFINER function (same pattern as public.is_admin()) so it
-- bypasses RLS internally instead of re-entering it.

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
