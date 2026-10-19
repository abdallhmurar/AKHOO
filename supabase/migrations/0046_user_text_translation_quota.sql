begin;
-- Per-user hourly allowance for "Translate" taps on text written by other users
-- (translate-user-text edge function). Counters hold no message content.
create table public.translation_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  bucket timestamptz not null,
  count integer not null default 0,
  primary key (user_id, bucket)
);
alter table public.translation_usage enable row level security;
revoke all on public.translation_usage from public, anon, authenticated;

create or replace function public.consume_translation_quota()
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_bucket timestamptz := pg_catalog.date_trunc('hour', pg_catalog.now());
  v_count integer;
begin
  if v_user is null or public.is_banned() then return false; end if;
  insert into public.translation_usage (user_id, bucket, count) values (v_user, v_bucket, 1)
  on conflict (user_id, bucket) do update set count = public.translation_usage.count + 1
  returning count into v_count;
  delete from public.translation_usage where user_id = v_user and bucket < pg_catalog.now() - interval '2 days';
  return v_count <= 60;
end;
$$;
revoke all on function public.consume_translation_quota() from public, anon;
grant execute on function public.consume_translation_quota() to authenticated;
commit;
