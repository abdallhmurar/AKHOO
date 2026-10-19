begin;
-- Business names, descriptions, addresses and service areas are written in
-- Arabic by the admin and shown in the app in the user's language, exactly like
-- offers (0041). The Arabic original stays in the real columns, so older app
-- builds and any missing translation keep working.
alter table public.partners add column translations jsonb not null default '{}' check (jsonb_typeof(translations)='object' and octet_length(translations::text) <= 500000);

-- Drops translations whose Arabic source no longer matches the row, so a stale
-- translation can never be shown next to changed text.
create trigger partner_translation_source before insert or update on public.partners for each row execute function public.validate_content_translation_source('name','description','address','service_area');

create or replace function public.admin_upsert_business(p_id uuid, p_payload jsonb)
returns public.partners
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.partners;
  v_is_create boolean := p_id is null;
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  if coalesce(p_payload->>'name', '') = '' then
    raise exception 'Business name is required';
  end if;

  if v_is_create then
    insert into public.partners (
      name, category, description, phone, whatsapp, address, latitude, longitude,
      service_area, opening_hours, website_url, social_url, logo_url, slug, status, market, translations
    ) values (
      p_payload->>'name',
      p_payload->>'category',
      p_payload->>'description',
      p_payload->>'phone',
      p_payload->>'whatsapp',
      p_payload->>'address',
      nullif(p_payload->>'latitude', '')::double precision,
      nullif(p_payload->>'longitude', '')::double precision,
      p_payload->>'service_area',
      p_payload->'opening_hours',
      p_payload->>'website_url',
      p_payload->>'social_url',
      p_payload->>'logo_url',
      coalesce(nullif(p_payload->>'slug', ''), lower(regexp_replace(p_payload->>'name', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(gen_random_uuid()::text, 1, 8)),
      'verified',
      coalesce(nullif(p_payload->>'market', ''), 'IL'),
      coalesce(p_payload->'translations', '{}'::jsonb)
    )
    returning * into v_row;

    insert into public.admin_audit_log (admin_id, action, target_type, target_id, target_label)
    values (auth.uid(), 'business_created', 'business', v_row.id, v_row.name);
  else
    update public.partners set
      name = p_payload->>'name',
      category = p_payload->>'category',
      description = p_payload->>'description',
      phone = p_payload->>'phone',
      whatsapp = p_payload->>'whatsapp',
      address = p_payload->>'address',
      latitude = nullif(p_payload->>'latitude', '')::double precision,
      longitude = nullif(p_payload->>'longitude', '')::double precision,
      service_area = p_payload->>'service_area',
      opening_hours = p_payload->'opening_hours',
      website_url = p_payload->>'website_url',
      social_url = p_payload->>'social_url',
      logo_url = p_payload->>'logo_url',
      -- A cached older admin page that does not send translations must not wipe
      -- valid ones; the trigger above already discards any that went stale.
      translations = case when p_payload ? 'translations' then coalesce(p_payload->'translations', '{}'::jsonb) else partners.translations end
    where id = p_id
    returning * into v_row;

    if v_row.id is null then
      raise exception 'Business not found';
    end if;

    insert into public.admin_audit_log (admin_id, action, target_type, target_id, target_label)
    values (auth.uid(), 'business_edited', 'business', v_row.id, v_row.name);
  end if;

  return v_row;
end;
$$;
grant execute on function public.admin_upsert_business(uuid, jsonb) to authenticated;

-- Used by the admin "translate all content" action to fill in rows that were
-- published before translations existed. The caller proves which source text it
-- translated; if the row changed meanwhile the write is refused.
create or replace function public.admin_set_business_translations(p_id uuid, p_source jsonb, p_translations jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare current_source jsonb;
begin
  if not public.is_admin() then raise exception 'Not authorized'; end if;
  select jsonb_build_object('name', coalesce(name,''), 'description', coalesce(description,''), 'address', coalesce(address,''), 'service_area', coalesce(service_area,''))
    into current_source from public.partners where id=p_id for update;
  if current_source is null or current_source is distinct from p_source then raise exception 'Business changed; reload and try again'; end if;
  update public.partners set translations=coalesce(p_translations,'{}'::jsonb) where id=p_id;
end;
$$;
revoke all on function public.admin_set_business_translations(uuid,jsonb,jsonb) from public,anon;
grant execute on function public.admin_set_business_translations(uuid,jsonb,jsonb) to authenticated;
commit;
