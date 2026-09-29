-- admin_delete_all_broadcast_notifications's bare `delete from
-- broadcast_notifications;` (no WHERE) was reported failing live with
-- "DELETE requires a WHERE clause" (Postgres/PostgREST code 21000) - a
-- documented safety guard some Postgres/PostgREST configurations enforce
-- against filterless deletes. `where true` is the standard, zero-risk
-- workaround: identical result (every row still matches and is deleted),
-- just syntactically satisfies the guard.

create or replace function public.admin_delete_all_broadcast_notifications()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  insert into public.admin_audit_log (admin_id, action, target_type, target_id, target_label, metadata)
  select auth.uid(), 'broadcast_notification_deleted', 'notification', n.id, n.title,
    pg_catalog.jsonb_build_object('target_audience', n.target_audience, 'sent_count', n.sent_count, 'bulk', true)
  from public.broadcast_notifications n;
  get diagnostics v_count = row_count;

  delete from public.broadcast_notifications where true;

  return v_count;
end;
$$;

revoke all on function public.admin_delete_all_broadcast_notifications() from public, anon;
grant execute on function public.admin_delete_all_broadcast_notifications() to authenticated;
