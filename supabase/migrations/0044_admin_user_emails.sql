-- Lets the admin panel's Users page search by email and show it. Emails live
-- in auth.users, which the admin client cannot read directly, so these two
-- functions expose just the email column and only to admins (is_admin()).

create or replace function public.admin_find_user_ids_by_email(p_term text)
returns table (user_id uuid)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_term text := pg_catalog.btrim(coalesce(p_term, ''));
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;
  -- Too-short terms would match nearly everyone.
  if pg_catalog.length(v_term) < 2 then
    return;
  end if;
  return query
    select u.id
    from auth.users u
    where u.email ilike '%' || pg_catalog.replace(pg_catalog.replace(pg_catalog.replace(v_term, '\', '\\'), '%', '\%'), '_', '\_') || '%'
    limit 200;
end;
$$;
revoke all on function public.admin_find_user_ids_by_email(text) from public, anon;
grant execute on function public.admin_find_user_ids_by_email(text) to authenticated;

create or replace function public.admin_get_user_emails(p_user_ids uuid[])
returns table (user_id uuid, email text)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;
  return query
    select u.id, u.email::text
    from auth.users u
    where u.id = any (p_user_ids[1:200]);
end;
$$;
revoke all on function public.admin_get_user_emails(uuid[]) from public, anon;
grant execute on function public.admin_get_user_emails(uuid[]) to authenticated;
