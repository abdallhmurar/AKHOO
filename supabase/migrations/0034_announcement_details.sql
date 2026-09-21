-- Announcements get a separate long-form "details" text.
--
-- The message (body) is what appears on the phone's push notification and at
-- the top of the in-app popup; details is the full explanation shown when the
-- user opens the announcement in the app. Neither is limited in the admin UI;
-- the caps below (5,000 / 20,000 characters) only exist so a runaway paste
-- can't bloat the table, and are far beyond any real announcement. The push
-- itself is trimmed by the send-broadcast-notification function - a phone
-- notification can't carry more than a few lines regardless.

alter table public.broadcast_notifications
  add column if not exists details text;

-- Replaced (not overloaded) for the same reason as 0033: an extra defaulted
-- argument next to the old signature would make named-argument calls ambiguous.
drop function if exists public.admin_create_broadcast_notification(text, text, text, text[]);

create or replace function public.admin_create_broadcast_notification(
  p_title text,
  p_body text,
  p_target text,
  p_image_urls text[] default '{}',
  p_details text default null
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
  foreach v_url in array v_images loop
    if v_url is null or pg_catalog.char_length(v_url) > 500
       or v_url !~ '^https://[^/]+/storage/v1/object/public/content/announcements/[^?#\s]+$' then
      raise exception 'Images must be uploaded through the admin panel';
    end if;
  end loop;

  insert into public.broadcast_notifications (title, body, details, target_audience, created_by, image_urls, show_in_app)
  values (p_title, p_body, v_details, p_target, auth.uid(), v_images, true)
  returning * into v_row;

  insert into public.admin_audit_log (admin_id, action, target_type, target_id, target_label, metadata)
  values (auth.uid(), 'broadcast_notification_sent', 'notification', v_row.id, p_title,
    pg_catalog.jsonb_build_object('target_audience', p_target, 'image_count', pg_catalog.cardinality(v_images), 'has_details', v_details is not null));

  return v_row;
end;
$$;

revoke all on function public.admin_create_broadcast_notification(text, text, text, text[], text) from public, anon;
grant execute on function public.admin_create_broadcast_notification(text, text, text, text[], text) to authenticated;

-- What the app reads now also returns details. RETURNS TABLE can't change via
-- create-or-replace, so drop and recreate (mark_announcement_popup_shown /
-- mark_announcements_read only call it by name at run time).
drop function if exists public.get_my_announcements();

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
    and n.created_at > pg_catalog.now() - interval '30 days'
    and (select auth.uid()) is not null
    and not exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_banned)
    and (n.target_audience = 'all' or exists (select 1 from public.volunteer_profiles v where v.user_id = (select auth.uid())))
  order by n.created_at desc
  limit 20
$$;

revoke all on function public.get_my_announcements() from public, anon;
grant execute on function public.get_my_announcements() to authenticated;
