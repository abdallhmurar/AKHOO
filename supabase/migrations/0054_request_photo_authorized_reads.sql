-- Phase 1 ONLY: allow the new clients to obtain short-lived signed URLs.
-- Do NOT make the bucket private here: released clients still render public URLs.
-- Phase 2 is separately gated in docs/request-photo-privacy-2026-11-01.md.
begin;

drop policy if exists "request photos public read" on storage.objects;
drop policy if exists "request photos owner read" on storage.objects;
drop policy if exists "request photos authorized read" on storage.objects;
create policy "request photos authorized read" on storage.objects
for select to authenticated using (
  bucket_id = 'request-photos'
  and (select auth.uid()) is not null
  and not (select public.is_banned())
  and (
    -- The uploader may preview their own files before the request is created.
    split_part(name, '/', 1) = (select auth.uid())::text
    or exists (
      -- Intentionally SECURITY INVOKER: help_requests RLS is the authority for
      -- requesters, assigned helpers, eligible nearby helpers and admins.
      select 1 from public.help_requests hr
      where split_part(storage.objects.name, '/', 1) = hr.requester_id::text
        and (
          hr.photo_url = storage.objects.name
          or hr.photo_url = 'https://zmpwdufahjmlxfwzafvr.supabase.co/storage/v1/object/public/request-photos/' || storage.objects.name
        )
    )
  )
);

-- Keep old uploaders working. In addition to folder ownership, enforce bans.
drop policy if exists "request photos owner insert" on storage.objects;
create policy "request photos owner insert" on storage.objects
for insert to authenticated with check (
  bucket_id = 'request-photos'
  and (select auth.uid()) is not null
  and not (select public.is_banned())
  and split_part(name, '/', 1) = (select auth.uid())::text
);

commit;
