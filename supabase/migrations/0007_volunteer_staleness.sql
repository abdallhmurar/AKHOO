-- Volunteer presence staleness bound (brief section 34).
-- A volunteer who marked themselves available but hasn't had their
-- volunteer_profiles row touched (background location tick or the app's
-- own foreground heartbeat) in 20 minutes stops counting as available for
-- request-visibility purposes, so a stale/dead session doesn't keep
-- surfacing their old location to requesters indefinitely.

drop policy if exists "request read relevant" on public.help_requests;
create policy "request read relevant" on public.help_requests for select to authenticated using (
  requester_id = auth.uid()
  or volunteer_id = auth.uid()
  or (
    status = 'open'
    and exists (
      select 1 from public.volunteer_profiles vp
      where vp.user_id = auth.uid()
        and vp.is_available = true
        and vp.latitude is not null
        and vp.longitude is not null
        and vp.updated_at > now() - interval '20 minutes'
        and 2 * 6371 * asin(sqrt(
              sin(radians((help_requests.latitude - vp.latitude) / 2)) ^ 2
              + cos(radians(vp.latitude)) * cos(radians(help_requests.latitude))
                * sin(radians((help_requests.longitude - vp.longitude) / 2)) ^ 2
            )) <= 20
    )
  )
);
