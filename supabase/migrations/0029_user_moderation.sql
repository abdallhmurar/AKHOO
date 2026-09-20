begin;
alter table public.messages add column is_hidden boolean not null default false;
do $$
declare v_check text;
begin
  select pg_get_expr(conbin,conrelid) into v_check from pg_constraint
  where conrelid='public.admin_audit_log'::regclass and conname='admin_audit_log_action_check';
  alter table public.admin_audit_log drop constraint admin_audit_log_action_check;
  execute format('alter table public.admin_audit_log add constraint admin_audit_log_action_check check ((%s) or action = %L)',v_check,'message_hidden');
end;
$$;
drop policy if exists "messages readable by request participants" on public.messages;
create policy "messages readable by request participants" on public.messages for select to authenticated using(
  not is_hidden and not public.is_banned() and exists(select 1 from public.help_requests hr
    where hr.id=messages.request_id and auth.uid() in(hr.requester_id,hr.volunteer_id))
);
create or replace function public.admin_hide_message(p_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_request uuid;
begin
  select request_id into v_request from public.messages where id=p_id;
  if not public.admin_may_read_request_messages(v_request) then raise exception 'Not authorized' using errcode='42501'; end if;
  update public.messages set is_hidden=true where id=p_id and not is_hidden;
  if found then
    insert into public.admin_audit_log(admin_id,action,target_type,target_id,metadata)
    values(auth.uid(),'message_hidden','request',v_request,jsonb_build_object('message_id',p_id));
  end if;
end;
$$;
revoke all on function public.admin_hide_message(uuid) from public,anon;
grant execute on function public.admin_hide_message(uuid) to authenticated;
create or replace function public.can_read_chat_media(p_name text)
returns boolean language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and not public.is_banned() and (
    split_part(p_name,'/',1)=auth.uid()::text
    or exists(select 1 from public.messages m join public.help_requests hr on hr.id=m.request_id
      where m.media_url=p_name and (
        (not m.is_hidden and auth.uid() in(hr.requester_id,hr.volunteer_id))
        or public.admin_may_read_request_messages(hr.id)
      ))
  )
$$;
create table public.user_blocks (
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(blocker_id,blocked_id), check(blocker_id <> blocked_id)
);
alter table public.user_blocks enable row level security;
create policy "blocks own read" on public.user_blocks for select to authenticated using(blocker_id=auth.uid());
create policy "blocks own insert" on public.user_blocks for insert to authenticated with check(blocker_id=auth.uid() and not public.is_banned());
create policy "blocks own delete" on public.user_blocks for delete to authenticated using(blocker_id=auth.uid());
grant select,insert,delete on public.user_blocks to authenticated;

create or replace function public.get_request_push_recipients(p_user_ids uuid[],p_peer_id uuid)
returns table(user_id uuid,token text) language sql stable security definer set search_path = '' as $$
  select d.user_id,d.token from public.get_push_recipients(p_user_ids,false) d
  where not exists(select 1 from public.user_blocks b
    where (b.blocker_id=d.user_id and b.blocked_id=p_peer_id) or (b.blocker_id=p_peer_id and b.blocked_id=d.user_id))
    and exists(select 1 from public.profiles p where p.id=p_peer_id and not p.is_banned)
$$;
revoke all on function public.get_request_push_recipients(uuid[],uuid) from public,anon,authenticated;
grant execute on function public.get_request_push_recipients(uuid[],uuid) to service_role;

create or replace function public.is_blocked_with(p_other uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.user_blocks b where
    (b.blocker_id=auth.uid() and b.blocked_id=p_other) or (b.blocker_id=p_other and b.blocked_id=auth.uid()))
$$;
revoke all on function public.is_blocked_with(uuid) from public,anon;
grant execute on function public.is_blocked_with(uuid) to authenticated;

create or replace function public.can_message_request(p_request_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and not public.is_banned() and exists(
    select 1 from public.help_requests hr
    where hr.id=p_request_id and hr.volunteer_id is not null
      and auth.uid() in (hr.requester_id,hr.volunteer_id)
      and not public.is_blocked_with(case when hr.requester_id=auth.uid() then hr.volunteer_id else hr.requester_id end)
      and not exists(select 1 from public.profiles p where p.id in(hr.requester_id,hr.volunteer_id) and p.is_banned)
  )
$$;
revoke all on function public.can_message_request(uuid) from public,anon;
grant execute on function public.can_message_request(uuid) to authenticated;
drop policy if exists "messages insertable by request participants" on public.messages;
create policy "messages insertable by request participants" on public.messages for insert to authenticated with check(
  sender_id=auth.uid() and not is_hidden and public.can_message_request(request_id)
  and (body is null or (length(trim(body)) between 1 and 4000))
  and (media_url is null or (
    split_part(media_url,'/',1)=auth.uid()::text and split_part(media_url,'/',2)=request_id::text
    and exists(select 1 from storage.objects o where o.bucket_id='mission-chat' and o.name=media_url)
  ))
);
drop policy if exists "mission chat media participant upload" on storage.objects;
create policy "mission chat media participant upload" on storage.objects for insert to authenticated with check(
  bucket_id='mission-chat' and split_part(name,'/',1)=auth.uid()::text
  and exists(select 1 from public.help_requests hr where hr.id::text=split_part(name,'/',2)
    and public.can_message_request(hr.id))
);

-- Reports must enter the moderation queue; clients cannot forge a resolution.
drop policy if exists "reports insert self" on public.reports;
create policy "reports insert self" on public.reports for insert to authenticated with check(
  reporter_id=auth.uid() and not public.is_banned() and status='open'
  and resolved_at is null and resolved_by is null and resolution_note is null
  and length(trim(reason)) between 3 and 200 and coalesce(length(details),0)<=2000
  and (
    (target_type='request' and exists(select 1 from public.help_requests hr where hr.id=target_id and auth.uid() in(hr.requester_id,hr.volunteer_id)))
    or (target_type='message' and exists(select 1 from public.messages m join public.help_requests hr on hr.id=m.request_id where m.id=target_id and auth.uid() in(hr.requester_id,hr.volunteer_id)))
    or (target_type='user' and target_id<>auth.uid() and exists(select 1 from public.help_requests hr where auth.uid() in(hr.requester_id,hr.volunteer_id) and target_id in(hr.requester_id,hr.volunteer_id)))
    or (target_type='business' and exists(select 1 from public.partners p where p.id=target_id))
    or (target_type='offer' and exists(select 1 from public.partner_offers o where o.id=target_id))
  )
);
create or replace function public.accept_help_request(p_request_id uuid)
returns setof public.help_requests
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_available boolean;
  v_constraint text;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if public.is_banned() then
    raise exception 'Account is banned';
  end if;

  -- (a) Lock order: request row, then helper profile row.
  perform 1 from public.help_requests hr where hr.id = p_request_id for update;

  if exists(select 1 from public.help_requests hr where hr.id=p_request_id and public.is_blocked_with(hr.requester_id)) then
    raise exception 'Not authorized' using errcode='42501';
  end if;

  select vp.is_available into v_available
  from public.volunteer_profiles vp
  where vp.user_id = v_user_id
  for update;

  -- (b) Checked before is_available so a busy helper gets the specific reason.
  if public.volunteer_is_helping(v_user_id) then
    raise exception 'Volunteer already has an active mission';
  end if;

  if v_available is distinct from true then
    raise exception 'Volunteer is not available';
  end if;

  if exists (
    select 1 from public.help_request_releases r
    where r.request_id = p_request_id and r.volunteer_id = v_user_id
  ) then
    raise exception 'You already released this mission';
  end if;

  begin
    return query
    update public.help_requests hr
    set volunteer_id = v_user_id, status = 'accepted', accepted_at = pg_catalog.now()
    where hr.id = p_request_id
      and hr.status = 'open'
      and hr.volunteer_id is null
      and hr.requester_id <> v_user_id
    returning hr.*;
  exception when unique_violation then
    get stacked diagnostics v_constraint = constraint_name;
    if v_constraint = 'help_requests_one_active_per_volunteer' then
      raise exception 'Volunteer already has an active mission';
    end if;
    raise;
  end;
end;
$$;
commit;
