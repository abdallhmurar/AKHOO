-- Chat push notifications need to reach BOTH sides of a request, but the
-- only push token storage so far is volunteer_profiles.push_token, written
-- only when a user toggles volunteer availability - a pure requester who
-- has never done that has no token anywhere. Adds a general per-user token
-- on profiles instead, written from AuthProvider on sign-in (see
-- profileRepository.savePushToken).
alter table public.profiles add column if not exists push_token text;

-- Mirrors 0004_notify_new_request.sql's trigger pattern exactly, reusing
-- the same webhook secret (project-level Edge Function secrets are shared
-- across every function, so NOTIFY_WEBHOOK_SECRET is already available to
-- notify-new-message without setting it again).
create or replace function public.notify_new_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_secret text;
begin
  v_secret := current_setting('app.settings.notify_webhook_secret', true);
  if v_secret is null or v_secret = '' then
    return new;
  end if;

  perform net.http_post(
    url := 'https://zmpwdufahjmlxfwzafvr.supabase.co/functions/v1/notify-new-message',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-webhook-secret', v_secret),
    body := jsonb_build_object('message_id', new.id)
  );

  return new;
end;
$$;

drop trigger if exists on_message_created on public.messages;
create trigger on_message_created
after insert on public.messages
for each row execute procedure public.notify_new_message();
