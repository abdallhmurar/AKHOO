-- Run after 0045 inside BEGIN/ROLLBACK. Uses only temporary fixture rows.
insert into public.partners (id, name, slug, category, status, is_active, logo_url) values
  ('b4500000-0000-0000-0000-000000000001','Website test A','website-test-a','other','verified',true,'https://example.com/a.png'),
  ('b4500000-0000-0000-0000-000000000002','Website test hidden','website-test-hidden','other','verified',false,'https://example.com/b.png'),
  ('b4500000-0000-0000-0000-000000000003','Website test pending','website-test-pending','other','pending',true,'https://example.com/c.png'),
  ('b4500000-0000-0000-0000-000000000004','Website test no image','website-test-no-image','other','verified',true,null);
insert into public.website_partners (business_id, enabled, sort_order)
select id, true, 1 from public.partners where id::text like 'b4500000-%';

set local role anon;
do $$ begin
  assert (select count(*) from public.get_website_partners() where id::text like 'b4500000-%') = 1, 'Hidden/unverified/missing image exposed';
  begin
    perform * from public.website_partners;
    raise exception 'Anonymous settings read succeeded';
  exception when insufficient_privilege then null; end;
  begin
    perform public.admin_save_website_partner('b4500000-0000-0000-0000-000000000001',false,1,false,'','','');
    raise exception 'Anonymous save succeeded';
  exception when insufficient_privilege then null; end;
end $$;
reset role;

set local role authenticated;
set local request.jwt.claim.sub = 'b4500000-0000-0000-0000-000000000099';
do $$ begin
  assert not exists (select from public.website_partners), 'Non-admin settings exposed';
  begin
    perform public.admin_save_website_partner('b4500000-0000-0000-0000-000000000001',false,1,false,'','','');
    raise exception 'Non-admin save succeeded';
  exception when insufficient_privilege then null; end;
  begin
    update public.website_partners set enabled = false;
    raise exception 'Direct update succeeded';
  exception when insufficient_privilege then null; end;
end $$;
reset role;

-- Use an existing admin for the RPC; no account/permission changes are made.
do $$ declare v_admin uuid; begin
  select id into v_admin from public.profiles where is_admin and not is_banned limit 1;
  assert v_admin is not null, 'Test requires an existing admin';
  perform set_config('request.jwt.claim.sub',v_admin::text,true);
end $$;
set local role authenticated;
select public.admin_save_website_partner('b4500000-0000-0000-0000-000000000001',true,0,true,'اسم','Name','שם');
do $$ begin
  assert (select caption->>'en' from public.get_website_partners() where id='b4500000-0000-0000-0000-000000000001') = 'Name', 'Names did not persist';
  assert exists (select from public.admin_audit_log where target_id='b4500000-0000-0000-0000-000000000001' and metadata->>'section'='website_partners'), 'Audit missing';
  begin
    perform public.admin_save_website_partner('b4500000-0000-0000-0000-000000000001',true,0,true,'اسم','','שם');
    raise exception 'Incomplete names accepted';
  exception when invalid_parameter_value then null; end;
  begin
    perform public.admin_save_website_partner('b4500000-0000-0000-0000-000000000004',true,0,false,'','','');
    raise exception 'Missing image accepted';
  exception when invalid_parameter_value then null; end;
  begin
    perform public.admin_save_website_partner('b4500000-0000-0000-0000-000000000001',true,-1,false,'','','');
    raise exception 'Invalid position accepted';
  exception when check_violation then null; end;
end $$;
select public.admin_save_website_partner('b4500000-0000-0000-0000-000000000001',false,0,false,'','','');
set local role anon;
do $$ begin
  assert not exists (select from public.get_website_partners() where id='b4500000-0000-0000-0000-000000000001'), 'Disabled selection still public';
end $$;
reset role;
