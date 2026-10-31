-- MANUAL phase 2, never an automatic migration. Read the rollout runbook first.
-- In the same reviewed session, explicitly confirm the shipped client rollout:
-- SET akhoo.request_photo_clients_ready = 'yes';
begin;
do $$
begin
  if current_setting('akhoo.request_photo_clients_ready', true) is distinct from 'yes' then
    raise exception 'Client rollout must be confirmed before closing request photos';
  end if;
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects'
    and policyname='request photos authorized read') then
    raise exception 'Apply and verify migration 0054 first';
  end if;
  if exists (select 1 from pg_policies where schemaname='storage' and tablename='objects'
    and policyname='request photos public read') then
    raise exception 'Public request-photo read policy must be removed first';
  end if;
  if not exists (select 1 from storage.buckets where id='request-photos') then
    raise exception 'Request photo bucket is missing';
  end if;
end $$;
update storage.buckets set public=false where id='request-photos';
commit;
