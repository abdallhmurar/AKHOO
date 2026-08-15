-- `alter database ... set app.settings.x` needs superuser privileges the
-- CLI's connection role doesn't have. Use a private (non-API-exposed) table
-- instead - the trigger function is SECURITY DEFINER so it can read this
-- table regardless of RLS, without needing schema-level API exposure.

create schema if not exists private;

create table if not exists private.app_settings (
  key text primary key,
  value text not null
);

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

  select value into v_secret from private.app_settings where key = 'notify_webhook_secret';
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
