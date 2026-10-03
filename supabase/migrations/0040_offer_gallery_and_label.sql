-- Keep image_url as the cover for installed older apps.
alter table public.partner_offers
  add column image_urls text[] not null default '{}',
  add column offer_type_label text check (char_length(offer_type_label) <= 80),
  add constraint offer_gallery_limit check (cardinality(image_urls) <= 6);
update public.partner_offers set image_urls=array[image_url] where image_url is not null;

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
      member_only, points_required, image_urls, offer_type_label
    ) values (
      v_business_id, p_payload->>'title', p_payload->>'description', p_payload->>'terms',
      v_discount_type, v_discount_value, v_original_price, v_offer_price,
      v_images[1], v_valid_from, v_valid_until, 'draft',
      v_member_only, v_points_required, v_images, v_type_label
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

grant execute on function public.admin_upsert_offer(uuid, jsonb) to authenticated;


-- Refresh SELECT * to expose the new columns while retaining the existing filters and RLS.
create or replace view public.public_offers
with (security_invoker = true) as
select po.*
from public.partner_offers po
left join public.partners p on p.id = po.partner_id
where po.status = 'approved'
  and (po.valid_from is null or po.valid_from <= now())
  and (po.valid_until is null or po.valid_until >= now())
  and (p.id is null or (p.status = 'verified' and p.is_active));

