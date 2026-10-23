begin;

-- Notification events. Every user-facing push beyond the three that already existed (new nearby request,
-- chat message, support reply) goes through one pipeline:
--   a database trigger (or the pg_cron tick) calls emit_notification(event, payload)
--   -> pg_net posts it to the notify-event Edge Function with the shared webhook secret
--   -> the function decides who gets it, checks preferences, de-duplicates and sends it.
-- emit_notification swallows every error: a notification problem must never undo what the user just did.

-- 1. Per-user preferences. Only the optional categories can be switched off by the user. Essential ones
--    (updates about my own request, support, account/safety, partner and admin alerts) are not stored here.
--    reminders and offers default to OFF: they are the promotional kind that App Store rule 4.5.4 only
--    allows with consent. The app reads and writes them through the two RPCs below.
create table public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  requests boolean not null default true,
  mission boolean not null default true,
  rewards boolean not null default true,
  reminders boolean not null default false,
  offers boolean not null default false,
  announcements boolean not null default true,
  updated_at timestamptz not null default now()
);
alter table public.notification_preferences enable row level security;
revoke all on public.notification_preferences from anon, authenticated;
grant all on public.notification_preferences to service_role;

create or replace function public.get_my_notification_preferences()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select pg_catalog.jsonb_build_object(
    'requests', coalesce(p.requests, true),
    'mission', coalesce(p.mission, true),
    'rewards', coalesce(p.rewards, true),
    'reminders', coalesce(p.reminders, false),
    'offers', coalesce(p.offers, false),
    'announcements', coalesce(p.announcements, true)
  )
  from (select 1) x
  left join public.notification_preferences p on p.user_id = (select auth.uid())
  where (select auth.uid()) is not null
$$;
revoke all on function public.get_my_notification_preferences() from public, anon;
grant execute on function public.get_my_notification_preferences() to authenticated;

create or replace function public.set_my_notification_preferences(p_prefs jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_key text;
begin
  if v_user is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;
  if p_prefs is null or pg_catalog.jsonb_typeof(p_prefs) <> 'object' then
    raise exception 'Preferences must be an object';
  end if;
  for v_key in select pg_catalog.jsonb_object_keys(p_prefs) loop
    if v_key not in ('requests', 'mission', 'rewards', 'reminders', 'offers', 'announcements') then
      raise exception 'Unknown notification category: %', v_key;
    end if;
    if pg_catalog.jsonb_typeof(p_prefs -> v_key) <> 'boolean' then
      raise exception 'Notification category % must be true or false', v_key;
    end if;
  end loop;

  insert into public.notification_preferences (user_id) values (v_user) on conflict (user_id) do nothing;
  update public.notification_preferences set
    requests = coalesce((p_prefs ->> 'requests')::boolean, requests),
    mission = coalesce((p_prefs ->> 'mission')::boolean, mission),
    rewards = coalesce((p_prefs ->> 'rewards')::boolean, rewards),
    reminders = coalesce((p_prefs ->> 'reminders')::boolean, reminders),
    offers = coalesce((p_prefs ->> 'offers')::boolean, offers),
    announcements = coalesce((p_prefs ->> 'announcements')::boolean, announcements),
    updated_at = pg_catalog.now()
  where user_id = v_user;
  return public.get_my_notification_preferences();
end;
$$;
revoke all on function public.set_my_notification_preferences(jsonb) from public, anon;
grant execute on function public.set_my_notification_preferences(jsonb) to authenticated;

-- 2. What was already sent. The unique key makes every notification once-only per user, so a retried
--    webhook, a repeated tick or a flapping status never produces duplicates.
create table public.notification_log (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  dedupe_key text not null,
  event text not null,
  created_at timestamptz not null default now(),
  unique (user_id, dedupe_key)
);
create index notification_log_created_idx on public.notification_log (created_at);
alter table public.notification_log enable row level security;
revoke all on public.notification_log from anon, authenticated;
grant all on public.notification_log to service_role;

-- 3. The emitter.
create or replace function public.emit_notification(p_event text, p_payload jsonb default '{}'::jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_secret text;
begin
  select s.value into v_secret from private.app_settings s where s.key = 'notify_webhook_secret';
  if v_secret is null or v_secret = '' then
    return;
  end if;
  perform net.http_post(
    url := 'https://zmpwdufahjmlxfwzafvr.supabase.co/functions/v1/notify-event',
    headers := pg_catalog.jsonb_build_object('Content-Type', 'application/json', 'x-webhook-secret', v_secret),
    body := pg_catalog.jsonb_build_object('event', p_event) || coalesce(p_payload, '{}'::jsonb)
  );
exception when others then
  null;
end;
$$;
revoke all on function public.emit_notification(text, jsonb) from public, anon, authenticated;

-- 4. Request lifecycle: every transition is an UPDATE of help_requests.
create or replace function public.help_requests_emit_notifications()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_stamp text := extract(epoch from pg_catalog.clock_timestamp())::text;
  v_payload jsonb := pg_catalog.jsonb_build_object('request_id', new.id, 'stamp', v_stamp);
begin
  if old.status = 'open' and new.status = 'accepted' and new.volunteer_id is not null then
    perform public.emit_notification('request_accepted', v_payload);
  elsif old.status = 'accepted' and new.status = 'on_the_way' then
    perform public.emit_notification('helper_on_the_way', v_payload);
  elsif old.status = 'on_the_way' and new.status = 'arrived' then
    perform public.emit_notification('helper_arrived', v_payload);
  elsif old.status = 'arrived' and new.status = 'awaiting_confirmation' then
    perform public.emit_notification('completion_requested', v_payload);
  elsif old.status = 'awaiting_confirmation' and new.status = 'arrived' and new.confirmation_rejected_at is distinct from old.confirmation_rejected_at then
    perform public.emit_notification('completion_rejected', v_payload);
  elsif new.status = 'completed' and old.status <> 'completed' then
    perform public.emit_notification('request_completed', v_payload);
  elsif new.status = 'open' and old.status in ('accepted', 'on_the_way', 'arrived') and old.volunteer_id is not null and new.volunteer_id is null then
    perform public.emit_notification('helper_released', v_payload || pg_catalog.jsonb_build_object('volunteer_id', old.volunteer_id));
  elsif new.status = 'cancelled' and old.status not in ('open', 'cancelled') and old.volunteer_id is not null then
    perform public.emit_notification('mission_cancelled', v_payload || pg_catalog.jsonb_build_object('volunteer_id', old.volunteer_id));
  end if;
  return null;
end;
$$;
revoke all on function public.help_requests_emit_notifications() from public, anon, authenticated;
drop trigger if exists help_requests_emit_notifications on public.help_requests;
create trigger help_requests_emit_notifications after update on public.help_requests
for each row when (old.status is distinct from new.status or old.volunteer_id is distinct from new.volunteer_id or old.confirmation_rejected_at is distinct from new.confirmation_rejected_at)
execute function public.help_requests_emit_notifications();

-- 5. Offers and redemptions.
create or replace function public.offer_redemptions_emit_notifications()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    perform public.emit_notification('redemption_created', pg_catalog.jsonb_build_object('redemption_id', new.id));
  elsif new.status = 'redeemed' and old.status <> 'redeemed' then
    perform public.emit_notification('redemption_redeemed', pg_catalog.jsonb_build_object('redemption_id', new.id));
  end if;
  return null;
end;
$$;
revoke all on function public.offer_redemptions_emit_notifications() from public, anon, authenticated;
drop trigger if exists offer_redemptions_emit_notifications on public.offer_redemptions;
create trigger offer_redemptions_emit_notifications after insert or update of status on public.offer_redemptions
for each row execute function public.offer_redemptions_emit_notifications();

create or replace function public.partner_offers_emit_notifications()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'pending_review' and (tg_op = 'INSERT' or old.status <> 'pending_review') then
    perform public.emit_notification('offer_pending', pg_catalog.jsonb_build_object('offer_id', new.id));
  elsif tg_op = 'UPDATE' and new.status = 'approved' and old.status <> 'approved' then
    perform public.emit_notification('offer_reviewed', pg_catalog.jsonb_build_object('offer_id', new.id, 'decision', 'approved'));
  elsif tg_op = 'UPDATE' and new.status = 'rejected' and old.status <> 'rejected' then
    perform public.emit_notification('offer_reviewed', pg_catalog.jsonb_build_object('offer_id', new.id, 'decision', 'rejected'));
  end if;
  return null;
end;
$$;
revoke all on function public.partner_offers_emit_notifications() from public, anon, authenticated;
drop trigger if exists partner_offers_emit_notifications on public.partner_offers;
create trigger partner_offers_emit_notifications after insert or update of status on public.partner_offers
for each row execute function public.partner_offers_emit_notifications();

-- 6. Support, reports and moderation.
create or replace function public.support_user_message_emit_notification()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.emit_notification('support_user_message', pg_catalog.jsonb_build_object('conversation_id', new.conversation_id));
  return null;
end;
$$;
revoke all on function public.support_user_message_emit_notification() from public, anon, authenticated;
drop trigger if exists support_user_message_emit_notification on public.support_messages;
create trigger support_user_message_emit_notification after insert on public.support_messages
for each row when (not new.from_admin) execute function public.support_user_message_emit_notification();

create or replace function public.support_conversations_emit_notification()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.emit_notification('support_resolved', pg_catalog.jsonb_build_object('conversation_id', new.id, 'stamp', extract(epoch from pg_catalog.clock_timestamp())::text));
  return null;
end;
$$;
revoke all on function public.support_conversations_emit_notification() from public, anon, authenticated;
drop trigger if exists support_conversations_emit_notification on public.support_conversations;
create trigger support_conversations_emit_notification after update of status on public.support_conversations
for each row when (new.status = 'resolved' and old.status <> 'resolved') execute function public.support_conversations_emit_notification();

create or replace function public.reports_emit_notifications()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    perform public.emit_notification('report_created', pg_catalog.jsonb_build_object('report_id', new.id));
  elsif new.status in ('resolved', 'dismissed') and old.status not in ('resolved', 'dismissed') then
    perform public.emit_notification('report_reviewed', pg_catalog.jsonb_build_object('report_id', new.id));
  end if;
  return null;
end;
$$;
revoke all on function public.reports_emit_notifications() from public, anon, authenticated;
drop trigger if exists reports_emit_notifications on public.reports;
create trigger reports_emit_notifications after insert or update of status on public.reports
for each row execute function public.reports_emit_notifications();

create or replace function public.profiles_emit_notifications()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.emit_notification(case when new.is_banned then 'account_banned' else 'account_unbanned' end,
    pg_catalog.jsonb_build_object('user_id', new.id, 'stamp', extract(epoch from pg_catalog.clock_timestamp())::text));
  return null;
end;
$$;
revoke all on function public.profiles_emit_notifications() from public, anon, authenticated;
drop trigger if exists profiles_emit_notifications on public.profiles;
create trigger profiles_emit_notifications after update of is_banned on public.profiles
for each row when (old.is_banned is distinct from new.is_banned) execute function public.profiles_emit_notifications();

create or replace function public.volunteer_profiles_emit_notifications()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.emit_notification('volunteer_verified', pg_catalog.jsonb_build_object('user_id', new.user_id));
  return null;
end;
$$;
revoke all on function public.volunteer_profiles_emit_notifications() from public, anon, authenticated;
drop trigger if exists volunteer_profiles_emit_notifications on public.volunteer_profiles;
create trigger volunteer_profiles_emit_notifications after update of is_verified on public.volunteer_profiles
for each row when (new.is_verified and not old.is_verified) execute function public.volunteer_profiles_emit_notifications();

-- 7. A new device on an account that already has one.
create or replace function public.push_devices_emit_notification()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (select 1 from public.push_devices d where d.user_id = new.user_id and d.token <> new.token and d.enabled) then
    perform public.emit_notification('new_device', pg_catalog.jsonb_build_object('user_id', new.user_id));
  end if;
  return null;
end;
$$;
revoke all on function public.push_devices_emit_notification() from public, anon, authenticated;
drop trigger if exists push_devices_emit_notification on public.push_devices;
create trigger push_devices_emit_notification after insert on public.push_devices
for each row execute function public.push_devices_emit_notification();

-- 8. The scheduled tick (requests nobody answered, offers about to expire, rating reminders). Skipped
--    where pg_cron does not exist (local test databases); production read-back verifies the job.
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron;
    perform cron.unschedule(j.jobid) from cron.job j where j.jobname = 'notify-tick';
    perform cron.schedule('notify-tick', '*/2 * * * *', 'select public.emit_notification(''tick'')');
  end if;
exception when others then
  raise notice 'notify-tick was not scheduled: %', sqlerrm;
end;
$$;

commit;
