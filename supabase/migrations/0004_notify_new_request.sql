-- Fires a webhook to the notify-new-request Edge Function whenever a new
-- open help request is created, so nearby available volunteers get a push
-- notification. The webhook secret is intentionally NOT set here (it would
-- land in a public git history) - it's set separately with:
--   alter database postgres set app.settings.notify_webhook_secret = '...';
-- via `supabase db query`, matching the value passed to
-- `supabase secrets set NOTIFY_WEBHOOK_SECRET=...` for the function itself.
-- Until that's set, this trigger silently no-ops (current_setting with
-- missing_ok=true returns null) so it's safe to apply this migration first.

create extension if not exists pg_net with schema extensions;

create or replace function public.notify_new_help_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_secret text;
begin
  if new.status <> 'open' then
    return new;
  end if;

  v_secret := current_setting('app.settings.notify_webhook_secret', true);
  if v_secret is null or v_secret = '' then
    return new;
  end if;

  perform net.http_post(
    url := 'https://zmpwdufahjmlxfwzafvr.supabase.co/functions/v1/notify-new-request',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-webhook-secret', v_secret),
    body := jsonb_build_object('request_id', new.id)
  );

  return new;
end;
$$;

drop trigger if exists on_help_request_created on public.help_requests;
create trigger on_help_request_created
after insert on public.help_requests
for each row execute procedure public.notify_new_help_request();
