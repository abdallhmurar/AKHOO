-- Partner access is an additional permission on a normal AKHOO account.
-- One relationship per user; revocation preserves the relationship and audit
-- history. Only admin RPCs may mutate it. Existing commerce RLS is unchanged.

create table public.partner_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  partner_id uuid not null references public.partners(id) on delete cascade,
  role text not null check (role in ('owner', 'staff')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create index partner_users_partner_active_idx on public.partner_users (partner_id, is_active);
create index partner_users_created_by_idx on public.partner_users (created_by);
create trigger partner_users_set_updated_at before update on public.partner_users
for each row execute procedure public.set_updated_at();

alter table public.partner_users enable row level security;
revoke all on public.partner_users from anon, authenticated;
grant select on public.partner_users to authenticated;

create policy "partner users read own active" on public.partner_users
for select to authenticated using (
  user_id = auth.uid() and is_active and not public.is_banned()
);
create policy "partner users read admin" on public.partner_users
for select to authenticated using (public.is_admin());

-- Caller-bound helper for future partner RPCs. No caller-supplied user ID,
-- no admin bypass, and no recursive lookup through partner_users RLS.
create function public.has_partner_access(p_partner_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select auth.uid() is not null and not public.is_banned() and exists (
    select 1 from public.partner_users pu
    where pu.user_id = auth.uid() and pu.partner_id = p_partner_id and pu.is_active
  );
$$;
revoke all on function public.has_partner_access(uuid) from public, anon;
grant execute on function public.has_partner_access(uuid) to authenticated;

-- Expose only the signed-in user's relationship and linked business name.
-- Even a hidden business can supply its name to its assigned user, without
-- granting SELECT on other businesses or private commerce/customer data.
create function public.get_my_partner_context()
returns table (
  id uuid, user_id uuid, partner_id uuid, role text, is_active boolean,
  created_at timestamptz, created_by uuid, updated_at timestamptz, business_name text
)
language sql stable security definer set search_path = public
as $$
  select pu.id, pu.user_id, pu.partner_id, pu.role, pu.is_active,
    pu.created_at, pu.created_by, pu.updated_at, p.name
  from public.partner_users pu
  join public.partners p on p.id = pu.partner_id
  where pu.user_id = auth.uid() and public.has_partner_access(pu.partner_id);
$$;
revoke all on function public.get_my_partner_context() from public, anon;
grant execute on function public.get_my_partner_context() to authenticated;

alter table public.admin_audit_log drop constraint admin_audit_log_action_check;
alter table public.admin_audit_log add constraint admin_audit_log_action_check check (
  action in (
    'user_banned', 'user_unbanned', 'volunteer_verified', 'volunteer_unverified',
    'request_cancelled', 'business_created', 'business_edited', 'business_activated', 'business_hidden',
    'business_marked_pending', 'business_verified', 'business_suspended', 'business_rejected',
    'offer_created', 'offer_edited', 'offer_approved', 'offer_rejected', 'offer_paused', 'offer_weekly_slot_set',
    'review_hidden', 'review_restored', 'redemption_redeemed', 'redemption_cancelled', 'redemption_refunded',
    'report_resolved', 'report_dismissed', 'broadcast_notification_sent', 'content_banner_updated',
    'partner_access_granted', 'partner_access_updated', 'partner_access_revoked'
  )
);

create function public.admin_set_partner_access(
  p_user_id uuid, p_partner_id uuid, p_role text, p_is_active boolean
)
returns public.partner_users
language plpgsql security definer set search_path = public
as $$
declare
  v_previous public.partner_users;
  v_row public.partner_users;
  v_name text;
  v_action text;
begin
  if auth.uid() is null or not public.is_admin() or public.is_banned() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  if p_role is null or p_role not in ('owner', 'staff') or p_is_active is null then
    raise exception 'Invalid partner permission' using errcode = '22023';
  end if;

  -- Serialize grant/update/revoke for a user, including their first grant.
  select full_name into v_name from public.profiles where id = p_user_id for update;
  if not found then
    raise exception 'User not found' using errcode = '23503';
  end if;
  if p_partner_id is null or not exists (select 1 from public.partners where id = p_partner_id) then
    raise exception 'Business not found' using errcode = '23503';
  end if;

  select * into v_previous from public.partner_users where user_id = p_user_id;
  if v_previous.id is not null and v_previous.partner_id = p_partner_id
    and v_previous.role = p_role and v_previous.is_active = p_is_active then
    return v_previous;
  end if;

  insert into public.partner_users (user_id, partner_id, role, is_active, created_by)
  values (p_user_id, p_partner_id, p_role, p_is_active, auth.uid())
  on conflict (user_id) do update set
    partner_id = excluded.partner_id, role = excluded.role, is_active = excluded.is_active
  returning * into v_row;

  v_action := case
    when p_is_active and not coalesce(v_previous.is_active, false) then 'partner_access_granted'
    when not p_is_active and coalesce(v_previous.is_active, false) then 'partner_access_revoked'
    else 'partner_access_updated'
  end;
  insert into public.admin_audit_log (admin_id, action, target_type, target_id, target_label, metadata)
  values (auth.uid(), v_action, 'user', p_user_id, v_name, jsonb_build_object(
    'partner_user_id', v_row.id, 'partner_id', p_partner_id, 'role', p_role, 'is_active', p_is_active,
    'previous_partner_id', v_previous.partner_id, 'previous_role', v_previous.role,
    'previous_is_active', v_previous.is_active
  ));
  return v_row;
end;
$$;
revoke all on function public.admin_set_partner_access(uuid, uuid, text, boolean) from public, anon;
grant execute on function public.admin_set_partner_access(uuid, uuid, text, boolean) to authenticated;

create function public.admin_revoke_partner_access(p_user_id uuid)
returns void language plpgsql security definer set search_path = public
as $$
declare
  v_row public.partner_users;
  v_name text;
begin
  if auth.uid() is null or not public.is_admin() or public.is_banned() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  select full_name into v_name from public.profiles where id = p_user_id for update;
  if not found then
    raise exception 'User not found' using errcode = '23503';
  end if;
  update public.partner_users set is_active = false where user_id = p_user_id and is_active
  returning * into v_row;
  if not found then return; end if;

  insert into public.admin_audit_log (admin_id, action, target_type, target_id, target_label, metadata)
  values (auth.uid(), 'partner_access_revoked', 'user', p_user_id, v_name,
    jsonb_build_object('partner_user_id', v_row.id, 'partner_id', v_row.partner_id, 'role', v_row.role));
end;
$$;
revoke all on function public.admin_revoke_partner_access(uuid) from public, anon;
grant execute on function public.admin_revoke_partner_access(uuid) to authenticated;
