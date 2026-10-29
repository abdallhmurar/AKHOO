-- Partner applications sent from the web, iPhone and Android partner form. Rows are written only by the
-- submit-partner-application edge function (service role); nobody else can insert. Admins read them and
-- set the status and a note through admin_set_partner_application. The row itself records who handled it.
create table public.partner_applications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  business_name text not null check (char_length(btrim(business_name)) between 2 and 80),
  category smallint not null check (category between 0 and 4),
  city text not null check (char_length(btrim(city)) between 2 and 60),
  phone text not null check (phone ~ '^\+?[0-9]{8,15}$'),
  offer text not null default '' check (char_length(offer) <= 280),
  language text not null default 'ar' check (language in ('ar', 'en', 'he')),
  source text not null default 'web' check (source in ('web', 'ios', 'android')),
  status text not null default 'new' check (status in ('new', 'contacted', 'approved', 'rejected')),
  note text not null default '' check (char_length(note) <= 500),
  handled_by uuid references auth.users(id) on delete set null,
  handled_at timestamptz
);
create index partner_applications_created_idx on public.partner_applications (created_at desc);
create index partner_applications_status_idx on public.partner_applications (status, created_at desc);
create index partner_applications_phone_idx on public.partner_applications (phone, created_at desc);

alter table public.partner_applications enable row level security;
revoke all on public.partner_applications from anon, authenticated;
grant select on public.partner_applications to authenticated;
create policy "partner applications admin read" on public.partner_applications
  for select to authenticated using ((select public.is_admin()));

create function public.admin_set_partner_application(p_id uuid, p_status text, p_note text)
returns public.partner_applications
language plpgsql security definer set search_path = ''
as $$
declare
  v_row public.partner_applications;
begin
  if not coalesce(public.is_admin(), false) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  if p_status is null or p_status not in ('new', 'contacted', 'approved', 'rejected') then
    raise exception 'Invalid status' using errcode = '22023';
  end if;
  if char_length(coalesce(p_note, '')) > 500 then
    raise exception 'Note too long' using errcode = '22023';
  end if;
  update public.partner_applications
  set status = p_status, note = btrim(coalesce(p_note, '')), handled_by = auth.uid(), handled_at = now()
  where id = p_id
  returning * into v_row;
  if not found then raise exception 'Application not found' using errcode = '22023'; end if;
  return v_row;
end;
$$;
revoke all on function public.admin_set_partner_application(uuid, text, text) from public, anon;
grant execute on function public.admin_set_partner_application(uuid, text, text) to authenticated;
