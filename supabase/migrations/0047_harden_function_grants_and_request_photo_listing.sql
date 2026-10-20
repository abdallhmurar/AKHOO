begin;

-- 1. SECURITY DEFINER functions were executable by everyone (the default PUBLIC
-- grant), including signed-out visitors. Most check auth.uid()/is_admin() inside
-- and refuse, but expire_stale_offer_redemptions and get_volunteer_completed_count
-- do not, and nothing should be callable anonymously by accident.
-- Signed-in users keep exactly the access they had (granted explicitly now) and
-- the service role keeps access. Trigger functions are left alone: nobody can call
-- them directly, and the signup trigger (handle_new_user) must keep working.
do $$
declare f record;
begin
  for f in
    select p.oid::regprocedure as sig
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prosecdef and p.prorettype <> 'trigger'::regtype
      and has_function_privilege('anon', p.oid, 'execute')
  loop
    execute format('revoke execute on function %s from public, anon', f.sig);
    execute format('grant execute on function %s to authenticated, service_role', f.sig);
  end loop;
end $$;

-- 2. request-photos is a public bucket: photo URLs keep working without any policy.
-- The "public read" SELECT policy additionally let anyone LIST every file in the
-- bucket (every user's folder and file names). Listing is now limited to the
-- signed-in owner's own folder. Uploads (INSERT) and public URLs are unchanged.
drop policy if exists "request photos public read" on storage.objects;
create policy "request photos owner read" on storage.objects for select to authenticated
  using (bucket_id = 'request-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

commit;
