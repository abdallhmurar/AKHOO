-- In-app announcements: a broadcast composed in the admin Notifications page
-- can carry poster images and is shown inside the app - as a popup the first
-- time the user opens it, and from a bell that keeps shaking until it's read.
--
-- It is the same broadcast_notifications row that drives the push (title,
-- body, audience), extended with images. The table stays admin-only: the app
-- reads announcements through get_my_announcements() (definer), which
-- returns only the fields a user needs and applies the audience rule, so the
-- delivery bookkeeping columns and created_by are never exposed to clients.

alter table public.broadcast_notifications
  add column if not exists image_urls text[] not null default '{}',
  add column if not exists show_in_app boolean not null default false;

-- Every broadcast sent before this migration was push-only. show_in_app
-- defaults to false so none of them suddenly pops up in the app; only
-- broadcasts created through the updated admin_create_broadcast_notification
-- below are shown.

alter table public.broadcast_notifications drop constraint if exists broadcast_notifications_image_count_check;
alter table public.broadcast_notifications add constraint broadcast_notifications_image_count_check
  check (cardinality(image_urls) <= 5);

-- Per-user state: "the popup was shown" (so it never pops up twice, even if
-- the app is killed right after) and "read" (stops the bell shaking). Only
-- the RPCs below write here; no client policy at all.
create table if not exists public.announcement_receipts (
  announcement_id uuid not null references public.broadcast_notifications(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  popup_shown_at timestamptz,
  read_at timestamptz,
  primary key (announcement_id, user_id)
);

create index if not exists announcement_receipts_user_idx on public.announcement_receipts (user_id);

alter table public.announcement_receipts enable row level security;

-- ── admin_create_broadcast_notification: now takes images ───────────────
-- Replaced (not overloaded): a 3-argument overload alongside a 4-argument
-- one with a default would make every named-argument call ambiguous.
drop function if exists public.admin_create_broadcast_notification(text, text, text);

create or replace function public.admin_create_broadcast_notification(p_title text, p_body text, p_target text, p_image_urls text[] default '{}')
returns public.broadcast_notifications
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.broadcast_notifications;
  v_url text;
  v_images text[] := coalesce(p_image_urls, '{}');
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
  if pg_catalog.cardinality(v_images) > 5 then
    raise exception 'At most 5 images per announcement';
  end if;
  -- Only images uploaded through the admin panel's own content bucket (public
  -- read, admin-only write - 0023) are accepted, never an arbitrary link.
  foreach v_url in array v_images loop
    if v_url is null or pg_catalog.char_length(v_url) > 500
       or v_url !~ '^https://[^/]+/storage/v1/object/public/content/announcements/[^?#\s]+$' then
      raise exception 'Images must be uploaded through the admin panel';
    end if;
  end loop;

  insert into public.broadcast_notifications (title, body, target_audience, created_by, image_urls, show_in_app)
  values (p_title, p_body, p_target, auth.uid(), v_images, true)
  returning * into v_row;

  insert into public.admin_audit_log (admin_id, action, target_type, target_id, target_label, metadata)
  values (auth.uid(), 'broadcast_notification_sent', 'notification', v_row.id, p_title,
    pg_catalog.jsonb_build_object('target_audience', p_target, 'image_count', pg_catalog.cardinality(v_images)));

  return v_row;
end;
$$;

revoke all on function public.admin_create_broadcast_notification(text, text, text, text[]) from public, anon;
grant execute on function public.admin_create_broadcast_notification(text, text, text, text[]) to authenticated;

-- ── What the app reads ──────────────────────────────────────────────────
-- Recent (30 days) in-app announcements this user is eligible for, newest
-- first, with their own popup/read state. Same audience rule the push
-- recipients use (get_push_recipients, 0028): 'volunteers' = has ever opted
-- into helping. Banned users get nothing.
create or replace function public.get_my_announcements()
returns table (id uuid, title text, body text, image_urls text[], created_at timestamptz, popup_shown_at timestamptz, read_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select n.id, n.title, n.body, n.image_urls, n.created_at, r.popup_shown_at, r.read_at
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

-- Marks announcements as read for the caller. Only ids the caller could
-- actually see (get_my_announcements) are recorded, so this can't be used to
-- write rows for arbitrary announcements.
create or replace function public.mark_announcements_read(p_ids uuid[])
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.announcement_receipts (announcement_id, user_id, popup_shown_at, read_at)
  select a.id, (select auth.uid()), pg_catalog.now(), pg_catalog.now()
  from public.get_my_announcements() a
  where a.id = any(p_ids[1:20])
  on conflict (announcement_id, user_id) do update
    set read_at = coalesce(public.announcement_receipts.read_at, excluded.read_at),
        popup_shown_at = coalesce(public.announcement_receipts.popup_shown_at, excluded.popup_shown_at)
$$;

revoke all on function public.mark_announcements_read(uuid[]) from public, anon;
grant execute on function public.mark_announcements_read(uuid[]) to authenticated;

-- The popup was displayed (still unread - "later" keeps the bell shaking).
create or replace function public.mark_announcement_popup_shown(p_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.announcement_receipts (announcement_id, user_id, popup_shown_at)
  select a.id, (select auth.uid()), pg_catalog.now()
  from public.get_my_announcements() a
  where a.id = p_id
  on conflict (announcement_id, user_id) do update
    set popup_shown_at = coalesce(public.announcement_receipts.popup_shown_at, excluded.popup_shown_at)
$$;

revoke all on function public.mark_announcement_popup_shown(uuid) from public, anon;
grant execute on function public.mark_announcement_popup_shown(uuid) to authenticated;
