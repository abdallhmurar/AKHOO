-- SANAD v0.1 - Supabase schema
-- Run this once in Supabase SQL Editor on a fresh project.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text,
  created_at timestamptz not null default now()
);

create table if not exists public.volunteer_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  is_available boolean not null default false,
  latitude double precision,
  longitude double precision,
  updated_at timestamptz not null default now()
);

create table if not exists public.help_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  service_type text not null check (service_type in ('battery','tire','fuel','locked_car','other')),
  note text,
  latitude double precision not null,
  longitude double precision not null,
  status text not null default 'open' check (status in ('open','accepted','on_the_way','arrived','completed','cancelled')),
  volunteer_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  completed_at timestamptz
);

create index if not exists help_requests_status_created_idx on public.help_requests(status, created_at desc);
create index if not exists help_requests_requester_idx on public.help_requests(requester_id);
create index if not exists help_requests_volunteer_idx on public.help_requests(volunteer_id);

-- Create a profile automatically from signup metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    nullif(new.raw_user_meta_data->>'phone', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.volunteer_profiles enable row level security;
alter table public.help_requests enable row level security;

-- Profiles: a user sees their own profile, plus the profile of whoever they
-- are matched with on a help request (as requester or as volunteer). Phone
-- numbers are not broadcast to every authenticated user.
drop policy if exists "profiles read authenticated" on public.profiles;
drop policy if exists "profiles read relevant" on public.profiles;
create policy "profiles read relevant" on public.profiles for select to authenticated using (
  id = auth.uid()
  or exists (
    select 1 from public.help_requests hr
    where (hr.requester_id = auth.uid() and hr.volunteer_id = profiles.id)
       or (hr.volunteer_id = auth.uid() and hr.requester_id = profiles.id)
  )
);
drop policy if exists "profiles update self" on public.profiles;
create policy "profiles update self" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- Volunteer state: only the volunteer can read their own availability/location.
-- The open-requests visibility check below queries this table for the
-- current user's own row only, so this stays self-scoped with no other
-- table needing broader access.
drop policy if exists "volunteer read authenticated" on public.volunteer_profiles;
drop policy if exists "volunteer read self" on public.volunteer_profiles;
create policy "volunteer read self" on public.volunteer_profiles for select to authenticated using (auth.uid() = user_id);
drop policy if exists "volunteer insert self" on public.volunteer_profiles;
create policy "volunteer insert self" on public.volunteer_profiles for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "volunteer update self" on public.volunteer_profiles;
create policy "volunteer update self" on public.volunteer_profiles for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Requests: requester can create. Open requests are visible only to users
-- who explicitly marked themselves available as volunteers, and only within
-- the same 20km radius the app itself uses for matching (Haversine, mirrors
-- src/lib/location.ts distanceKm) so a distant volunteer's own client-side
-- filtering isn't the only thing standing between them and every open
-- request's exact coordinates nationwide.
drop policy if exists "request insert self" on public.help_requests;
create policy "request insert self" on public.help_requests for insert to authenticated with check (auth.uid() = requester_id);

drop policy if exists "request read relevant" on public.help_requests;
create policy "request read relevant" on public.help_requests for select to authenticated using (
  requester_id = auth.uid()
  or volunteer_id = auth.uid()
  or (
    status = 'open'
    and exists (
      select 1 from public.volunteer_profiles vp
      where vp.user_id = auth.uid()
        and vp.is_available = true
        and vp.latitude is not null
        and vp.longitude is not null
        and 2 * 6371 * asin(sqrt(
              sin(radians((help_requests.latitude - vp.latitude) / 2)) ^ 2
              + cos(radians(vp.latitude)) * cos(radians(help_requests.latitude))
                * sin(radians((help_requests.longitude - vp.longitude) / 2)) ^ 2
            )) <= 20
    )
  )
);

-- No direct client UPDATE policy is granted. State changes go through the
-- restricted RPC functions below so a client cannot edit arbitrary columns.

-- Atomic claim: only the first volunteer can win the request.
create or replace function public.accept_help_request(p_request_id uuid)
returns setof public.help_requests
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (
    select 1 from public.volunteer_profiles
    where user_id = auth.uid() and is_available = true
  ) then
    raise exception 'Volunteer is not available';
  end if;

  return query
  update public.help_requests
  set volunteer_id = auth.uid(), status = 'accepted', accepted_at = now()
  where id = p_request_id
    and status = 'open'
    and volunteer_id is null
    and requester_id <> auth.uid()
  returning *;
end;
$$;

grant execute on function public.accept_help_request(uuid) to authenticated;

create or replace function public.cancel_help_request(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.help_requests
  set status = 'cancelled'
  where id = p_request_id
    and requester_id = auth.uid()
    and status = 'open';
end;
$$;

grant execute on function public.cancel_help_request(uuid) to authenticated;

create or replace function public.update_help_request_status(p_request_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_status not in ('on_the_way', 'arrived', 'completed') then
    raise exception 'Invalid status';
  end if;

  update public.help_requests
  set status = p_status,
      completed_at = case when p_status = 'completed' then now() else completed_at end
  where id = p_request_id
    and volunteer_id = auth.uid()
    and status not in ('completed', 'cancelled');
end;
$$;

grant execute on function public.update_help_request_status(uuid, text) to authenticated;

-- Enable realtime updates for the help request table.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'help_requests'
  ) then
    alter publication supabase_realtime add table public.help_requests;
  end if;
end $$;
