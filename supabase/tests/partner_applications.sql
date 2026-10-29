-- Run after 0053 inside BEGIN/ROLLBACK. Uses only temporary fixture rows.
insert into public.partner_applications (id, business_name, category, city, phone, offer, language, source)
values ('b5300000-0000-0000-0000-000000000001', 'Application test', 0, 'Jerusalem', '+972501234567', '', 'en', 'web');

-- Constraints reject malformed rows even for the service role.
do $$ begin
  begin
    insert into public.partner_applications (business_name, category, city, phone) values ('x', 0, 'Jerusalem', '+972501234567');
    raise exception 'Short name accepted';
  exception when check_violation then null; end;
  begin
    insert into public.partner_applications (business_name, category, city, phone) values ('Test', 5, 'Jerusalem', '+972501234567');
    raise exception 'Out-of-range category accepted';
  exception when check_violation then null; end;
  begin
    insert into public.partner_applications (business_name, category, city, phone) values ('Test', 0, 'Jerusalem', 'call me');
    raise exception 'Malformed phone accepted';
  exception when check_violation then null; end;
  begin
    insert into public.partner_applications (business_name, category, city, phone, source) values ('Test', 0, 'Jerusalem', '0501234567', 'fax');
    raise exception 'Unknown source accepted';
  exception when check_violation then null; end;
end $$;

-- Anonymous visitors can neither read, write nor call the admin function.
set local role anon;
do $$ begin
  begin
    perform * from public.partner_applications;
    raise exception 'Anonymous read succeeded';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.partner_applications (business_name, category, city, phone) values ('Test', 0, 'Jerusalem', '0501234567');
    raise exception 'Anonymous insert succeeded';
  exception when insufficient_privilege then null; end;
  begin
    perform public.admin_set_partner_application('b5300000-0000-0000-0000-000000000001', 'contacted', '');
    raise exception 'Anonymous status change succeeded';
  exception when insufficient_privilege then null; end;
end $$;
reset role;

-- A signed-in non-admin sees nothing and changes nothing.
set local role authenticated;
set local request.jwt.claim.sub = 'b5300000-0000-0000-0000-000000000099';
do $$ begin
  assert not exists (select from public.partner_applications), 'Non-admin can read applications';
  begin
    insert into public.partner_applications (business_name, category, city, phone) values ('Test', 0, 'Jerusalem', '0501234567');
    raise exception 'Non-admin insert succeeded';
  exception when insufficient_privilege then null; end;
  begin
    perform public.admin_set_partner_application('b5300000-0000-0000-0000-000000000001', 'contacted', '');
    raise exception 'Non-admin status change succeeded';
  exception when insufficient_privilege then null; end;
end $$;
reset role;

-- An existing admin reads and updates the application.
do $$ declare v_admin uuid; begin
  select id into v_admin from public.profiles where is_admin and not is_banned limit 1;
  assert v_admin is not null, 'Test requires an existing admin';
  perform set_config('request.jwt.claim.sub', v_admin::text, true);
end $$;
set local role authenticated;
do $$ begin
  assert (select count(*) from public.partner_applications where id = 'b5300000-0000-0000-0000-000000000001') = 1, 'Admin cannot read';
  perform public.admin_set_partner_application('b5300000-0000-0000-0000-000000000001', 'contacted', '  called on Sunday  ');
  assert (select status from public.partner_applications where id = 'b5300000-0000-0000-0000-000000000001') = 'contacted', 'Status did not change';
  assert (select note from public.partner_applications where id = 'b5300000-0000-0000-0000-000000000001') = 'called on Sunday', 'Note not trimmed';
  assert (select handled_at is not null and handled_by is not null from public.partner_applications where id = 'b5300000-0000-0000-0000-000000000001'), 'Handler not recorded';
  begin
    perform public.admin_set_partner_application('b5300000-0000-0000-0000-000000000001', 'done', '');
    raise exception 'Unknown status accepted';
  exception when invalid_parameter_value then null; end;
  begin
    perform public.admin_set_partner_application('b5300000-0000-0000-0000-000000000002', 'new', '');
    raise exception 'Missing application accepted';
  exception when invalid_parameter_value then null; end;
end $$;
reset role;
