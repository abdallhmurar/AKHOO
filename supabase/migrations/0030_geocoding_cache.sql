begin;
create table private.geocoding_cache (
  cache_key text primary key, result jsonb not null, expires_at timestamptz not null
);
create table private.geocoding_rate_limit (
  id boolean primary key default true check(id), next_at timestamptz not null default now()
);
insert into private.geocoding_rate_limit(id) values(true);
create or replace function public.lookup_geocode_cache(p_key text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select result from private.geocoding_cache where cache_key=p_key and expires_at>now()
$$;
create or replace function public.claim_geocode_slot()
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  -- One request per >1 second across ALL devices and Edge instances.
  update private.geocoding_rate_limit set next_at=clock_timestamp()+interval '1100 milliseconds'
  where id and next_at<=clock_timestamp();
  return found;
end;
$$;
create or replace function public.save_geocode_cache(p_key text,p_result jsonb)
returns void language plpgsql security definer set search_path = '' as $$
begin
  delete from private.geocoding_cache where expires_at<now();
  insert into private.geocoding_cache values(p_key,p_result,now()+interval '7 days')
  on conflict(cache_key) do update set result=excluded.result,expires_at=excluded.expires_at;
end;
$$;
revoke all on function public.lookup_geocode_cache(text) from public,anon,authenticated;
revoke all on function public.claim_geocode_slot() from public,anon,authenticated;
revoke all on function public.save_geocode_cache(text,jsonb) from public,anon,authenticated;
grant execute on function public.lookup_geocode_cache(text) to service_role;
grant execute on function public.claim_geocode_slot() to service_role;
grant execute on function public.save_geocode_cache(text,jsonb) to service_role;
commit;
