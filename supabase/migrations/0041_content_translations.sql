begin;
-- Original text is retained for old clients and whenever a translation is unavailable.
alter table public.partner_offers add column translations jsonb not null default '{}' check (jsonb_typeof(translations)='object' and octet_length(translations::text) <= 500000);
alter table public.broadcast_notifications add column translations jsonb not null default '{}' check (jsonb_typeof(translations)='object' and octet_length(translations::text) <= 500000);
alter table public.support_messages add column translations jsonb not null default '{}' check (jsonb_typeof(translations)='object' and octet_length(translations::text) <= 500000);

create or replace function public.validate_content_translation_source()
returns trigger language plpgsql set search_path = '' as $$
declare field text;
begin
  if new.translations = '{}'::jsonb then return new; end if;
  foreach field in array tg_argv loop
    if (new.translations->'ar'->>field) is distinct from coalesce(to_jsonb(new)->>field,'') then
      new.translations := '{}'::jsonb;
      exit;
    end if;
  end loop;
  return new;
end;
$$;
revoke all on function public.validate_content_translation_source() from public, anon, authenticated;
create trigger offer_translation_source before insert or update on public.partner_offers for each row execute function public.validate_content_translation_source('title','description','terms','offer_type_label');
create trigger broadcast_translation_source before insert or update on public.broadcast_notifications for each row execute function public.validate_content_translation_source('title','body','details');
create trigger support_translation_source before insert or update on public.support_messages for each row execute function public.validate_content_translation_source('body');

create or replace function public.admin_upsert_offer(p_id uuid, p_payload jsonb)
returns public.partner_offers
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.partner_offers;
  v_is_create boolean := p_id is null;
  v_business_id uuid := nullif(p_payload->>'business_id', '')::uuid;
  v_discount_type text := p_payload->>'discount_type';
  v_discount_value numeric := nullif(p_payload->>'discount_value', '')::numeric;
  v_original_price numeric := nullif(p_payload->>'original_price', '')::numeric;
  v_offer_price numeric := nullif(p_payload->>'offer_price', '')::numeric;
  v_valid_from timestamptz := nullif(p_payload->>'valid_from', '')::timestamptz;
  v_valid_until timestamptz := nullif(p_payload->>'valid_until', '')::timestamptz;
  v_member_only boolean := coalesce((p_payload->>'member_only')::boolean, false);
  v_points_required integer := nullif(p_payload->>'points_required', '')::integer;
  v_computed_pct numeric;
  v_images text[];
  v_type_label text;
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  if p_payload ? 'image_urls' then
    if jsonb_typeof(p_payload->'image_urls') <> 'array' then
      raise exception 'Offer images must be an array';
    end if;
    if jsonb_array_length(p_payload->'image_urls') > 6 or exists (
      select 1 from jsonb_array_elements(p_payload->'image_urls') x
      where jsonb_typeof(x) <> 'string' or length(x #>> '{}') > 2048 or (x #>> '{}') !~ '^https://[^[:space:]]+$'
    ) then raise exception 'Use up to 6 HTTPS image URLs'; end if;
    select coalesce(array_agg(value order by ord), '{}'::text[]) into v_images
    from jsonb_array_elements_text(p_payload->'image_urls') with ordinality as x(value,ord);
  elsif not v_is_create then
    select image_urls into v_images from public.partner_offers where id=p_id;
    -- Legacy callers may replace the cover without knowing about the gallery.
    if p_payload ? 'image_url' and (p_payload->>'image_url') is distinct from v_images[1] then
      v_images := case when nullif(p_payload->>'image_url','') is null then '{}'::text[] else array[p_payload->>'image_url'] end;
    end if;
  else
    v_images := case when nullif(p_payload->>'image_url','') is null then '{}'::text[] else array[p_payload->>'image_url'] end;
  end if;
  v_images := coalesce(v_images, '{}'::text[]);
  if p_payload ? 'offer_type_label' then
    v_type_label := nullif(btrim(p_payload->>'offer_type_label'),'');
  elsif not v_is_create then
    select offer_type_label into v_type_label from public.partner_offers where id=p_id;
  end if;
  if length(v_type_label) > 80 then raise exception 'Offer type label is too long'; end if;

  if coalesce(p_payload->>'title', '') = '' then
    raise exception 'Offer title is required';
  end if;

  -- partner_id is now optional (a general AKHOO offer has none) - but a
  -- *provided* id must still be real, same as every other FK in this
  -- project. The old blanket "must have a business" rule is gone.
  if v_business_id is not null and not exists (select 1 from public.partners where id = v_business_id) then
    raise exception 'Selected business does not exist';
  end if;

  if v_discount_type not in ('percentage', 'fixed', 'special_price', 'free_benefit') then
    raise exception 'Invalid offer type';
  end if;

  if v_original_price is not null and v_original_price < 0 then
    raise exception 'Original price cannot be negative';
  end if;
  if v_offer_price is not null and v_offer_price < 0 then
    raise exception 'Offer price cannot be negative';
  end if;
  if v_original_price is not null and v_offer_price is not null and v_offer_price > v_original_price then
    raise exception 'Offer price cannot exceed the original price';
  end if;

  if v_discount_type = 'percentage' then
    if v_discount_value is null or v_discount_value <= 0 or v_discount_value > 100 then
      raise exception 'Percentage discount must be greater than 0 and no more than 100';
    end if;
    if v_original_price is not null and v_offer_price is not null and v_original_price > 0 then
      v_computed_pct := round((v_original_price - v_offer_price) / v_original_price * 100, 1);
      if abs(v_computed_pct - v_discount_value) > 1.0 then
        raise exception 'Discount percentage % does not match the original/offer price entered (computes to %)', v_discount_value, v_computed_pct;
      end if;
    end if;
  end if;

  if v_discount_type = 'fixed' and (v_discount_value is null or v_discount_value <= 0) then
    raise exception 'Fixed discount amount must be greater than 0';
  end if;

  if v_valid_from is not null and v_valid_until is not null and v_valid_until < v_valid_from then
    raise exception 'Valid-until date cannot precede valid-from date';
  end if;

  if v_points_required is not null and v_points_required < 0 then
    raise exception 'Points required cannot be negative';
  end if;

  if v_is_create then
    insert into public.partner_offers (
      partner_id, title, description, terms, discount_type, discount_value,
      original_price, offer_price, image_url, valid_from, valid_until, status,
      member_only, points_required, image_urls, offer_type_label, translations
    ) values (
      v_business_id, p_payload->>'title', p_payload->>'description', p_payload->>'terms',
      v_discount_type, v_discount_value, v_original_price, v_offer_price,
      v_images[1], v_valid_from, v_valid_until, 'draft',
      v_member_only, v_points_required, v_images, v_type_label, coalesce(p_payload->'translations', '{}'::jsonb)
    )
    returning * into v_row;

    insert into public.admin_audit_log (admin_id, action, target_type, target_id, target_label, metadata)
    values (auth.uid(), 'offer_created', 'offer', v_row.id, v_row.title,
      jsonb_build_object('member_only', v_row.member_only, 'points_required', v_row.points_required));
  else
    update public.partner_offers set
      partner_id = v_business_id,
      title = p_payload->>'title',
      description = p_payload->>'description',
      terms = p_payload->>'terms',
      discount_type = v_discount_type,
      discount_value = v_discount_value,
      original_price = v_original_price,
      offer_price = v_offer_price,
      image_url = v_images[1],
      image_urls = v_images,
      offer_type_label = v_type_label,
      translations = coalesce(p_payload->'translations', '{}'::jsonb),
      valid_from = v_valid_from,
      valid_until = v_valid_until,
      member_only = v_member_only,
      points_required = v_points_required
    where id = p_id
    returning * into v_row;

    if v_row.id is null then
      raise exception 'Offer not found';
    end if;

    insert into public.admin_audit_log (admin_id, action, target_type, target_id, target_label, metadata)
    values (auth.uid(), 'offer_edited', 'offer', v_row.id, v_row.title,
      jsonb_build_object('member_only', v_row.member_only, 'points_required', v_row.points_required));
  end if;

  return v_row;
end;
$$;

drop function public.admin_create_broadcast_notification(text,text,text,text[],text,integer);
create or replace function public.admin_create_broadcast_notification(
  p_title text,
  p_body text,
  p_target text,
  p_image_urls text[] default '{}',
  p_details text default null,
  p_duration_days integer default 7,
  p_translations jsonb default '{}'
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

  insert into public.broadcast_notifications (title, body, details, target_audience, created_by, image_urls, show_in_app, expires_at, translations)
  values (p_title, p_body, v_details, p_target, auth.uid(), v_images, true, pg_catalog.now() + make_interval(days => p_duration_days), coalesce(p_translations, '{}'::jsonb))
  returning * into v_row;

  insert into public.admin_audit_log (admin_id, action, target_type, target_id, target_label, metadata)
  values (auth.uid(), 'broadcast_notification_sent', 'notification', v_row.id, p_title,
    pg_catalog.jsonb_build_object('target_audience', p_target, 'image_count', pg_catalog.cardinality(v_images), 'has_details', v_details is not null, 'duration_days', p_duration_days));

  return v_row;
end;
$$;
revoke all on function public.admin_create_broadcast_notification(text,text,text,text[],text,integer,jsonb) from public,anon;
grant execute on function public.admin_create_broadcast_notification(text,text,text,text[],text,integer,jsonb) to authenticated;

drop function public.admin_support_reply(uuid,text,text);
create or replace function public.admin_support_reply(p_conversation_id uuid, p_body text default null, p_media_path text default null, p_translations jsonb default '{}')
returns public.support_messages
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_body text := nullif(pg_catalog.btrim(coalesce(p_body, '')), '');
  v_user uuid;
  v_name text;
  v_row public.support_messages;
begin
  if not public.is_admin() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  if v_body is null and p_media_path is null then
    raise exception 'A message or an image is required';
  end if;
  if v_body is not null and pg_catalog.char_length(v_body) > 4000 then
    raise exception 'Message is too long (max 4000 characters)';
  end if;
  select c.user_id into v_user from public.support_conversations c where c.id = p_conversation_id;
  if v_user is null then
    raise exception 'Conversation not found';
  end if;
  if p_media_path is not null then
    if p_media_path !~ '^[0-9a-f-]{36}/[A-Za-z0-9._-]{1,120}$' or pg_catalog.split_part(p_media_path, '/', 1) <> v_user::text then
      raise exception 'Invalid image';
    end if;
    if not exists (select 1 from storage.objects o where o.bucket_id = 'support-chat' and o.name = p_media_path) then
      raise exception 'Invalid image';
    end if;
  end if;

  insert into public.support_messages (conversation_id, sender_id, from_admin, body, media_path, media_type, translations)
  values (p_conversation_id, auth.uid(), true, v_body, p_media_path, case when p_media_path is null then null else 'image' end, coalesce(p_translations, '{}'::jsonb))
  returning * into v_row;

  select p.full_name into v_name from public.profiles p where p.id = v_user;
  insert into public.admin_audit_log (admin_id, action, target_type, target_id, target_label, metadata)
  values (auth.uid(), 'support_replied', 'user', v_user, v_name,
    pg_catalog.jsonb_build_object('conversation_id', p_conversation_id, 'has_image', p_media_path is not null));

  return v_row;
end;
$$;
revoke all on function public.admin_support_reply(uuid,text,text,jsonb) from public,anon;
grant execute on function public.admin_support_reply(uuid,text,text,jsonb) to authenticated;

drop function public.get_my_announcements();
create or replace function public.get_my_announcements()
returns table (id uuid, title text, body text, details text, image_urls text[], created_at timestamptz, popup_shown_at timestamptz, read_at timestamptz, translations jsonb)
language sql
stable
security definer
set search_path = ''
as $$
  select n.id, n.title, n.body, n.details, n.image_urls, n.created_at, r.popup_shown_at, r.read_at, n.translations
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

create or replace view public.public_offers
with (security_invoker = true) as
select po.*
from public.partner_offers po
left join public.partners p on p.id = po.partner_id
where po.status = 'approved'
  and (po.valid_from is null or po.valid_from <= now())
  and (po.valid_until is null or po.valid_until >= now())
  and (p.id is null or (p.status = 'verified' and p.is_active));



create or replace function public.admin_set_offer_translations(p_id uuid, p_source jsonb, p_translations jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare current_source jsonb;
begin
  if not public.is_admin() then raise exception 'Not authorized'; end if;
  select jsonb_build_object('title', coalesce(title,''), 'description', coalesce(description,''), 'terms', coalesce(terms,''), 'offer_type_label', coalesce(offer_type_label,''))
    into current_source from public.partner_offers where id=p_id for update;
  if current_source is null or current_source is distinct from p_source then raise exception 'Offer changed; reload and try again'; end if;
  update public.partner_offers set translations=coalesce(p_translations,'{}'::jsonb) where id=p_id;
end;
$$;
revoke all on function public.admin_set_offer_translations(uuid,jsonb,jsonb) from public,anon;
grant execute on function public.admin_set_offer_translations(uuid,jsonb,jsonb) to authenticated;

alter table public.push_devices add column language text not null default 'ar' check (language in ('ar','he','en'));
create or replace function public.set_push_device_language(p_token text, p_language text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or public.is_banned() then raise exception 'Not authorized'; end if;
  if p_language is null or p_language not in ('ar','he','en') then raise exception 'Invalid language'; end if;
  update public.push_devices set language=p_language where token=p_token and user_id=auth.uid();
end;
$$;
revoke all on function public.set_push_device_language(text,text) from public,anon;
grant execute on function public.set_push_device_language(text,text) to authenticated;

create or replace function public.get_localized_push_recipients(p_user_ids uuid[] default null, p_volunteers_only boolean default false)
returns table(user_id uuid, token text, language text) language sql stable security definer set search_path = '' as $$
  select r.user_id,r.token,d.language from public.get_push_recipients(p_user_ids,p_volunteers_only) r join public.push_devices d on d.token=r.token
$$;
revoke all on function public.get_localized_push_recipients(uuid[],boolean) from public,anon,authenticated;
grant execute on function public.get_localized_push_recipients(uuid[],boolean) to service_role;
commit;
