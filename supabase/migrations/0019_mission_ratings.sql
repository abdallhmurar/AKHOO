-- One star rating (1-5) from a requester about the helper who completed
-- their request. Keyed on help_requests.id, same reasoning as 0017's chat
-- table - the "missions" v2 table isn't live yet, this app still reads
-- through the legacy help_requests-only path. One row per request
-- (unique constraint) - a request can only be rated once.

create table if not exists public.mission_ratings (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique references public.help_requests(id) on delete cascade,
  requester_id uuid not null references auth.users(id) on delete cascade,
  helper_id uuid not null references auth.users(id) on delete cascade,
  stars smallint not null check (stars between 1 and 5),
  created_at timestamptz not null default now()
);

alter table public.mission_ratings enable row level security;

drop policy if exists "mission ratings readable by request participants" on public.mission_ratings;
create policy "mission ratings readable by request participants" on public.mission_ratings for select to authenticated using (
  requester_id = auth.uid() or helper_id = auth.uid()
);

drop policy if exists "requester can rate own completed request" on public.mission_ratings;
create policy "requester can rate own completed request" on public.mission_ratings for insert to authenticated with check (
  requester_id = auth.uid()
  and exists (
    select 1 from public.help_requests hr
    where hr.id = request_id
      and hr.requester_id = auth.uid()
      and hr.status = 'completed'
      and hr.volunteer_id = helper_id
  )
);
