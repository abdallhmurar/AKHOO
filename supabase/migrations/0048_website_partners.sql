-- Website-only selection. Existing business/app permissions stay unchanged.
create table public.website_partners (
  business_id uuid primary key references public.partners(id) on delete cascade,
  enabled boolean not null default false,
  sort_order integer not null default 0 check (sort_order between 0 and 9999),
  show_name boolean not null default false,
  name_ar text not null default '' check (length(name_ar) <= 80),
  name_en text not null default '' check (length(name_en) <= 80),
  name_he text not null default '' check (length(name_he) <= 80),
  updated_at timestamptz not null default now()
);
alter table public.website_partners enable row level security;
revoke all on public.website_partners from anon, authenticated;
grant select on public.website_partners to authenticated;
create policy "website partners admin read" on public.website_partners
  for select to authenticated using ((select public.is_admin()));

-- Reuse the business_edited audit event, with an explicit section in metadata.
create function public.admin_save_website_partner(
  p_business_id uuid, p_enabled boolean, p_sort_order integer,
  p_show_name boolean, p_name_ar text, p_name_en text, p_name_he text
)
returns public.website_partners
language plpgsql security definer set search_path = ''
as $$
declare
  v_business public.partners;
  v_row public.website_partners;
begin
  if not coalesce(public.is_admin(), false) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  select * into v_business from public.partners where id = p_business_id for share;
  if not found then raise exception 'Business not found' using errcode = '22023'; end if;
  if p_enabled and (v_business.logo_url is null or v_business.logo_url !~ '^https://[^/[:space:]]+/') then
    raise exception 'Business image required' using errcode = '22023';
  end if;
  if p_show_name and (nullif(btrim(p_name_ar), '') is null or nullif(btrim(p_name_en), '') is null or nullif(btrim(p_name_he), '') is null) then
    raise exception 'Names in all three languages required' using errcode = '22023';
  end if;
  insert into public.website_partners (business_id, enabled, sort_order, show_name, name_ar, name_en, name_he)
  values (p_business_id, p_enabled, p_sort_order, p_show_name, btrim(coalesce(p_name_ar, '')), btrim(coalesce(p_name_en, '')), btrim(coalesce(p_name_he, '')))
  on conflict (business_id) do update set
    enabled = excluded.enabled, sort_order = excluded.sort_order,
    show_name = excluded.show_name, name_ar = excluded.name_ar,
    name_en = excluded.name_en, name_he = excluded.name_he, updated_at = now()
  returning * into v_row;
  insert into public.admin_audit_log (admin_id, action, target_type, target_id, target_label, metadata)
  values (auth.uid(), 'business_edited', 'business', p_business_id, v_business.name,
    jsonb_build_object('section', 'website_partners', 'enabled', v_row.enabled, 'sort_order', v_row.sort_order, 'show_name', v_row.show_name));
  return v_row;
end;
$$;
revoke all on function public.admin_save_website_partner(uuid, boolean, integer, boolean, text, text, text) from public, anon;
grant execute on function public.admin_save_website_partner(uuid, boolean, integer, boolean, text, text, text) to authenticated;

-- Anonymous visitors receive only approved display fields, never partner
-- contacts, internal settings or administrative records. Definer is necessary
-- because partners themselves intentionally remain inaccessible to anon.
create function public.get_website_partners()
returns table (id uuid, name text, image text, caption jsonb)
language sql stable security definer set search_path = ''
as $$
  select p.id, p.name, p.logo_url,
    case when w.show_name then jsonb_build_object('ar', w.name_ar, 'en', w.name_en, 'he', w.name_he) else null end
  from public.website_partners w
  join public.partners p on p.id = w.business_id
  where w.enabled and p.is_active and p.status = 'verified'
    and p.logo_url ~ '^https://[^/[:space:]]+/'
  order by w.sort_order, p.id;
$$;
revoke all on function public.get_website_partners() from public;
grant execute on function public.get_website_partners() to anon, authenticated;

-- Carry forward the two businesses already approved for the website.
insert into public.website_partners (business_id, enabled, sort_order, show_name, name_ar, name_en, name_he)
select id, true, 10, false, '', '', '' from public.partners
where id = '4335aa48-8f17-4754-bd74-5b071bc273d6';
insert into public.website_partners (business_id, enabled, sort_order, show_name, name_ar, name_en, name_he)
select id, true, 20, true, 'المحامي موطي أورنج', 'Adv. Moti Oreng', 'עו״ד מוטי אורנג׳' from public.partners
where id = '26baaaf1-0f51-4256-b231-ccdd28ab828b';
