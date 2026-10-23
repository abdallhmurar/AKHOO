begin;

-- Which notification sound pack a device has. Builds that ship the sound files and the matching Android channels
-- (shared/notificationSounds.ts) report their pack after registering their push token; the server only names
-- those channels and files for devices that reported one, so older builds keep the default sound.
alter table public.push_devices add column if not exists sound_pack smallint not null default 0;

create or replace function public.set_push_device_sound_pack(p_token text, p_pack smallint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  if p_pack is null or p_pack < 0 or p_pack > 100 then
    raise exception 'Invalid sound pack';
  end if;
  update public.push_devices set sound_pack = p_pack, updated_at = pg_catalog.now()
  where token = p_token and user_id = auth.uid();
end;
$$;
revoke all on function public.set_push_device_sound_pack(text, smallint) from public, anon;
grant execute on function public.set_push_device_sound_pack(text, smallint) to authenticated;

commit;
