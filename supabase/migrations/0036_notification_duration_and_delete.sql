-- Notifications: a per-notification "how long it stays visible in-app"
-- duration, and the ability to delete a notification (or all of them) from
-- the admin panel.
--
-- get_my_announcements() previously used one hardcoded 30-day cutoff for
-- every row. New notifications now get an explicit expires_at chosen by the
-- admin at send time (1-90 days); rows sent before this migration have no
-- expires_at, so the 30-day cutoff still applies to them as a fallback -
-- nothing that's already out gets hidden earlier than users would expect.

begin;

alter table public.broadcast_notifications
  add column if not exists expires_at timestamptz;

-- Replaced (not overloaded) for the same reason as 0033/0034: an extra
-- defaulted argument next to the old signature would make named-argument
-- calls ambiguous.
drop function if exists public.admin_create_broadcast_notification(text, text, text, text[], text);

create or replace function public.admin_create_broadcast_notification(
  p_title text,
  p_body text,
  p_target text,
  p_image_urls text[] default '{}',
  p_details text default null,
  p_duration_days integer default 7
)
returns public.broadcast_notifications
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.broadcast_notifications;
  v_url text;
  v_images text[] := coalesce(p_image_urls, '{}');
  v_details text := nullif(pg_catalog.btrim(coalesce(p_details, '')), '');
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;
  if coalesce(p_title, '') = '' or coalesce(p_body, '') = '' then
    raise exception 'Title and body are required';
  end if;
  if p_target not in ('all', 'volunteers') then
    raise exception 'Invalid target audience';
  end if;
  if pg_catalog.char_length(p_body) > 5000 then
    raise exception 'Message is too long (max 5000 characters); put the long text in the full explanation';
  end if;
  if v_details is not null and pg_catalog.char_length(v_details) > 20000 then
    raise exception 'Full explanation is too long (max 20000 characters)';
  end if;
  if pg_catalog.cardinality(v_images) > 5 then
    raise exception 'At most 5 images per announcement';
  end if;
  if p_duration_days is null or p_duration_days not between 1 and 90 then
    raise exception 'Duration must be between 1 and 90 days';
  end if;
  foreach v_url in array v_images loop
    if v_url is null or pg_catalog.char_length(v_url) > 500
       or v_url !~ '^https://[^/]+/storage/v1/object/public/content/announcements/[^?#\s]+$' then
      raise exception 'Images must be uploaded through the admin panel';
    end if;
  end loop;

  insert into public.broadcast_notifications (title, body, details, target_audience, created_by, image_urls, show_in_app, expires_at)
  values (p_title, p_body, v_details, p_target, auth.uid(), v_images, true, pg_catalog.now() + make_interval(days => p_duration_days))
  returning * into v_row;

  insert into public.admin_audit_log (admin_id, action, target_type, target_id, target_label, metadata)
  values (auth.uid(), 'broadcast_notification_sent', 'notification', v_row.id, p_title,
    pg_catalog.jsonb_build_object('target_audience', p_target, 'image_count', pg_catalog.cardinality(v_images), 'has_details', v_details is not null, 'duration_days', p_duration_days));

  return v_row;
end;
$$;

revoke all on function public.admin_create_broadcast_notification(text, text, text, text[], text, integer) from public, anon;
grant execute on function public.admin_create_broadcast_notification(text, text, text, text[], text, integer) to authenticated;

-- What the app reads: an explicit expires_at wins; a null one (rows sent
-- before this migration) keeps the old 30-day-from-creation behavior.
create or replace function public.get_my_announcements()
returns table (id uuid, title text, body text, details text, image_urls text[], created_at timestamptz, popup_shown_at timestamptz, read_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select n.id, n.title, n.body, n.details, n.image_urls, n.created_at, r.popup_shown_at, r.read_at
  from public.broadcast_notifications n
  left join public.announcement_receipts r on r.announcement_id = n.id and r.user_id = (select auth.uid())
  where n.show_in_app
    and (case when n.expires_at is not null then n.expires_at > pg_catalog.now() else n.created_at > pg_catalog.now() - interval '30 days' end)
    and (select auth.uid()) is not null
    and not exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_banned)
    and (n.target_audience = 'all' or exists (select 1 from public.volunteer_profiles v where v.user_id = (select auth.uid())))
  order by n.created_at desc
  limit 20
$$;

revoke all on function public.get_my_announcements() from public, anon;
grant execute on function public.get_my_announcements() to authenticated;

-- admin_audit_log: allow the new action (see 0029/0032 for the pattern).
do $$
declare
  v_check text;
begin
  select pg_get_expr(conbin, conrelid) into v_check from pg_constraint
  where conrelid = 'public.admin_audit_log'::regclass and conname = 'admin_audit_log_action_check';
  if v_check like '%broadcast_notification_deleted%' then
    return;
  end if;
  alter table public.admin_audit_log drop constraint admin_audit_log_action_check;
  execute format('alter table public.admin_audit_log add constraint admin_audit_log_action_check check ((%s) or action = %L)', v_check, 'broadcast_notification_deleted');
end;
$$;

-- Deletes are real deletes (announcement_receipts and broadcast_push_results
-- both cascade, 0033/0028), not a soft "hide" - once an admin deletes a
-- notification it should also stop counting toward anything. One audit row
-- per notification either way, so its title survives the delete (same
-- reasoning as every other audit entry's target_label).
create or replace function public.admin_delete_broadcast_notification(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_title text;
  v_audience text;
  v_sent_count integer;
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  select title, target_audience, sent_count into v_title, v_audience, v_sent_count
  from public.broadcast_notifications where id = p_id;
  if not found then
    raise exception 'Notification not found';
  end if;

  delete from public.broadcast_notifications where id = p_id;

  insert into public.admin_audit_log (admin_id, action, target_type, target_id, target_label, metadata)
  values (auth.uid(), 'broadcast_notification_deleted', 'notification', p_id, v_title,
    pg_catalog.jsonb_build_object('target_audience', v_audience, 'sent_count', v_sent_count));
end;
$$;

revoke all on function public.admin_delete_broadcast_notification(uuid) from public, anon;
grant execute on function public.admin_delete_broadcast_notification(uuid) to authenticated;

create or replace function public.admin_delete_all_broadcast_notifications()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  insert into public.admin_audit_log (admin_id, action, target_type, target_id, target_label, metadata)
  select auth.uid(), 'broadcast_notification_deleted', 'notification', n.id, n.title,
    pg_catalog.jsonb_build_object('target_audience', n.target_audience, 'sent_count', n.sent_count, 'bulk', true)
  from public.broadcast_notifications n;
  get diagnostics v_count = row_count;

  delete from public.broadcast_notifications;

  return v_count;
end;
$$;

revoke all on function public.admin_delete_all_broadcast_notifications() from public, anon;
grant execute on function public.admin_delete_all_broadcast_notifications() to authenticated;

commit;
