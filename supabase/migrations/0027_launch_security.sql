-- Additive launch hardening. Apply after 0026, before deploying the clients.
begin;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles p
    where p.id = auth.uid() and p.is_admin and not p.is_banned)
$$;

-- A fresh install must never let the first arbitrary visitor become admin.
-- Bootstrap through the SQL editor/service role, not a public client RPC.
revoke all on function public.admin_bootstrap_first_admin() from public, anon, authenticated;

drop policy if exists "request insert self" on public.help_requests;
create policy "request insert self" on public.help_requests for insert to authenticated with check (
  requester_id = auth.uid() and not public.is_banned()
  and status = 'open' and volunteer_id is null
  and accepted_at is null and completed_at is null
  and awaiting_confirmation_at is null and confirmation_rejected_at is null
);

create or replace function public.protect_new_request()
returns trigger language plpgsql set search_path = '' as $$
begin
  -- Lifecycle/assignment may only be established later by the existing RPCs.
  if new.status <> 'open' or new.volunteer_id is not null
     or new.accepted_at is not null or new.completed_at is not null
     or new.awaiting_confirmation_at is not null or new.confirmation_rejected_at is not null then
    raise exception 'New requests must be open and unassigned' using errcode = '42501';
  end if;
  new.created_at := pg_catalog.now();
  return new;
end;
$$;
create trigger help_requests_protect_insert before insert on public.help_requests
for each row execute function public.protect_new_request();

-- NOT VALID preserves historical rows for explicit review; all new writes
-- are checked immediately. Do not silently rewrite existing points/history.
alter table public.help_requests add constraint help_requests_distinct_participants
check (volunteer_id is null or volunteer_id <> requester_id) not valid;

create or replace function public.protect_volunteer_verified_column()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if current_setting('sanad.privileged_write', true) is distinct from 'on' then
    if TG_OP = 'INSERT' then new.is_verified := false;
    else new.is_verified := old.is_verified;
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists volunteer_profiles_protect_verified on public.volunteer_profiles;
create trigger volunteer_profiles_protect_verified before insert or update on public.volunteer_profiles
for each row execute function public.protect_volunteer_verified_column();

create or replace function public.confirm_help_request_completion(p_request_id uuid, p_confirmed boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_request public.help_requests;
  v_points integer;
begin
  if auth.uid() is null or public.is_banned() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  if p_confirmed is null then raise exception 'Confirmation is required'; end if;
  select * into v_request from public.help_requests
  where id = p_request_id and requester_id = auth.uid() for update;
  if not found then raise exception 'Request not found'; end if;
  -- A retried confirmation is harmless and cannot award points twice.
  if v_request.status = 'completed' and p_confirmed then return; end if;
  if v_request.status <> 'awaiting_confirmation' or v_request.volunteer_id is null
     or v_request.volunteer_id = v_request.requester_id or v_request.accepted_at is null then
    raise exception 'Invalid status transition';
  end if;
  if p_confirmed then
    update public.help_requests set status = 'completed', completed_at = now() where id = p_request_id;
    select value::integer into v_points from private.app_settings where key = 'points_per_mission';
    insert into public.volunteer_point_transactions (volunteer_id, request_id, points, reason)
    values (v_request.volunteer_id, p_request_id, coalesce(v_points, 10), 'completed_verified_mission')
    on conflict (request_id, reason) do nothing;
  else
    update public.help_requests set status = 'arrived', confirmation_rejected_at = now() where id = p_request_id;
  end if;
end;
$$;

-- Normalize old public URLs into object paths, then close the public bucket.
update public.messages set media_url = regexp_replace(media_url,
  '^https?://[^/]+/storage/v1/object/public/mission-chat/', '')
where media_url ~ '^https?://[^/]+/storage/v1/object/public/mission-chat/';
update storage.buckets set public = false, file_size_limit = 26214400,
  allowed_mime_types = array['image/jpeg','image/png','image/webp','video/mp4','video/quicktime']
where id = 'mission-chat';
drop policy if exists "mission chat media public read" on storage.objects;
drop policy if exists "mission chat media owner insert" on storage.objects;

create or replace function public.can_read_chat_media(p_name text)
returns boolean language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and not public.is_banned() and (
    split_part(p_name, '/', 1) = auth.uid()::text
    or exists (
      select 1 from public.messages m join public.help_requests hr on hr.id = m.request_id
      where m.media_url = p_name and (
        auth.uid() in (hr.requester_id, hr.volunteer_id)
        or public.admin_may_read_request_messages(hr.id)
      )
    )
  )
$$;
revoke all on function public.can_read_chat_media(text) from public, anon;
grant execute on function public.can_read_chat_media(text) to authenticated;
create policy "mission chat media participants read" on storage.objects for select to authenticated
using (bucket_id = 'mission-chat' and public.can_read_chat_media(name));
create policy "mission chat media participant upload" on storage.objects for insert to authenticated with check (
  bucket_id = 'mission-chat' and not public.is_banned()
  and split_part(name, '/', 1) = auth.uid()::text
  and exists (select 1 from public.help_requests hr
    where hr.id::text = split_part(name, '/', 2)
    and hr.volunteer_id is not null and auth.uid() in (hr.requester_id, hr.volunteer_id))
);
create policy "mission chat media owner delete" on storage.objects for delete to authenticated using (
  bucket_id = 'mission-chat' and split_part(name, '/', 1) = auth.uid()::text
);

-- Delete storage through its API (never DELETE storage.objects directly).
-- Only the account-deletion Edge Function can enumerate a verified caller's
-- owned files, including nested chat paths and files from older clients.
create or replace function public.account_storage_objects(p_user_id uuid)
returns table(bucket_id text, name text) language sql stable security definer set search_path = '' as $$
  select o.bucket_id, o.name from storage.objects o
  where o.owner_id = p_user_id::text
     or (o.bucket_id in ('avatars','request-photos','mission-chat') and split_part(o.name, '/', 1) = p_user_id::text)
  order by o.bucket_id, o.name limit 100
$$;
revoke all on function public.account_storage_objects(uuid) from public, anon, authenticated;
grant execute on function public.account_storage_objects(uuid) to service_role;

commit;
