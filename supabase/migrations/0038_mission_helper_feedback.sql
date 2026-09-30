-- The helper's own star rating of their experience helping on a mission -
-- distinct from mission_ratings (0019), which is the requester rating the
-- helper's quality of help. This is not "rate the requester" (rating the
-- person you just helped is an awkward, judgy thing to ask of a volunteer);
-- it's a plain experience/satisfaction rating, same shape and one-row-per-
-- request convention as mission_ratings, but keyed to the helper's side.

create table if not exists public.mission_helper_feedback (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique references public.help_requests(id) on delete cascade,
  helper_id uuid not null references auth.users(id) on delete cascade,
  stars smallint not null check (stars between 1 and 5),
  created_at timestamptz not null default now()
);

alter table public.mission_helper_feedback enable row level security;

drop policy if exists "mission helper feedback readable by helper" on public.mission_helper_feedback;
create policy "mission helper feedback readable by helper" on public.mission_helper_feedback for select to authenticated using (
  helper_id = auth.uid()
);

drop policy if exists "mission helper feedback readable by admin" on public.mission_helper_feedback;
create policy "mission helper feedback readable by admin" on public.mission_helper_feedback for select to authenticated using (
  public.is_admin()
);

drop policy if exists "helper can rate own completed mission" on public.mission_helper_feedback;
create policy "helper can rate own completed mission" on public.mission_helper_feedback for insert to authenticated with check (
  helper_id = auth.uid()
  and exists (
    select 1 from public.help_requests hr
    where hr.id = request_id
      and hr.volunteer_id = auth.uid()
      and hr.status = 'completed'
  )
);
