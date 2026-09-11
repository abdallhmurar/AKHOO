-- Chat between a requester and the volunteer helping them, scoped to one
-- help request. Keyed on help_requests.id (not the newer "missions" v2
-- table - confirmed not yet live in this project, missionRepository still
-- falls back to the legacy help_requests-only path) so it works with
-- whichever mission representation the app is currently reading through.

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.help_requests(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text,
  media_url text,
  media_type text check (media_type in ('image', 'video')),
  created_at timestamptz not null default now(),
  constraint messages_body_or_media check (body is not null or media_url is not null)
);

create index if not exists messages_request_created_idx on public.messages(request_id, created_at);

alter table public.messages enable row level security;

drop policy if exists "messages readable by request participants" on public.messages;
create policy "messages readable by request participants" on public.messages for select to authenticated using (
  exists (
    select 1 from public.help_requests hr
    where hr.id = messages.request_id
      and (hr.requester_id = auth.uid() or hr.volunteer_id = auth.uid())
  )
);

drop policy if exists "messages insertable by request participants" on public.messages;
create policy "messages insertable by request participants" on public.messages for insert to authenticated with check (
  sender_id = auth.uid()
  and exists (
    select 1 from public.help_requests hr
    where hr.id = messages.request_id
      and (hr.requester_id = auth.uid() or hr.volunteer_id = auth.uid())
  )
);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;

-- ── Storage bucket for chat media (photos and videos) ───────────────────
-- Path convention: <sender_id>/<filename>. Public read (same reasoning as
-- request-photos - media is not sensitive like GPS/phone), write
-- restricted to the uploading sender's own folder.

insert into storage.buckets (id, name, public)
values ('mission-chat', 'mission-chat', true)
on conflict (id) do nothing;

drop policy if exists "mission chat media public read" on storage.objects;
create policy "mission chat media public read" on storage.objects for select to public using (
  bucket_id = 'mission-chat'
);

drop policy if exists "mission chat media owner insert" on storage.objects;
create policy "mission chat media owner insert" on storage.objects for insert to authenticated with check (
  bucket_id = 'mission-chat'
  and auth.uid()::text = (storage.foldername(name))[1]
);
