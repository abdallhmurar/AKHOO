-- Availability used to be a manual toggle (volunteer_profiles.is_available
-- flipped by a button in the helper screen). It's now fully automatic:
-- available by default, unavailable while the user has an active request of
-- their own as a REQUESTER, available again the moment that request ends.
-- This has to live in the database, not just the client, because a
-- volunteer's own request can complete/cancel while the helper screen isn't
-- even open - notify-new-request's edge function reads is_available
-- directly to decide who to page, so a stale client-only state would risk
-- notifying (or skipping) the wrong person.

create or replace function public.sync_volunteer_availability_with_own_requests()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if TG_OP = 'INSERT' then
    update public.volunteer_profiles
    set is_available = false, updated_at = now()
    where user_id = new.requester_id;
  elsif TG_OP = 'UPDATE' and new.status in ('completed', 'cancelled') and old.status not in ('completed', 'cancelled') then
    -- Only restore availability if this was their last active request -
    -- guards a scenario the app shouldn't produce (two active requests at
    -- once) rather than one it does.
    if not exists (
      select 1 from public.help_requests
      where requester_id = new.requester_id
        and status not in ('completed', 'cancelled')
        and id <> new.id
    ) then
      update public.volunteer_profiles
      set is_available = true, updated_at = now()
      where user_id = new.requester_id;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists on_help_request_sync_availability on public.help_requests;
create trigger on_help_request_sync_availability
after insert or update on public.help_requests
for each row execute procedure public.sync_volunteer_availability_with_own_requests();
