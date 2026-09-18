-- Run with psql -v ON_ERROR_STOP=1 on an isolated database after migration 0026.
-- Uses the real schema and authorization helpers; every fixture is rolled back.
begin;
insert into auth.users (id, email) values
  ('a0000000-0000-0000-0000-000000000001', 'partner-admin@local.test'),
  ('a0000000-0000-0000-0000-000000000002', 'partner-owner@local.test'),
  ('a0000000-0000-0000-0000-000000000003', 'partner-other@local.test');
set local sanad.privileged_write = 'on';
update public.profiles set is_admin = true where id = 'a0000000-0000-0000-0000-000000000001';
set local sanad.privileged_write = 'off';
insert into public.partners (id, name, slug, category) values
  ('a0000000-0000-0000-0000-000000000011', 'Local partner test', 'local-partner-test', 'other'),
  ('a0000000-0000-0000-0000-000000000012', 'Other local partner', 'local-partner-other', 'other');

set local role authenticated;
set local request.jwt.claim.sub = 'a0000000-0000-0000-0000-000000000001';
select public.admin_set_partner_access('a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000011', 'owner', true);
select public.admin_set_partner_access('a0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000012', 'staff', true);

set local request.jwt.claim.sub = 'a0000000-0000-0000-0000-000000000002';
do $$ begin
  assert (select count(*) from public.partner_users) = 1, 'RLS exposed another relationship';
  assert (select business_name from public.get_my_partner_context()) = 'Local partner test', 'Incorrect linked context';
  assert public.has_partner_access('a0000000-0000-0000-0000-000000000011'), 'Own access missing';
  assert not public.has_partner_access('a0000000-0000-0000-0000-000000000012'), 'Cross-business access';
  assert not exists (select 1 from public.partners), 'Existing business RLS broadened';
  begin
    perform public.admin_revoke_partner_access('a0000000-0000-0000-0000-000000000003');
    raise exception 'Non-admin revoke succeeded';
  exception when insufficient_privilege then null; end;
  begin
    update public.partner_users set role = 'staff';
    raise exception 'Direct mutation succeeded';
  exception when insufficient_privilege then null; end;
end $$;

set local request.jwt.claim.sub = 'a0000000-0000-0000-0000-000000000001';
select public.admin_revoke_partner_access('a0000000-0000-0000-0000-000000000002');
do $$ begin
  assert (select count(*) from public.partner_users) = 2, 'Revoke deleted history';
  assert (select count(*) from public.admin_audit_log where action = 'partner_access_revoked') = 1, 'Missing audit';
end $$;

set local request.jwt.claim.sub = 'a0000000-0000-0000-0000-000000000002';
do $$ begin
  assert not exists (select 1 from public.partner_users), 'Revoked relationship visible';
  assert not exists (select 1 from public.get_my_partner_context()), 'Revoked context visible';
end $$;
rollback;
