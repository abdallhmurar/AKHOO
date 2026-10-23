begin;

-- An announcement can carry one MP4 video next to (or instead of) its posters.
-- The video is uploaded by an admin to the public `content` bucket under
-- announcements-video/ (a different folder from the poster images on purpose,
-- so a video URL can never be accepted as an image and the other way round).
-- App versions that predate this migration ignore the extra field and keep
-- showing the posters, so admins should still add a poster image as a fallback.
alter table public.broadcast_notifications add column if not exists video_url text;
alter table public.broadcast_notifications drop constraint if exists broadcast_notifications_video_url_check;
alter table public.broadcast_notifications add constraint broadcast_notifications_video_url_check check (
  video_url is null or (
    char_length(video_url) <= 500
    and video_url ~ '^https://[^/]+/storage/v1/object/public/content/announcements-video/[^?#\s]+\.mp4$'
  )
);

-- Phones play this over mobile data: cap uploads at 25 MB and only allow the
-- formats the admin panel produces (the bucket held png and jpeg until now).
update storage.buckets
set file_size_limit = 26214400,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'video/mp4']
where id = 'content';

drop function public.admin_create_broadcast_notification(text,text,text,text[],text,integer,jsonb);
create or replace function public.admin_create_broadcast_notification(
  p_title text,
  p_body text,
  p_target text,
  p_image_urls text[] default '{}',
  p_details text default null,
  p_duration_days integer default 7,
  p_translations jsonb default '{}',
  p_video_url text default null
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
  v_video text := nullif(pg_catalog.btrim(coalesce(p_video_url, '')), '');
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
  if v_video is not null and (pg_catalog.char_length(v_video) > 500
     or v_video !~ '^https://[^/]+/storage/v1/object/public/content/announcements-video/[^?#\s]+\.mp4$') then
    raise exception 'The video must be an MP4 uploaded through the admin panel';
  end if;

  insert into public.broadcast_notifications (title, body, details, target_audience, created_by, image_urls, show_in_app, expires_at, translations, video_url)
  values (p_title, p_body, v_details, p_target, auth.uid(), v_images, true, pg_catalog.now() + make_interval(days => p_duration_days), coalesce(p_translations, '{}'::jsonb), v_video)
  returning * into v_row;

  insert into public.admin_audit_log (admin_id, action, target_type, target_id, target_label, metadata)
  values (auth.uid(), 'broadcast_notification_sent', 'notification', v_row.id, p_title,
    pg_catalog.jsonb_build_object('target_audience', p_target, 'image_count', pg_catalog.cardinality(v_images), 'has_video', v_video is not null, 'has_details', v_details is not null, 'duration_days', p_duration_days));

  return v_row;
end;
$$;
revoke all on function public.admin_create_broadcast_notification(text,text,text,text[],text,integer,jsonb,text) from public,anon;
grant execute on function public.admin_create_broadcast_notification(text,text,text,text[],text,integer,jsonb,text) to authenticated;

drop function public.get_my_announcements();
create or replace function public.get_my_announcements()
returns table (id uuid, title text, body text, details text, image_urls text[], created_at timestamptz, popup_shown_at timestamptz, read_at timestamptz, translations jsonb, video_url text)
language sql
stable
security definer
set search_path = ''
as $$
  select n.id, n.title, n.body, n.details, n.image_urls, n.created_at, r.popup_shown_at, r.read_at, n.translations, n.video_url
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
revoke all on function public.get_my_announcements() from public,anon;
grant execute on function public.get_my_announcements() to authenticated;

commit;
