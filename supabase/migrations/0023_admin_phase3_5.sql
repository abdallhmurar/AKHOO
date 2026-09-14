-- Phase 3-5: partner status workflow, reports (with scoped chat-monitoring
-- access), broadcast notifications, and admin-managed content banners.
--
-- Deliberately NOT built here: per-partner login accounts. That's a second
-- authentication surface (new login flow, partner-scoped RLS, session
-- handling) - a materially different, security-sensitive feature on its
-- own, not a column/RPC extension like everything else in this migration.
-- Admin continues to manage every partner on their behalf, same as today.

-- ── 0. mission_ratings: 0019 shipped this table with only a "participants
--    can read their own" policy - admin was never actually able to see it,
--    even though a Mission Ratings admin page is explicitly in scope here ─

drop policy if exists "mission ratings readable by admin" on public.mission_ratings;
create policy "mission ratings readable by admin" on public.mission_ratings for select to authenticated using (
  public.is_admin()
);

-- ── 1. Partner status workflow (pending/verified/suspended/rejected) ─────
-- admin_upsert_business still hardcodes 'verified' on create (admin-created
-- businesses are already vetted by the admin creating them) - this only
-- adds the missing ability to move a business through the rest of the
-- lifecycle afterward.

create or replace function public.admin_set_business_status(p_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
  v_rows integer;
  v_action text;
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  if p_status not in ('pending', 'verified', 'suspended', 'rejected') then
    raise exception 'Invalid status';
  end if;

  update public.partners set status = p_status where id = p_id
  returning name into v_name;

  get diagnostics v_rows = row_count;
  if v_rows = 0 then
    raise exception 'Business not found';
  end if;

  v_action := case p_status
    when 'pending' then 'business_marked_pending'
    when 'verified' then 'business_verified'
    when 'suspended' then 'business_suspended'
    when 'rejected' then 'business_rejected'
  end;

  insert into public.admin_audit_log (admin_id, action, target_type, target_id, target_label)
  values (auth.uid(), v_action, 'business', p_id, v_name);
end;
$$;

grant execute on function public.admin_set_business_status(uuid, text) to authenticated;

-- ── 2. admin_audit_log: cumulative action/target_type list for this round ─

alter table public.admin_audit_log drop constraint if exists admin_audit_log_target_type_check;
alter table public.admin_audit_log add constraint admin_audit_log_target_type_check check (
  target_type in ('user', 'volunteer', 'request', 'business', 'offer', 'review', 'redemption', 'report', 'notification', 'content_banner')
);

alter table public.admin_audit_log drop constraint if exists admin_audit_log_action_check;
alter table public.admin_audit_log add constraint admin_audit_log_action_check check (
  action in (
    'user_banned', 'user_unbanned',
    'volunteer_verified', 'volunteer_unverified',
    'request_cancelled',
    'business_created', 'business_edited', 'business_activated', 'business_hidden',
    'business_marked_pending', 'business_verified', 'business_suspended', 'business_rejected',
    'offer_created', 'offer_edited', 'offer_approved', 'offer_rejected', 'offer_paused',
    'offer_weekly_slot_set',
    'review_hidden', 'review_restored',
    'redemption_redeemed', 'redemption_cancelled', 'redemption_refunded',
    'report_resolved', 'report_dismissed',
    'broadcast_notification_sent',
    'content_banner_updated'
  )
);

-- ── 3. Reports/complaints - a user reports a request, a chat message, a
--    business, an offer, or another user; admin reviews and resolves ──────

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  target_type text not null check (target_type in ('request', 'message', 'business', 'offer', 'user')),
  target_id uuid not null,
  reason text not null,
  details text,
  status text not null default 'open' check (status in ('open', 'reviewing', 'resolved', 'dismissed')),
  resolution_note text,
  resolved_by uuid references auth.users(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists reports_status_created_idx on public.reports(status, created_at desc);
create index if not exists reports_target_idx on public.reports(target_type, target_id);

alter table public.reports enable row level security;

drop policy if exists "reports insert self" on public.reports;
create policy "reports insert self" on public.reports for insert to authenticated with check (
  reporter_id = auth.uid() and not public.is_banned()
);

drop policy if exists "reports read own or admin" on public.reports;
create policy "reports read own or admin" on public.reports for select to authenticated using (
  reporter_id = auth.uid() or public.is_admin()
);
-- No client update policy - resolution is admin_resolve_report only, so the
-- audit row is always atomic with the status change.

create or replace function public.admin_resolve_report(p_id uuid, p_status text, p_note text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows integer;
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;
  if p_status not in ('reviewing', 'resolved', 'dismissed') then
    raise exception 'Invalid status';
  end if;

  update public.reports set
    status = p_status,
    resolution_note = coalesce(p_note, resolution_note),
    resolved_by = case when p_status in ('resolved', 'dismissed') then auth.uid() else resolved_by end,
    resolved_at = case when p_status in ('resolved', 'dismissed') then now() else resolved_at end
  where id = p_id;

  get diagnostics v_rows = row_count;
  if v_rows = 0 then
    raise exception 'Report not found';
  end if;

  insert into public.admin_audit_log (admin_id, action, target_type, target_id, metadata)
  values (auth.uid(), case when p_status = 'dismissed' then 'report_dismissed' else 'report_resolved' end, 'report', p_id, jsonb_build_object('status', p_status));
end;
$$;

grant execute on function public.admin_resolve_report(uuid, text, text) to authenticated;

-- Chat "monitoring only when needed" (explicit product requirement) enforced
-- at the RLS layer, not just left as a UI convention: admin can read a
-- request's ENTIRE conversation ONLY while an open/reviewing report points
-- at that request, or at any one message inside it (context matters more
-- than the single flagged line for real moderation). Once the report is
-- resolved/dismissed, this access closes again on its own - there is no
-- separate "admin browses all chats" policy anywhere.
drop policy if exists "messages readable by admin when reported" on public.messages;
create policy "messages readable by admin when reported" on public.messages for select to authenticated using (
  public.is_admin() and exists (
    select 1 from public.reports r
    where r.status in ('open', 'reviewing')
      and (
        (r.target_type = 'request' and r.target_id = messages.request_id)
        or (r.target_type = 'message' and exists (
          select 1 from public.messages m2 where m2.id = r.target_id and m2.request_id = messages.request_id
        ))
      )
  )
);

-- ── 4. Broadcast notifications - admin composes, an edge function (service
--    role) does the actual Expo push send and reports back sent_count/
--    sent_at. Same split as notify-new-message: RPC owns the auditable
--    record, the edge function owns the external HTTP call. ────────────────

create table if not exists public.broadcast_notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  target_audience text not null default 'all' check (target_audience in ('all', 'volunteers')),
  sent_count integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

alter table public.broadcast_notifications enable row level security;

drop policy if exists "broadcast notifications read admin" on public.broadcast_notifications;
create policy "broadcast notifications read admin" on public.broadcast_notifications for select to authenticated using (
  public.is_admin()
);
-- No client insert/update - admin_create_broadcast_notification only; the
-- edge function updates sent_count/sent_at using the service role key,
-- which bypasses RLS same as every other service-role edge function here.

create or replace function public.admin_create_broadcast_notification(p_title text, p_body text, p_target text)
returns public.broadcast_notifications
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.broadcast_notifications;
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

  insert into public.broadcast_notifications (title, body, target_audience, created_by)
  values (p_title, p_body, p_target, auth.uid())
  returning * into v_row;

  insert into public.admin_audit_log (admin_id, action, target_type, target_id, target_label, metadata)
  values (auth.uid(), 'broadcast_notification_sent', 'notification', v_row.id, p_title, jsonb_build_object('target_audience', p_target));

  return v_row;
end;
$$;

grant execute on function public.admin_create_broadcast_notification(text, text, text) to authenticated;

-- ── 5. Content banners - the per-language Perks header/Pro Max images built
--    earlier this project were bundled static assets; this makes them
--    admin-editable without a new app build. App falls back to the bundled
--    asset when no active row exists for a slot/language - never a broken
--    or blank banner (see app-side change in the same commit). ────────────

create table if not exists public.content_banners (
  id uuid primary key default gen_random_uuid(),
  slot text not null check (slot in ('perks_header', 'perks_promax')),
  language text not null check (language in ('ar', 'he', 'en')),
  image_url text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (slot, language)
);

alter table public.content_banners enable row level security;

drop policy if exists "content banners read active" on public.content_banners;
create policy "content banners read active" on public.content_banners for select to authenticated using (
  is_active
);
drop policy if exists "content banners read admin" on public.content_banners;
create policy "content banners read admin" on public.content_banners for select to authenticated using (
  public.is_admin()
);

drop trigger if exists content_banners_set_updated_at on public.content_banners;
create trigger content_banners_set_updated_at before update on public.content_banners
for each row execute procedure public.set_updated_at();

create or replace function public.admin_upsert_content_banner(p_slot text, p_language text, p_image_url text, p_is_active boolean)
returns public.content_banners
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.content_banners;
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;
  if p_slot not in ('perks_header', 'perks_promax') then
    raise exception 'Invalid slot';
  end if;
  if p_language not in ('ar', 'he', 'en') then
    raise exception 'Invalid language';
  end if;
  if coalesce(p_image_url, '') = '' then
    raise exception 'Image is required';
  end if;

  insert into public.content_banners (slot, language, image_url, is_active)
  values (p_slot, p_language, p_image_url, coalesce(p_is_active, true))
  on conflict (slot, language) do update set
    image_url = excluded.image_url,
    is_active = excluded.is_active
  returning * into v_row;

  insert into public.admin_audit_log (admin_id, action, target_type, target_id, target_label, metadata)
  values (auth.uid(), 'content_banner_updated', 'content_banner', v_row.id, v_row.slot || ':' || v_row.language, jsonb_build_object('is_active', v_row.is_active));

  return v_row;
end;
$$;

grant execute on function public.admin_upsert_content_banner(text, text, text, boolean) to authenticated;

insert into storage.buckets (id, name, public)
values ('content', 'content', true)
on conflict (id) do nothing;

drop policy if exists "content storage public read" on storage.objects;
create policy "content storage public read" on storage.objects for select to public using (
  bucket_id = 'content'
);
drop policy if exists "content storage admin insert" on storage.objects;
create policy "content storage admin insert" on storage.objects for insert to authenticated with check (
  bucket_id = 'content' and public.is_admin()
);
drop policy if exists "content storage admin update" on storage.objects;
create policy "content storage admin update" on storage.objects for update to authenticated using (
  bucket_id = 'content' and public.is_admin()
);
drop policy if exists "content storage admin delete" on storage.objects;
create policy "content storage admin delete" on storage.objects for delete to authenticated using (
  bucket_id = 'content' and public.is_admin()
);
