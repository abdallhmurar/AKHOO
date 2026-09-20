begin;
-- Store categorical diagnostics only: no exception message, stack, URL,
-- access token, chat content, coordinates, phone or email is accepted.
create table public.client_error_events (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete set null,
  code text not null, domain text, operation text,
  created_at timestamptz not null default now()
);
create index client_error_events_user_time_idx on public.client_error_events(user_id,created_at);
create index client_error_events_time_idx on public.client_error_events(created_at);
alter table public.client_error_events enable row level security;
revoke all on public.client_error_events from anon,authenticated;
grant select on public.client_error_events to authenticated;
create policy "diagnostics admin read" on public.client_error_events for select to authenticated using(public.is_admin());
create or replace function public.record_client_error(p_code text,p_domain text,p_operation text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or public.is_banned() then return; end if;
  if p_code not in ('auth','forbidden','not-found','conflict','validation','rate-limited','offline','timeout','database','storage','unknown')
     or p_code is null or coalesce(p_domain,'') !~ '^[a-z-]{0,40}$' or coalesce(p_operation,'') !~ '^[a-z-]{0,60}$' then return; end if;
  perform pg_advisory_xact_lock(hashtextextended('diagnostics:'||auth.uid()::text,0));
  if (select count(*) from public.client_error_events where user_id=auth.uid() and created_at>now()-interval '1 minute')>=5 then return; end if;
  delete from public.client_error_events where created_at<now()-interval '30 days';
  insert into public.client_error_events(user_id,code,domain,operation) values(auth.uid(),p_code,p_domain,p_operation);
end;
$$;
revoke all on function public.record_client_error(text,text,text) from public,anon;
grant execute on function public.record_client_error(text,text,text) to authenticated;
commit;
