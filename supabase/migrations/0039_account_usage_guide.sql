-- Enrol only accounts created after this migration. Existing accounts can
-- explicitly restart from Account. Auth-level enrolment also covers OAuth.
create table public.account_usage_guide (
  user_id uuid primary key references auth.users(id) on delete cascade,
  enabled boolean not null default true,
  progress jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.account_usage_guide enable row level security;
create policy guide_read_own on public.account_usage_guide for select to authenticated
  using (user_id = (select auth.uid()));
revoke all on public.account_usage_guide from public, anon, authenticated;
grant select on public.account_usage_guide to authenticated;

create function public.enrol_account_usage_guide() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.account_usage_guide(user_id) values(new.id) on conflict do nothing;
  return new;
end;
$$;
revoke all on function public.enrol_account_usage_guide() from public, anon, authenticated;
create trigger enrol_account_usage_guide after insert on auth.users
  for each row execute function public.enrol_account_usage_guide();

create function public.save_usage_guide(p_page text, p_step integer, p_status text)
returns public.account_usage_guide language plpgsql security definer set search_path = '' as $$
declare v public.account_usage_guide; max_steps integer;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  max_steps := case p_page when 'home' then 4 when 'request' then 2
    when 'details' then 3 when 'location' then 2 when 'helper' then 3
    when 'perks' then 2 when 'activity' then 3 when 'account' then 3 else 0 end;
  if max_steps = 0 or p_step is null or p_step < 0 or p_step >= max_steps
    or p_status is null or p_status not in ('active','done','skipped') then
    raise exception 'Invalid guide progress';
  end if;
  -- Row lock plus jsonb_set retains progress saved from another device/page.
  select * into v from public.account_usage_guide where user_id = auth.uid() for update;
  if not found then raise exception 'Guide not enrolled'; end if;
  if not v.enabled then return v; end if;
  -- A late request from another device must not reopen a completed page.
  if v.progress -> p_page ->> 'status' = 'done' and p_status = 'active' then return v; end if;
  update public.account_usage_guide set
    enabled = case when p_status = 'skipped' then false else enabled end,
    progress = jsonb_set(progress, array[p_page], jsonb_build_object('step',p_step,'status',p_status)),
    updated_at = now()
  where user_id = auth.uid() returning * into v;
  return v;
end;
$$;
create function public.restart_usage_guide() returns public.account_usage_guide
language plpgsql security definer set search_path = '' as $$
declare v public.account_usage_guide;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  insert into public.account_usage_guide(user_id,enabled,progress) values(auth.uid(),true,'{}')
  on conflict(user_id) do update set enabled=true,progress='{}',updated_at=now()
  returning * into v;
  return v;
end;
$$;
revoke all on function public.save_usage_guide(text,integer,text) from public, anon;
revoke all on function public.restart_usage_guide() from public, anon;
grant execute on function public.save_usage_guide(text,integer,text) to authenticated;
grant execute on function public.restart_usage_guide() to authenticated;
