begin;
-- Tokens belong to installations, not a single last-login field on a profile.
create table public.push_devices (
  token text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  check (token ~ '^(ExponentPushToken|ExpoPushToken)\[[A-Za-z0-9_-]+\]$')
);
create index push_devices_user_idx on public.push_devices(user_id);
alter table public.push_devices enable row level security;
revoke all on public.push_devices from anon, authenticated;
grant all on public.push_devices to service_role;

create or replace function public.register_push_device(p_token text, p_enabled boolean)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or public.is_banned() then raise exception 'Not authorized' using errcode='42501'; end if;
  if p_enabled is null then raise exception 'Preference required'; end if;
  insert into public.push_devices(token,user_id,enabled) values(p_token,auth.uid(),p_enabled)
  on conflict(token) do update set user_id=excluded.user_id, enabled=excluded.enabled, updated_at=now();
end;
$$;
revoke all on function public.register_push_device(text,boolean) from public, anon;
grant execute on function public.register_push_device(text,boolean) to authenticated;

create or replace function public.unregister_push_device(p_token text)
returns void language sql security definer set search_path = '' as $$
  delete from public.push_devices where token=p_token and user_id=auth.uid()
$$;
revoke all on function public.unregister_push_device(text) from public, anon;
grant execute on function public.unregister_push_device(text) to authenticated;

create or replace function public.get_push_recipients(p_user_ids uuid[] default null, p_volunteers_only boolean default false)
returns table(user_id uuid, token text) language sql stable security definer set search_path = '' as $$
  select d.user_id,d.token from public.push_devices d join public.profiles p on p.id=d.user_id
  where d.enabled and not p.is_banned
    and (p_user_ids is null or d.user_id=any(p_user_ids))
    and (not p_volunteers_only or exists(select 1 from public.volunteer_profiles v where v.user_id=d.user_id))
$$;
revoke all on function public.get_push_recipients(uuid[],boolean) from public, anon, authenticated;
grant execute on function public.get_push_recipients(uuid[],boolean) to service_role;

alter table public.broadcast_notifications add column delivery_status text not null default 'queued'
  check (delivery_status in ('queued','sending','partial','failed','sent')),
  add column sending_started_at timestamptz;
update public.broadcast_notifications set delivery_status='sent' where sent_at is not null;
create table public.broadcast_push_results (
  notification_id uuid not null references public.broadcast_notifications(id) on delete cascade,
  token text not null,
  status text not null check(status in ('sending','sent','failed','unknown')),
  error text,
  updated_at timestamptz not null default now(),
  primary key(notification_id,token)
);
alter table public.broadcast_push_results enable row level security;
revoke all on public.broadcast_push_results from anon, authenticated;
grant all on public.broadcast_push_results to service_role;

create or replace function public.claim_broadcast_send(p_id uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  update public.broadcast_notifications set sending_started_at=now(),delivery_status='sending'
  where id=p_id and sent_at is null
    and (sending_started_at is null or sending_started_at < now()-interval '5 minutes');
  if not found then return false; end if;
  -- A crashed sender may have reached Expo. Keep that outcome uncertain;
  -- automatic retry must not silently duplicate those deliveries.
  update public.broadcast_push_results set status='unknown',updated_at=now()
  where notification_id=p_id and status='sending';
  return true;
end;
$$;
revoke all on function public.claim_broadcast_send(uuid) from public, anon, authenticated;
grant execute on function public.claim_broadcast_send(uuid) to service_role;
commit;
