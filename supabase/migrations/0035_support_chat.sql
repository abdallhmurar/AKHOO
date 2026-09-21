-- In-app support chat: one continuous conversation per user with AKHOO's
-- support team, answered from the admin panel (a small CRM inbox).
--
-- Shape
--   support_conversations  one row per user (unique user_id). `status` says who
--                          must act next: open = the user wrote last (needs a
--                          reply), waiting_user = an admin replied, resolved =
--                          an admin closed it. A new user message reopens it.
--   support_messages       the messages (text and/or one image).
--   support_notes          internal admin notes about the customer; no policy
--                          lets a user read them.
--
-- Nobody writes these tables directly: users go through support_send_message
-- (caps + rate limit + ownership checks), admins through admin_support_* (each
-- re-checks is_admin(), same as every other admin mutation). The aggregate
-- columns on the conversation are kept by a trigger so they can't drift.
-- Reads are RLS-scoped (own row / admins) which is also what makes realtime
-- deliver a user only their own conversation.

begin;

create table if not exists public.support_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  status text not null default 'open' check (status in ('open', 'waiting_user', 'resolved')),
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  last_message_preview text,
  last_sender text not null default 'user' check (last_sender in ('user', 'admin')),
  last_admin_message_at timestamptz,
  user_last_read_at timestamptz
);
create index if not exists support_conversations_status_idx on public.support_conversations (status, last_message_at desc);

create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.support_conversations(id) on delete cascade,
  sender_id uuid references auth.users(id) on delete set null,
  from_admin boolean not null default false,
  body text check (body is null or char_length(body) between 1 and 4000),
  media_path text check (media_path is null or char_length(media_path) <= 200),
  media_type text check (media_type in ('image')),
  created_at timestamptz not null default now(),
  constraint support_messages_body_or_media check (body is not null or media_path is not null),
  constraint support_messages_media_pair check ((media_path is null) = (media_type is null))
);
create index if not exists support_messages_conversation_idx on public.support_messages (conversation_id, created_at);

create table if not exists public.support_notes (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.support_conversations(id) on delete cascade,
  admin_id uuid references auth.users(id) on delete set null,
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists support_notes_conversation_idx on public.support_notes (conversation_id, created_at);

alter table public.support_conversations enable row level security;
alter table public.support_messages enable row level security;
alter table public.support_notes enable row level security;

revoke all on public.support_conversations, public.support_messages, public.support_notes from anon;
revoke insert, update, delete, truncate on public.support_conversations, public.support_messages, public.support_notes from authenticated;

drop policy if exists "support conversations read own" on public.support_conversations;
create policy "support conversations read own" on public.support_conversations for select to authenticated using (
  user_id = (select auth.uid())
);
drop policy if exists "support conversations read admin" on public.support_conversations;
create policy "support conversations read admin" on public.support_conversations for select to authenticated using (
  public.is_admin()
);

drop policy if exists "support messages read own" on public.support_messages;
create policy "support messages read own" on public.support_messages for select to authenticated using (
  exists (select 1 from public.support_conversations c where c.id = support_messages.conversation_id and c.user_id = (select auth.uid()))
);
drop policy if exists "support messages read admin" on public.support_messages;
create policy "support messages read admin" on public.support_messages for select to authenticated using (
  public.is_admin()
);

drop policy if exists "support notes read admin" on public.support_notes;
create policy "support notes read admin" on public.support_notes for select to authenticated using (
  public.is_admin()
);

do $$
declare
  t text;
begin
  foreach t in array array['support_messages', 'support_conversations'] loop
    if not exists (
      select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- ── Conversation aggregates ─────────────────────────────────────────────

create or replace function public.support_message_after_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.support_conversations c set
    last_message_at = new.created_at,
    last_message_preview = pg_catalog.left(pg_catalog.regexp_replace(coalesce(new.body, ''), '\s+', ' ', 'g'), 140),
    last_sender = case when new.from_admin then 'admin' else 'user' end,
    last_admin_message_at = case when new.from_admin then new.created_at else c.last_admin_message_at end,
    status = case when new.from_admin then 'waiting_user' else 'open' end
  where c.id = new.conversation_id;
  return new;
end;
$$;
revoke all on function public.support_message_after_insert() from public, anon, authenticated;

drop trigger if exists support_message_after_insert on public.support_messages;
create trigger support_message_after_insert after insert on public.support_messages
for each row execute function public.support_message_after_insert();

-- Push to the user when an admin replies. Same webhook-secret handshake as
-- notify_new_message (0024): the secret lives in private.app_settings and is
-- never written here; with no secret configured this quietly does nothing.
create or replace function public.notify_support_reply()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_secret text;
begin
  select s.value into v_secret from private.app_settings s where s.key = 'notify_webhook_secret';
  if v_secret is null or v_secret = '' then
    return new;
  end if;
  perform net.http_post(
    url := 'https://zmpwdufahjmlxfwzafvr.supabase.co/functions/v1/notify-support-reply',
    headers := pg_catalog.jsonb_build_object('Content-Type', 'application/json', 'x-webhook-secret', v_secret),
    body := pg_catalog.jsonb_build_object('message_id', new.id)
  );
  return new;
end;
$$;
revoke all on function public.notify_support_reply() from public, anon, authenticated;

drop trigger if exists on_support_reply_created on public.support_messages;
create trigger on_support_reply_created after insert on public.support_messages
for each row when (new.from_admin) execute function public.notify_support_reply();

-- ── Audit log ───────────────────────────────────────────────────────────
-- Extends whatever the live constraint allows (see 0029/0032).
do $$
declare
  v_check text;
  v_action text;
begin
  foreach v_action in array array['support_replied', 'support_status_changed'] loop
    select pg_get_expr(conbin, conrelid) into v_check from pg_constraint
    where conrelid = 'public.admin_audit_log'::regclass and conname = 'admin_audit_log_action_check';
    if v_check like '%' || v_action || '%' then
      continue;
    end if;
    alter table public.admin_audit_log drop constraint admin_audit_log_action_check;
    execute format('alter table public.admin_audit_log add constraint admin_audit_log_action_check check ((%s) or action = %L)', v_check, v_action);
  end loop;
end;
$$;

-- ── Images ──────────────────────────────────────────────────────────────
-- Private bucket. Path: <user_id>/<file> for both the user's and an admin's
-- uploads, so a user can read exactly their own folder and admins everything.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('support-chat', 'support-chat', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = 10485760,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

drop policy if exists "support chat media read" on storage.objects;
create policy "support chat media read" on storage.objects for select to authenticated using (
  bucket_id = 'support-chat' and (split_part(name, '/', 1) = (select auth.uid())::text or public.is_admin())
);
drop policy if exists "support chat media user upload" on storage.objects;
create policy "support chat media user upload" on storage.objects for insert to authenticated with check (
  bucket_id = 'support-chat' and not public.is_banned()
  and split_part(name, '/', 1) = (select auth.uid())::text
  and array_length(string_to_array(name, '/'), 1) = 2
);
drop policy if exists "support chat media admin upload" on storage.objects;
create policy "support chat media admin upload" on storage.objects for insert to authenticated with check (
  bucket_id = 'support-chat' and public.is_admin() and array_length(string_to_array(name, '/'), 1) = 2
);
drop policy if exists "support chat media owner delete" on storage.objects;
create policy "support chat media owner delete" on storage.objects for delete to authenticated using (
  bucket_id = 'support-chat' and owner_id = (select auth.uid())::text
);

-- Account deletion removes the user's files through the Storage API; make it
-- see this bucket too (0027 lists the buckets it knows).
create or replace function public.account_storage_objects(p_user_id uuid)
returns table(bucket_id text, name text) language sql stable security definer set search_path = '' as $$
  select o.bucket_id, o.name from storage.objects o
  where o.owner_id = p_user_id::text
     or (o.bucket_id in ('avatars','request-photos','mission-chat','support-chat') and split_part(o.name, '/', 1) = p_user_id::text)
  order by o.bucket_id, o.name limit 100
$$;
revoke all on function public.account_storage_objects(uuid) from public, anon, authenticated;
grant execute on function public.account_storage_objects(uuid) to service_role;

-- ── User side ───────────────────────────────────────────────────────────

create or replace function public.support_send_message(p_body text default null, p_media_path text default null)
returns public.support_messages
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_body text := nullif(pg_catalog.btrim(coalesce(p_body, '')), '');
  v_conversation uuid;
  v_minute integer;
  v_hour integer;
  v_row public.support_messages;
begin
  if v_uid is null then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  if public.is_banned() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  if v_body is null and p_media_path is null then
    raise exception 'A message or an image is required';
  end if;
  if v_body is not null and pg_catalog.char_length(v_body) > 4000 then
    raise exception 'Message is too long (max 4000 characters)';
  end if;
  if p_media_path is not null then
    if p_media_path !~ '^[0-9a-f-]{36}/[A-Za-z0-9._-]{1,120}$' or pg_catalog.split_part(p_media_path, '/', 1) <> v_uid::text then
      raise exception 'Invalid image';
    end if;
    if not exists (select 1 from storage.objects o where o.bucket_id = 'support-chat' and o.name = p_media_path) then
      raise exception 'Invalid image';
    end if;
  end if;

  -- Serialize a user's sends so the limit below can't be raced past.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('akhoo.support.user:' || v_uid::text, 0));
  select
    pg_catalog.count(*) filter (where m.created_at > pg_catalog.now() - interval '1 minute'),
    pg_catalog.count(*)
  into v_minute, v_hour
  from public.support_messages m
  join public.support_conversations c on c.id = m.conversation_id
  where c.user_id = v_uid and not m.from_admin and m.created_at > pg_catalog.now() - interval '1 hour';
  if v_minute >= 10 or v_hour >= 100 then
    raise exception 'Too many messages. Please wait a moment and try again.';
  end if;

  insert into public.support_conversations (user_id) values (v_uid) on conflict (user_id) do nothing;
  select c.id into v_conversation from public.support_conversations c where c.user_id = v_uid;

  insert into public.support_messages (conversation_id, sender_id, from_admin, body, media_path, media_type)
  values (v_conversation, v_uid, false, v_body, p_media_path, case when p_media_path is null then null else 'image' end)
  returning * into v_row;

  return v_row;
end;
$$;
revoke all on function public.support_send_message(text, text) from public, anon;
grant execute on function public.support_send_message(text, text) to authenticated;

create or replace function public.support_mark_read()
returns void
language sql
security definer
set search_path = ''
as $$
  update public.support_conversations set user_last_read_at = pg_catalog.now() where user_id = (select auth.uid())
$$;
revoke all on function public.support_mark_read() from public, anon;
grant execute on function public.support_mark_read() to authenticated;

-- ── Admin side ──────────────────────────────────────────────────────────

create or replace function public.admin_support_reply(p_conversation_id uuid, p_body text default null, p_media_path text default null)
returns public.support_messages
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_body text := nullif(pg_catalog.btrim(coalesce(p_body, '')), '');
  v_user uuid;
  v_name text;
  v_row public.support_messages;
begin
  if not public.is_admin() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  if v_body is null and p_media_path is null then
    raise exception 'A message or an image is required';
  end if;
  if v_body is not null and pg_catalog.char_length(v_body) > 4000 then
    raise exception 'Message is too long (max 4000 characters)';
  end if;
  select c.user_id into v_user from public.support_conversations c where c.id = p_conversation_id;
  if v_user is null then
    raise exception 'Conversation not found';
  end if;
  if p_media_path is not null then
    if p_media_path !~ '^[0-9a-f-]{36}/[A-Za-z0-9._-]{1,120}$' or pg_catalog.split_part(p_media_path, '/', 1) <> v_user::text then
      raise exception 'Invalid image';
    end if;
    if not exists (select 1 from storage.objects o where o.bucket_id = 'support-chat' and o.name = p_media_path) then
      raise exception 'Invalid image';
    end if;
  end if;

  insert into public.support_messages (conversation_id, sender_id, from_admin, body, media_path, media_type)
  values (p_conversation_id, auth.uid(), true, v_body, p_media_path, case when p_media_path is null then null else 'image' end)
  returning * into v_row;

  select p.full_name into v_name from public.profiles p where p.id = v_user;
  insert into public.admin_audit_log (admin_id, action, target_type, target_id, target_label, metadata)
  values (auth.uid(), 'support_replied', 'user', v_user, v_name,
    pg_catalog.jsonb_build_object('conversation_id', p_conversation_id, 'has_image', p_media_path is not null));

  return v_row;
end;
$$;
revoke all on function public.admin_support_reply(uuid, text, text) from public, anon;
grant execute on function public.admin_support_reply(uuid, text, text) to authenticated;

create or replace function public.admin_support_set_status(p_conversation_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid;
  v_name text;
begin
  if not public.is_admin() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  if p_status not in ('open', 'waiting_user', 'resolved') then
    raise exception 'Invalid status';
  end if;
  update public.support_conversations set status = p_status where id = p_conversation_id
  returning user_id into v_user;
  if not found then
    raise exception 'Conversation not found';
  end if;
  select p.full_name into v_name from public.profiles p where p.id = v_user;
  insert into public.admin_audit_log (admin_id, action, target_type, target_id, target_label, metadata)
  values (auth.uid(), 'support_status_changed', 'user', v_user, v_name,
    pg_catalog.jsonb_build_object('conversation_id', p_conversation_id, 'status', p_status));
end;
$$;
revoke all on function public.admin_support_set_status(uuid, text) from public, anon;
grant execute on function public.admin_support_set_status(uuid, text) to authenticated;

create or replace function public.admin_support_add_note(p_conversation_id uuid, p_body text)
returns public.support_notes
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_body text := pg_catalog.btrim(coalesce(p_body, ''));
  v_row public.support_notes;
begin
  if not public.is_admin() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  if pg_catalog.char_length(v_body) not between 1 and 2000 then
    raise exception 'A note of up to 2000 characters is required';
  end if;
  if not exists (select 1 from public.support_conversations c where c.id = p_conversation_id) then
    raise exception 'Conversation not found';
  end if;
  insert into public.support_notes (conversation_id, admin_id, body) values (p_conversation_id, auth.uid(), v_body)
  returning * into v_row;
  return v_row;
end;
$$;
revoke all on function public.admin_support_add_note(uuid, text) from public, anon;
grant execute on function public.admin_support_add_note(uuid, text) to authenticated;

commit;
